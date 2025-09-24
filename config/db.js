const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Connected to Database Successfully!");
  } catch (error) {
    console.error("Unable to connect to database:", error.message);
    process.exit(1);
  }

  process.on("beforeExit", async () => {
    await prisma.$disconnect();
    console.log("Disconnected from Database");
  });
}

module.exports = connectDB ;
