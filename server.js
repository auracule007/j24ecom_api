const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

dotenv.config();
connectDB()

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB'
    });
  }
  next(err);
});


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://primefourmotors.vercel.app","*"], // Allows any frontend
    credentials: true, // Allows cookies, authentication headers
    allowedHeaders: ["Content-Type", "Authorization", "auth-token"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
// app.use(
//   cors({
//     origin: "https://ecommerce-five-inky.vercel.app",
//     // origin: "http://localhost:5173",
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization", "auth-token"],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//   })
// );
app.use("/", categoryRoutes);
app.use("/", productRoutes);
app.use("/", authRoutes);
app.use("/", cartRoutes);
app.use("/", paymentRoutes);
app.use('/api/admin', adminRoutes);

// Extended configuration for Swagger documentation
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "J24 Ecommerce API Documentation",
      version: "1.0.0",
      description: "API information for your Express app",
      contact: {
        name: "batch j24",
        email: "auracule034@gmail.com",
      },
      servers: [
        {
          url: "*",
        },
      ],
    },
  },
  apis: ["./routes/*.js"], // Path to your API files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}!`));
