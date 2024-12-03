const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        let carts = await prisma.cart.findUnique({ where: {userId: req.user.id }})
        console.log("CartId", carts)
        if(!carts) {
            carts = await prisma.cart.create({ data: { userId: req.user.id }})
        }
        const product = await prisma.product.findUnique({ where: {id: productId}})
        if(!product) return res.status(400).json({ success:false,message: "Product not found"})

        let cartitems = await prisma.cartItems.findFirst({ where: {
            cartId: carts.id,
            productId: product.id
        }})
        if(cartitems) {
            cartitems = await prisma.cartItems.update({
                where: { id: cartitems.id },
                data: {
                    quantity: cartitems.quantity + quantity,
                    amount: product.price * (cartitems.quantity + quantity),
                }
            })
        }else {
            cartitems = await prisma.cartItems.create({
                data: {
                    cartId: carts.id,
                    productId: productId,
                    quantity: quantity,
                    amount: product.price * quantity,
                    paid: false,
                }
            })
        }
        return res.status(200).json({ success: true, message: "product added to cart successfully", data: cartitems})
    } catch (error) {
        console.log({ message: error.message })
    }
}


exports.getCart = async(req, res) => {
    try{
        const carts = await prisma.cart.findUnique({ where: {userId: req.user.id}})
        if(!carts) return res.status(400).json({ success:false, message: "No carts found"})

        const cartitems = await prisma.cartItems.findMany({ where: {cartId: carts.id}, include: {product: true}})
        return res.status(200).json({ success: true, products: cartitems})
    }catch(error) {
        console.log({ message: error.message })
    }
}


exports.deleteCart = async(req, res) => {
    const { productId } = req.body;
    try {
        const carts = await prisma.cart.findUnique({ where: { userId: req.user.id}})
        if(!carts) return res.status(400).json({ success:false, message: "Cart not found"})

        const cartitems = await prisma.cartItems.findFirst({ where: {
            cartId: carts.id,
            productId: productId
        }})

        const deleteitems = await prisma.cartItems.delete({ where: {id: cartitems.id}})
        if(deleteitems){
            return res.status(200).json({ success: true, message: "Deleted successfully", data: deleteitems})
        }else {
            return res.status(400).json({ success: false, message: "product does not exist in cart"})
        }
    } catch (error) {
        console.log({ message: error.message })
    }
}

exports.updateCart = async (req, res) => {
    const { productId, quantity} = req.body;
    try {
        const carts = await prisma.cart.findUnique({ where: { userId: req.user.id }})
        if(!carts) return res.status(400).json({ success: false, message: "Cart not found"})

        const product = await prisma.product.findUnique({ where: {id: productId}})
        if(!product) return res.status(400).json({ success:false,message: "Product not found"})

        let cartitems = await prisma.cartItems.findFirst({ where: {
            cartId: carts.id,
            productId: productId
        }})
        if(cartitems) {
            cartitems = await prisma.cartItems.update({
                where: { id: cartitems.id },
                data: {
                    quantity: cartitems.quantity + quantity,
                    amount: product.price * (cartitems.quantity + quantity),
                }
            })
        }
        return res.status(200).json({ success: true, message: "Cartitems updated successfully", data: cartitems})
        
    } catch (error) {
        console.log({ message: error.message })
    }
}