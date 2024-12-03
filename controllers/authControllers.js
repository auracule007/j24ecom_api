const { PrismaClient } = require("@prisma/client");
const { generateToken } = require("../middlewares/generateToken")
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient(); 

exports.register = async( req, res) => {
    const { email, firstName, lastName, phone, address, role, password, confirmPassword  } = req.body;
    try {
        const users = await prisma.user.findUnique({ where: { email: email }})
        if(users) return res.status(400).json({ success: false, message: "User already exists"})

        if(password !== confirmPassword) {
            return res.status(400).json({success: false, message: "Password does not match"})
        }
        const salt = await bcrypt.genSalt(11)
        const hashedPassword = await bcrypt.hash(password, salt)
        const newUser = await prisma.user.create({ data: {
            firstName,
            lastName,
            phone, 
            address, 
            role, 
            email,
            password:hashedPassword,
        }})

        if(!newUser) return response.status(400).json({ success: false, message: "Unable to create user account"})
        res.status(201).json({ success: true, message: "User created successfully", data: newUser})
    } catch (error) {
        console.log({ message: error.message })
    }
}


exports.login = async (req, res ) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email }})
        if(!user) return res.status(400).json({ success: false, message: "User not found"})
        
        const validatePassword = await bcrypt.compare(password, user.password)
        if(!validatePassword) return res.status(400).json({ success: false, message: "Password is nor correct"})

        const token = generateToken(user.id, user.role);
        if(!token) return res.status(400).json({ success: false, message: "Invalid token"});

        return res.header("auth-token", token).status(200).json({success: true, message:"You are now logged in", token: token})
        
    } catch (error) {
        console.log({ message: error.message })
    }
}