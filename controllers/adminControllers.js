
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('../config/cloudinary');
const prisma = new PrismaClient();

// ==================== CATEGORY ADMIN CONTROLLERS ====================
// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get single category
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        description,
        image: image || null
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;
    
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        image
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });
    
    if (categoryWithProducts.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated products'
      });
    }
    
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// ==================== PRODUCT ADMIN CONTROLLERS ====================
// Get all products with filters and pagination
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured, trending, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let where = {};
    
    // Filter by category
    if (category) {
      where.categoryId = parseInt(category);
    }
    
    // Filter by featured
    if (featured !== undefined) {
      where.featured = featured === 'true';
    }
    
    // Filter by trending
    if (trending !== undefined) {
      where.trending = trending === 'true';
    }
    
    // Search by name or description
    // if (search) {
    //   where.OR = [
    //     { name: { contains: search, mode: "insensitive" } },
    //     { description: { contains: search, mode: "insensitive" } }
    //   ];
    // }
    if (search) {
      where.OR = [
        { name: { contains: search.toLowerCase() } },
        { description: { contains: search.toLowerCase() } }
      ];
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        features: true,
        images: true,
        cartItems: true,
        orderItems: true
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        created_at: 'desc'
      }
    });
    
    const total = await prisma.product.count({ where });
    
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get product statistics
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await prisma.product.count();
    const featuredProducts = await prisma.product.count({ where: { featured: true } });
    const trendingProducts = await prisma.product.count({ where: { trending: true } });
    const productsByCategory = await prisma.product.groupBy({
      by: ['categoryId'],
      _count: {
        id: true
      }
    });
    
    // Get category names for the counts
    const categories = await prisma.category.findMany({
      where: {
        id: { in: productsByCategory.map(item => item.categoryId) }
      }
    });
    
    const categoryStats = productsByCategory.map(item => {
      const category = categories.find(cat => cat.id === item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category ? category.name : 'Unknown',
        count: item._count.id
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        featuredProducts,
        trendingProducts,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics',
      error: error.message
    });
  }
};

// ==================== PRODUCT CREATION WITH FEATURES AND IMAGES ====================

exports.createProduct = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      featured,
      trending,
      latest,
      make,
      model,
      year,
      mileage,
      engine,
      transmission,
      fuelType,
      loadCapacity,
      condition,
      features: featuresData
    } = req.body;

    // ✅ Validate required fields
    if (!categoryId || !name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, name, description, and price are required',
      });
    }

    // ✅ Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }

    // ✅ Upload main image to Cloudinary
    let mainImageUrl = null;
    if (req.files && req.files.mainImage) {
      try {
        const file = req.files.mainImage[0];
        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'products/main' }
        );
        mainImageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Main image upload failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload main image',
        });
      }
    }

    // ✅ Upload additional images
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
          console.error('Additional image upload failed:', error);
          // Continue with others
        }
      }
    }

    // ✅ Parse features
    let featuresArray = [];
    if (featuresData) {
      try {
        featuresArray =
          typeof featuresData === 'string'
            ? JSON.parse(featuresData)
            : featuresData;

        if (!Array.isArray(featuresArray)) {
          featuresArray = [featuresArray];
        }
      } catch (error) {
        console.error('Features parsing failed:', error);
        featuresArray = [];
      }
    }

    // ✅ Create product in transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create main product
      const newProduct = await tx.product.create({
        data: {
          categoryId: parseInt(categoryId),
          name,
          description,
          price: parseInt(price),
          image: mainImageUrl,
          featured: featured === 'true' || featured === true,
          trending: trending === 'true' || trending === true,
          latest: latest === 'true' || latest === true,
          make: make || null,
          model: model || null,
          year: year ? parseInt(year) : null,
          mileage: mileage ? parseInt(mileage) : null,
          engine: engine || null,
          transmission: transmission || null,
          fuelType: fuelType || null,
          loadCapacity: loadCapacity || null,
          condition: condition || null,
        },
      });

      // Insert features
      if (featuresArray.length > 0) {
        await tx.productFeature.createMany({
          data: featuresArray.map((feature) => ({
            feature: feature.toString(),
            productId: newProduct.id,
          })),
        });
      }

      // Insert additional images
      if (additionalImages.length > 0) {
        await tx.productImage.createMany({
          data: additionalImages.map((image) => ({
            imageUrl: image.imageUrl,
            productId: newProduct.id,
          })),
        });
      }

      // Return full product with relations
      return await tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: true,
          features: true,
          images: true,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

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


// ==================== UPDATE PRODUCT WITH FEATURES AND IMAGES ====================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    let mainImageUrl;
    if (req.files?.mainImage) {
      const file = req.files.mainImage[0];
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        { folder: 'products/main' }
      );
      mainImageUrl = uploadResult.secure_url;
    }

    let additionalImages;
    if (req.files?.additionalImages) {
      additionalImages = [];
      for (const file of req.files.additionalImages) {
        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'products/additional' }
        );
        additionalImages.push({ imageUrl: uploadResult.secure_url });
      }
    }

    let featuresArray = [];
    if (data.features) {
      featuresArray = typeof data.features === 'string' ? JSON.parse(data.features) : data.features;
      if (!Array.isArray(featuresArray)) featuresArray = [featuresArray];
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updateData = {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        price: data.price ? parseInt(data.price) : existing.price,
        featured: data.featured ? (data.featured === 'true' || data.featured === true) : existing.featured,
        trending: data.trending ? (data.trending === 'true' || data.trending === true) : existing.trending,
        latest: data.latest ? (data.latest === 'true' || data.latest === true) : existing.latest,
        make: data.make ?? existing.make,
        model: data.model ?? existing.model,
        year: data.year ? parseInt(data.year) : existing.year,
        mileage: data.mileage ? parseInt(data.mileage) : existing.mileage,
        engine: data.engine ?? existing.engine,
        transmission: data.transmission ?? existing.transmission,
        fuelType: data.fuelType ?? existing.fuelType,
        loadCapacity: data.loadCapacity ?? existing.loadCapacity,
        condition: data.condition ?? existing.condition,
      };

      if (data.categoryId) updateData.categoryId = parseInt(data.categoryId);
      if (mainImageUrl) updateData.image = mainImageUrl;

      const product = await tx.product.update({ where: { id: parseInt(id) }, data: updateData });

      if (featuresArray.length > 0) {
        await tx.productFeature.deleteMany({ where: { productId: parseInt(id) } });
        await tx.productFeature.createMany({ data: featuresArray.map(f => ({ feature: f.toString(), productId: parseInt(id) })) });
      }

      if (additionalImages?.length) {
        await tx.productImage.deleteMany({ where: { productId: parseInt(id) } });
        await tx.productImage.createMany({ data: additionalImages.map(img => ({ imageUrl: img.imageUrl, productId: parseInt(id) })) });
      }

      return await tx.product.findUnique({ where: { id: parseInt(id) }, include: { category: true, features: true, images: true } });
    });

    res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product', error: err.message });
  }
};

// ==================== DELETE PRODUCT ====================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { features: true, images: true, cartItems: true, orderItems: true }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const activeOrderItems = await prisma.orderItems.findMany({
      where: { productId: parseInt(id), order: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } },
      include: { order: true }
    });
    if (activeOrderItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product in active orders',
        data: { activeOrders: activeOrderItems.map(i => i.order.orderId) }
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.productFeature.deleteMany({ where: { productId: parseInt(id) } });
      await tx.productImage.deleteMany({ where: { productId: parseInt(id) } });
      await tx.cartItems.deleteMany({ where: { productId: parseInt(id) } });
      await tx.orderItems.deleteMany({ where: { productId: parseInt(id) } });
      await tx.product.delete({ where: { id: parseInt(id) } });
    });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: err.message });
  }
};

// ==================== BULK DELETE ====================
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds?.length) return res.status(400).json({ success: false, message: 'Product IDs required' });

    const products = await prisma.product.findMany({
      where: { id: { in: productIds.map(Number) } },
      include: { orderItems: { include: { order: true } } }
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missing = productIds.filter(id => !foundIds.includes(Number(id)));
      return res.status(404).json({ success: false, message: 'Some products not found', data: { missing } });
    }

    const blocked = products.filter(p =>
      p.orderItems.some(oi => oi.order && !['DELIVERED', 'CANCELLED'].includes(oi.order.status))
    );

    if (blocked.length) {
      return res.status(400).json({ success: false, message: 'Some products in active orders', data: blocked });
    }

    await prisma.$transaction(async (tx) => {
      for (const id of productIds) {
        await tx.productFeature.deleteMany({ where: { productId: Number(id) } });
        await tx.productImage.deleteMany({ where: { productId: Number(id) } });
        await tx.cartItems.deleteMany({ where: { productId: Number(id) } });
        await tx.orderItems.deleteMany({ where: { productId: Number(id) } });
        await tx.product.delete({ where: { id: Number(id) } });
      }
    });

    res.json({ success: true, message: 'Products deleted successfully' });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk delete products', error: err.message });
  }
};

// ==================== CART MANAGEMENT ====================

// Get all carts
// controllers/cartController.js
exports.getAllCarts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, user } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let where = {};

    // still allow numeric userId filter
    if (userId) {
      where.userId = parseInt(userId, 10);
    }

    // new: filter by user (firstName, lastName, or email)
    if (user && String(user).trim().length > 0) {
      const search = String(user).trim();
      const parts = search.split(/\s+/);

      if (parts.length >= 2) {
        // Handle "First Last"
        where.User = {
          AND: [
            { firstName: { contains: parts[0] } },
            { lastName: { contains: parts.slice(1).join(' ') } }
          ]
        };
      } else {
        // Single word: match across firstName, lastName, or email
        where.User = {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } }
          ]
        };
      }
    }

    const carts = await prisma.cart.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cartItems: {
          include: {
            product: true
          }
        }
      },
      skip,
      take: parseInt(limit, 10),
      orderBy: {
        id: 'desc'
      }
    });

    const total = await prisma.cart.count({ where });

    res.status(200).json({
      success: true,
      data: carts,
      total,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Get carts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch carts',
      error: error.message
    });
  }
};


// Get cart by ID
exports.getCart = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cart = await prisma.cart.findUnique({
      where: { id: parseInt(id) },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cartItems: {
          include: {
            product: {
              include: {
                category: true,
                images: true
              }
            }
          }
        }
      }
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }
    
    const cartItem = await prisma.cartItems.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true
      }
    });
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    // Calculate new amount
    const newAmount = cartItem.product.price * quantity;
    
    const updatedCartItem = await prisma.cartItems.update({
      where: { id: parseInt(id) },
      data: {
        quantity: parseInt(quantity),
        amount: newAmount
      },
      include: {
        product: true,
        cart: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedCartItem
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cartItem = await prisma.cartItems.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    await prisma.cartItems.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart item removed successfully'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: error.message
    });
  }
};

// Clear user cart
exports.clearUserCart = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        cart: {
          include: {
            cartItems: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a cart'
      });
    }
    
    const cart = user.cart[0];
    
    // Delete all cart items
    await prisma.cartItems.deleteMany({
      where: { cartId: cart.id }
    });
    
    res.status(200).json({
      success: true,
      message: 'User cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear user cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear user cart',
      error: error.message
    });
  }
};

// ==================== DASHBOARD STATS ====================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    const totalCategories = await prisma.category.count();
    const totalCarts = await prisma.cart.count();
    
    // Get revenue from completed orders
    const revenueData = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: {
        amount: true
      }
    });
    
    const totalRevenue = revenueData._sum.amount || 0;
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        orderItems: {
          include: {
            products: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Get popular products (based on order items)
    const popularProducts = await prisma.orderItems.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });
    
    // Get product details for popular products
    const popularProductDetails = await Promise.all(
      popularProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true,
            images: true
          }
        });
        
        return {
          product,
          totalQuantity: item._sum.quantity
        };
      })
    );
    
    // Get active carts count
    const activeCarts = await prisma.cart.count({
      where: {
        cartItems: {
          some: {}
        }
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          products: totalProducts,
          orders: totalOrders,
          categories: totalCategories,
          carts: totalCarts,
          activeCarts,
          revenue: totalRevenue
        },
        recentOrders,
        popularProducts: popularProductDetails
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// ==================== USER ADMIN CONTROLLERS ====================
// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let where = {};
    
    // Filter by role
    if (role) {
      where.role = role;
    }
    
    // Search by name or email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const users = await prisma.user.findMany({
      where,
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                product: true
              }
            }
          }
        },
        order: {
          include: {
            orderItems: {
              include: {
                products: true
              }
            }
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        id: 'desc'
      }
    });
    
    // Remove passwords from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    const total = await prisma.user.count({ where });
    
    res.status(200).json({
      success: true,
      data: usersWithoutPassword,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                product: true
              }
            }
          }
        },
        order: {
          include: {
            orderItems: {
              include: {
                products: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either ADMIN or USER'
      });
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has orders
    const userWithOrders = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: true
      }
    });
    
    if (userWithOrders.order.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with associated orders'
      });
    }
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ==================== ORDER ADMIN CONTROLLERS ====================
// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Filter by user
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        orderItems: {
          include: {
            products: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        created_at: 'desc'
      }
    });
    
    const total = await prisma.order.count({ where });
    
    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        orderItems: {
          include: {
            products: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: true,
        orderItems: {
          include: {
            products: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const completedOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });
    
    // Get total revenue from completed orders
    const revenueData = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: {
        amount: true
      }
    });
    
    const totalRevenue = revenueData._sum.amount || 0;
    
    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

// ==================== DASHBOARD STATS ====================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    const totalCategories = await prisma.category.count();
    
    // Get revenue from completed orders
    const revenueData = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      // where: { status: 'DELIVERED' },
      _sum: {
        amount: true
      }
    });
    
    const totalRevenue = revenueData._sum.amount || 0;
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      include: {
        user: true,
        orderItems: {
          include: {
            products: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Get popular products (based on order items)
    const popularProducts = await prisma.orderItems.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });
    
    // Get product details for popular products
    const popularProductDetails = await Promise.all(
      popularProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true
          }
        });
        
        return {
          product,
          totalQuantity: item._sum.quantity
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          products: totalProducts,
          orders: totalOrders,
          categories: totalCategories,
          revenue: totalRevenue
        },
        recentOrders,
        popularProducts: popularProductDetails
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};