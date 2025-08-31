
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../config/cloudinary");
const prisma = new PrismaClient();

exports.createProduct = async (req, res) => {
  const {
    categoryId,
    name,
    description,
    price,
    featured,
    trending,
    make,
    model,
    year,
    mileage,
    engine,
    transmission,
    fuelType,
    loadCapacity,
    condition,
    features
  } = req.body;

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId, 10) }
    });
    
    if (!category) {
      return res.status(400).json({ success: false, message: "Invalid categoryId" });
    }

    // Handle main image upload
    let mainImage = null;
    if (req.files && req.files.mainImage) {
      try {
        const file = await cloudinary.uploader.upload(
          `data:${req.files.mainImage[0].mimetype};base64,${req.files.mainImage[0].buffer.toString("base64")}`
        );
        mainImage = file.secure_url;
        console.log("Main image uploaded successfully");
      } catch (error) {
        console.log("Main image upload failed:", error.message);
      }
    }

    // Handle additional images upload
    let additionalImages = [];
    if (req.files && req.files.additionalImages) {
      for (const file of req.files.additionalImages) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
          );
          additionalImages.push({ imageUrl: result.secure_url });
        } catch (error) {
          console.log("Additional image upload failed:", error.message);
        }
      }
    }

    // Parse features if it's a string
    let featuresArray = [];
    if (features) {
      featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
    }

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        name,
        image: mainImage,
        description,
        price: parseInt(price),
        featured: Boolean(featured),
        trending: Boolean(trending),
        make,
        model,
        year: year ? parseInt(year) : null,
        mileage: mileage ? parseInt(mileage) : null,
        engine,
        transmission,
        fuelType,
        loadCapacity,
        condition,
        features: {
          create: featuresArray.map(feature => ({ feature }))
        },
        images: {
          create: additionalImages
        }
      },
      include: {
        features: true,
        images: true,
        category: true
      }
    });

    if (!product) {
      return res.status(400).json({ success: false, message: "Product not added" });
    }

    res.status(201).json({ success: true, message: "Product created successfully", data: product });
  } catch (error) {
    console.log({ error: error.message });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all products
exports.getProduct = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        features: true,
        images: true
      }
    });
    
    if (!products) {
      return res.status(400).json({ success: false, message: "No products found" });
    }
    
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.log({ message: error.message });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single product by ID
exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { 
        category: true,
        features: true,
        images: true
      }
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.log({ message: error.message });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      featured,
      trending,
      make,
      model,
      year,
      mileage,
      engine,
      transmission,
      fuelType,
      loadCapacity,
      condition,
      features: featureData
    } = req.body;

    // Handle main image upload if provided
    let mainImage = undefined;
    if (req.files && req.files.mainImage) {
      try {
        const file = await cloudinary.uploader.upload(
          `data:${req.files.mainImage[0].mimetype};base64,${req.files.mainImage[0].buffer.toString("base64")}`
        );
        mainImage = file.secure_url;
        console.log("Main image uploaded successfully");
      } catch (error) {
        console.log("Main image upload failed:", error.message);
      }
    }

    // Handle additional images upload if provided
    let additionalImages = [];
    if (req.files && req.files.additionalImages) {
      for (const file of req.files.additionalImages) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
          );
          additionalImages.push({ imageUrl: result.secure_url });
        } catch (error) {
          console.log("Additional image upload failed:", error.message);
        }
      }
    }

    // Parse features if it's a string
    let featuresArray = [];
    if (featureData) {
      featuresArray = typeof featureData === 'string' ? JSON.parse(featureData) : featureData;
    }

    // First delete existing features and images
    await prisma.productFeature.deleteMany({
      where: { productId: parseInt(id) }
    });
    
    await prisma.productImage.deleteMany({
      where: { productId: parseInt(id) }
    });

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseInt(price),
        featured: Boolean(featured),
        trending: Boolean(trending),
        make,
        model,
        year: year ? parseInt(year) : null,
        mileage: mileage ? parseInt(mileage) : null,
        engine,
        transmission,
        fuelType,
        loadCapacity,
        condition,
        ...(mainImage && { image: mainImage }),
        features: {
          create: featuresArray.map(feature => ({ feature }))
        },
        images: {
          create: additionalImages
        }
      },
      include: {
        features: true,
        images: true,
        category: true
      }
    });

    res.status(200).json({ success: true, message: "Product updated successfully", data: product });
  } catch (error) {
    console.log({ message: error.message });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First delete features and images (due to foreign key constraint)
    await prisma.productFeature.deleteMany({
      where: { productId: parseInt(id) }
    });
    
    await prisma.productImage.deleteMany({
      where: { productId: parseInt(id) }
    });
    
    // Then delete the product
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.log({ message: error.message });
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};












// const { PrismaClient} = require("@prisma/client");
// const cloudinary = require("../config/cloudinary");
// const prisma = new PrismaClient();


// exports.createProduct = async(req, res) => {
//     const { categoryId, name, description, price, featured, trending } = req.body;
//     try {
//         const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId, 10) }})
//         if(!category) return res.status(400).json({ success: false, message: "Invalid categoryId"})

//         let result;
//         try {
//             const file = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`)
//             result= file
//             console.log("Image uploaded successfully")
//         } catch (error) {
//             console.log("Image not uploaded successfully")
//         }
//         const product = await prisma.product.create({ data: { 
//             categoryId: category.id,
//             name, 
//             image: result.secure_url,  
//             description, 
//             price: parseInt(price), 
//             featured: Boolean(featured), 
//             trending: Boolean(trending) } })
//         if(!product) return res.status(400).json({ success: false, message:" product not added"})
//         res.status(201).json({ success: true, message: "Product created successfully", data: product})
//     } catch (error) {
//         console.log({ error: error.message })
//     }
// }

// // get all products 
// exports.getProduct = async(req, res) => {
//     try {
//         const products = await prisma.product.findMany({ include: { category: true }});
//         if(!products) return res.status(400).json({ success: false, message: "No products found"})
//         return res.status(200).json({ success: true, data: products })
//     } catch (error) {
//         console.log({ message: error.message })
//     }
// }