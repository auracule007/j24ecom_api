const nodemailer = require("nodemailer");
const dotenv = require("dotenv");


dotenv.config();


const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
  service: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});


module.exports = transporter;