const { PrismaClient } = require('@prisma/client');
const cloudinary = require('../config/cloudinary');
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
    // Validate required fields
    if (!categoryId || !name || !description || !price) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: categoryId, name, description, price" 
      });
    }

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
        const file = req.files.mainImage[0];
        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'products' }
        );
        mainImage = uploadResult.secure_url;
      } catch (error) {
        console.log("Main image upload failed:", error.message);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload main image" 
        });
      }
    }

    // Handle additional images upload
    let additionalImages = [];
    if (req.files && req.files.additionalImages) {
      for (const file of req.files.additionalImages) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            { folder: 'products/additional' }
          );
          additionalImages.push({ imageUrl: uploadResult.secure_url });
        } catch (error) {
          console.log("Additional image upload failed:", error.message);
          // Continue with other images even if one fails
        }
      }
    }

    // Parse features if it's a string
    let featuresArray = [];
    if (features) {
      try {
        featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
        if (!Array.isArray(featuresArray)) {
          featuresArray = [featuresArray];
        }
      } catch (error) {
        console.log("Features parsing failed:", error.message);
        featuresArray = [];
      }
    }

    const product = await prisma.product.create({
      data: {
        categoryId: parseInt(categoryId, 10),
        name,
        image: mainImage,
        description,
        price: parseInt(price, 10),
        featured: featured === 'true' || featured === true,
        trending: trending === 'true' || trending === true,
        make: make || null,
        model: model || null,
        year: year ? parseInt(year, 10) : null,
        mileage: mileage ? parseInt(mileage, 10) : null,
        engine: engine || null,
        transmission: transmission || null,
        fuelType: fuelType || null,
        loadCapacity: loadCapacity || null,
        condition: condition || null,
        features: {
          create: featuresArray.map(feature => ({ feature: feature.toString() }))
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

    res.status(201).json({ 
      success: true, 
      message: "Product created successfully", 
      data: product 
    });
  } catch (error) {
    console.log("Create product error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        features: true,
        images: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    if (!products || products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No products found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.log("Get products error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get single product by ID
exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }
    
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: { 
        category: true,
        features: true,
        images: true
      }
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: product 
    });
  } catch (error) {
    console.log("Get single product error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }
    
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) }
    });
    
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Handle main image upload if provided
    let mainImage = undefined;
    if (req.files && req.files.mainImage) {
      try {
        const file = req.files.mainImage[0];
        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'products' }
        );
        mainImage = uploadResult.secure_url;
      } catch (error) {
        console.log("Main image upload failed:", error.message);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload main image" 
        });
      }
    }

    // Handle additional images upload if provided
    let additionalImages = undefined;
    if (req.files && req.files.additionalImages) {
      additionalImages = [];
      for (const file of req.files.additionalImages) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            { folder: 'products/additional' }
          );
          additionalImages.push({ imageUrl: uploadResult.secure_url });
        } catch (error) {
          console.log("Additional image upload failed:", error.message);
          // Continue with other images even if one fails
        }
      }
    }

    // Parse features if it's a string
    let featuresArray = [];
    if (featureData) {
      try {
        featuresArray = typeof featureData === 'string' ? JSON.parse(featureData) : featureData;
        if (!Array.isArray(featuresArray)) {
          featuresArray = [featuresArray];
        }
      } catch (error) {
        console.log("Features parsing failed:", error.message);
        featuresArray = [];
      }
    }

    // Prepare update data
    const updateData = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      price: price ? parseInt(price, 10) : existingProduct.price,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : existingProduct.featured,
      trending: trending !== undefined ? (trending === 'true' || trending === true) : existingProduct.trending,
      make: make !== undefined ? make : existingProduct.make,
      model: model !== undefined ? model : existingProduct.model,
      year: year !== undefined ? (year ? parseInt(year, 10) : null) : existingProduct.year,
      mileage: mileage !== undefined ? (mileage ? parseInt(mileage, 10) : null) : existingProduct.mileage,
      engine: engine !== undefined ? engine : existingProduct.engine,
      transmission: transmission !== undefined ? transmission : existingProduct.transmission,
      fuelType: fuelType !== undefined ? fuelType : existingProduct.fuelType,
      loadCapacity: loadCapacity !== undefined ? loadCapacity : existingProduct.loadCapacity,
      condition: condition !== undefined ? condition : existingProduct.condition,
    };

    // Add image if provided
    if (mainImage) {
      updateData.image = mainImage;
    }

    // Start transaction for updates
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
        include: {
          features: true,
          images: true,
          category: true
        }
      });

      // Update features if provided
      if (featuresArray.length > 0) {
        // Delete existing features
        await tx.productFeature.deleteMany({
          where: { productId: parseInt(id, 10) }
        });
        
        // Create new features
        await tx.productFeature.createMany({
          data: featuresArray.map(feature => ({
            feature: feature.toString(),
            productId: parseInt(id, 10)
          }))
        });
      }

      // Update images if provided
      if (additionalImages && additionalImages.length > 0) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: parseInt(id, 10) }
        });
        
        // Create new images
        await tx.productImage.createMany({
          data: additionalImages.map(image => ({
            imageUrl: image.imageUrl,
            productId: parseInt(id, 10)
          }))
        });
      }

      // Return updated product with relations
      return await tx.product.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
          features: true,
          images: true,
          category: true
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: "Product updated successfully", 
      data: result 
    });
  } catch (error) {
    console.log("Update product error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) }
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    // Delete the product (features and images will be deleted automatically due to onDelete: Cascade)
    await prisma.product.delete({
      where: { id: parseInt(id, 10) }
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Product deleted successfully" 
    });
  } catch (error) {
    console.log("Delete product error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};