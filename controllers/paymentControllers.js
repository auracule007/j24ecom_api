const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const { connect } = require("../routes/paymentRoutes");
const prisma = new PrismaClient();
const transporter = require("../config/email");

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

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
    if (!cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const orderId = uuidv4();
    const paymentData = {
      tx_ref: orderId,
      amount,
      currency: "NGN",
      redirect_url: "http://localhost:5173/thankyou",
      // redirect_url: 'http://localhost:8000/api/verify-payment',
      customer: {
        email: users.email,
        name: users.firstName,
        phonenumber: users.phone,
      },
      meta: {
        firstName,
        lastName,
        email,
        address,
        phone,
      },
      customizations: {
        title: "J24 ecommerce Standard Payment",
        description: "Standard payment for your order",
      },
    };

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
    const data = await response.json();
    if (data.status === "success") {
      return res
        .status(200)
        .json({
          success: true,
          message: "Payment successful",
          data: data.data.link,
          orderId,
        });
    } else {
      res.status(404).json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  const { transaction_Id, orderId } = req.body;
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_Id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );
    const data = await response.json();
    console.log(data);
    console.log("order amount", data.data.amount);
    if (data.status === "success") {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { cartItems: true },
      });
      if (!cart)
        return res
          .status(400)
          .json({ success: false, message: "Cart not found" });

      if (cart.cartItems.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "Cart is empty" });

      const orders = await prisma.order.create({
        data: {
          user: { connect: { id: req.user.id } },
          orderId,
          firstName: data.data.meta.firstName,
          lastName: data.data.meta.lastName,
          email: data.data.meta.email,
          address: data.data.meta.address,
          phone: data.data.meta.phone,
          amount: data.data.amount,
          transactionId: transaction_Id,
          status: "COMPLETED",
          orderItems: {
            create: cart.cartItems.map((items) => ({
              products: { connect: { id: items.productId } },
              quantity: items.quantity,
              paid: true,
              // paid: items.paid !== undefined ? items.paid : true,
              amount: items.amount,
            })),
          },
        },
        include: {
          user: true, // Include user details
          orderItems: true, // Include order items
        },
      });
      try {
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: data.data.meta.email, // list of receivers
          subject: "Notification of Payment", // Subject line
          text: "Payment has been made successfully", // plain text body
        };
        await transporter.sendMail(mailOptions);
        console.log("Sent mail");
      } catch (error) {
        console.log("Mail not sent");
      }
      await prisma.cartItems.deleteMany({ where: { cartId: cart.id } });
      return res
        .status(201)
        .json({
          success: true,
          message: "Order created successfully",
          data: orders,
        });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log({ message: error.message });
  }
};
