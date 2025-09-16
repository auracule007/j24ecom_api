const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const generateOrderId = require("../utils/generateOrderId");
const prisma = new PrismaClient();
const transporter = require("../config/email");

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

exports.initiatePayment = async (req, res) => {
  const { user } = req;
  const { firstName, lastName, email, address, phone, amount } = req.body;
  try {
    const users = await prisma.user.findUnique({ where: { id: user.id } });
    if (!users)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { cartItems: true },
    });
    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const orderId = uuidv4();
    const paymentData = {
      email: users.email,
      amount: amount * 100, // Paystack expects amount in kobo
      reference: orderId,
      callback_url:
        "http://localhost:5173/thankyou" ||
        "https://primefourmotors.vercel.app/thankyou",
      metadata: {
        firstName,
        lastName,
        email,
        address,
        phone,
      },
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (data.status === true) {
      return res.status(200).json({
        success: true,
        message: "Payment successful",
        data: data.data.authorization_url,
        orderId,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log({ message: error.message });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// exports.verifyPayment = async (req, res) => {
//   const { reference, orderId } = req.body; 
//   try {
//     const response = await fetch(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//         },
//       }
//     );
//     const data = await response.json();
//     console.log("Paystack Verify Response:", data);

//     if (data.status === true && data.data.status === "success") {
//       const cart = await prisma.cart.findUnique({
//         where: { userId: req.user.id },
//         include: { cartItems: true },
//       });

//       if (!cart) {
//         return res.status(400).json({ success: false, message: "Cart not found" });
//       }
//       if (cart.cartItems.length === 0) {
//         return res.status(400).json({ success: false, message: "Cart is empty" });
//       }

//       // ✅ Create order
//       const orders = await prisma.order.create({
//         data: {
//           user: { connect: { id: req.user.id } },
//           orderId, // must come from frontend during initialize
//           firstName: data.data.metadata.firstName,
//           lastName: data.data.metadata.lastName,
//           email: data.data.metadata.email,
//           address: data.data.metadata.address,
//           phone: data.data.metadata.phone,
//           amount: data.data.amount / 100, // kobo → naira
//           transactionId: reference,
//           status: "COMPLETED",
//           orderItems: {
//             create: cart.cartItems.map((items) => ({
//               products: { connect: { id: items.productId } },
//               quantity: items.quantity,
//               paid: true,
//               amount: items.amount,
//             })),
//           },
//         },
//         include: {
//           user: true,
//           orderItems: true,
//         },
//       });

//       // ✅ Send mail
//       try {
//         const mailOptions = {
//           from: process.env.EMAIL_HOST_USER,
//           to: data.data.metadata.email,
//           subject: "Notification of Payment",
//           text: "Payment has been made successfully at Prime Four Motors",
//         };
//         await transporter.sendMail(mailOptions);
//         console.log("Sent mail");
//       } catch (error) {
//         console.log("Mail not sent:", error.message);
//       }
//       console.log("Order created:", orders);
//       // ✅ Clear cart
//       await prisma.cartItems.deleteMany({ where: { cartId: cart.id } });

//       return res.status(201).json({
//         success: true,
//         message: "Order created successfully",
//         data: orders,
//       });
//     } else {
//       return res.status(400).json({ success: false, message: "Payment failed" });
//     }
//   } catch (error) {
//     console.log({ message: error.message });
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };


exports.verifyPayment = async (req, res) => {
  const { reference, orderId } = req.body;
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();
    console.log("Paystack Verify Response:", data);

    if (data.status === true && data.data.status === "success") {
      // ✅ Check if order already exists
      const existingOrder = await prisma.order.findFirst({
        where: {
          OR: [{ transactionId: reference }, { orderId: orderId }],
        },
        include: {
          user: true,
          orderItems: {
            include: { products: true },
          },
        },
      });

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Order already exists",
          data: {
            ...existingOrder,
            fullName: `${existingOrder.firstName} ${existingOrder.lastName}`,
            created_at: existingOrder.created_at,
          },
        });
      }

      // ✅ Get cart
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { cartItems: true },
      });

      if (!cart) {
        return res
          .status(400)
          .json({ success: false, message: "Cart not found" });
      }
      if (cart.cartItems.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Cart is empty" });
      }

      // ✅ Generate orderId if not provided
      const finalOrderId = orderId || generateOrderId();

      // ✅ Create order
      const orders = await prisma.order.create({
        data: {
          user: { connect: { id: req.user.id } },
          orderId: finalOrderId,
          firstName: data.data.metadata.firstName,
          lastName: data.data.metadata.lastName,
          email: data.data.metadata.email,
          address: data.data.metadata.address,
          phone: data.data.metadata.phone,
          amount: data.data.amount / 100, // kobo → naira
          transactionId: reference,
          status: "COMPLETED",
          orderItems: {
            create: cart.cartItems.map((items) => ({
              products: { connect: { id: items.productId } },
              quantity: items.quantity,
              paid: true,
              amount: items.amount,
            })),
          },
        },
        include: {
          user: true,
          orderItems: {
            include: { products: true },
          },
        },
      });

      // ✅ Send mail
      try {
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: data.data.metadata.email,
          subject: "Notification of Payment",
          text: `Payment has been made successfully at Prime Four Motors. Your order ID is ${finalOrderId}`,
        };
        await transporter.sendMail(mailOptions);
        console.log("Sent mail");
      } catch (error) {
        console.log("Mail not sent:", error.message);
      }

      console.log("Order created:", orders);

      // ✅ Clear cart
      await prisma.cartItems.deleteMany({ where: { cartId: cart.id } });

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          ...orders,
          fullName: `${orders.firstName} ${orders.lastName}`,
          created_at: orders.createdAt,
        },
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log({ message: error.message });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// In your order controller file (e.g., controllers/orderController.js)

exports.orderHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have authentication middleware
    
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      include: {
        orderItems: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history'
    });
  }
};