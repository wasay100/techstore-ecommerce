const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database operations
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Test database connection on startup
db.testConnection();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'products.html'));
});

app.get('/checkout.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

// API Routes

// Get all products from database
app.get('/api/products', async (req, res) => {
    try {
        console.log('📦 Fetching products from database...');
        const products = await db.products.getAll();
        
        console.log(`✅ Retrieved ${products.length} products`);
        res.json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error('❌ Error fetching products:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

// Submit order endpoint with database integration
app.post('/api/submit-order', async (req, res) => {
    try {
        console.log('\n🛒 Processing new order...');
        console.log('📋 Order data received:', JSON.stringify(req.body, null, 2));

        const { customerInfo, cartItems, deliveryNotes } = req.body;

        // Validate required fields
        if (!customerInfo || !cartItems || cartItems.length === 0) {
            console.log('❌ Validation failed: Missing required data');
            return res.status(400).json({
                success: false,
                error: 'Missing required order data'
            });
        }

        // Validate customer info
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'];
        for (const field of requiredFields) {
            if (!customerInfo[field]) {
                console.log(`❌ Validation failed: Missing ${field}`);
                return res.status(400).json({
                    success: false,
                    error: `Missing required field: ${field}`
                });
            }
        }

        console.log('✅ Order validation passed');

        // Step 1: Create or find customer
        console.log('📝 Creating/finding customer...');
        const customerId = await db.customers.findOrCreate(customerInfo);

        // Step 2: Create order with items
        console.log('📋 Creating order...');
        const orderResult = await db.orders.create(customerId, {
            items: cartItems,
            deliveryNotes: deliveryNotes
        });

        // Step 3: Update product stock (optional)
        console.log('📦 Updating product stock...');
        for (const item of cartItems) {
            try {
                await db.products.updateStock(item.id, item.quantity);
            } catch (stockError) {
                console.log(`⚠️ Stock update failed for product ${item.id}:`, stockError.message);
                // Continue processing even if stock update fails
            }
        }

        console.log('✅ Order processing completed successfully!');
        console.log(`📋 Order Details:
   - Order ID: ${orderResult.orderId}
   - Order Number: ${orderResult.orderNumber}
   - Customer ID: ${customerId}
   - Total Amount: $${orderResult.totalAmount.toFixed(2)}
   - Items Count: ${orderResult.itemCount}
   - Payment: Cash on Delivery`);

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            orderDetails: {
                orderId: orderResult.orderId,
                orderNumber: orderResult.orderNumber,
                totalAmount: orderResult.totalAmount,
                itemCount: orderResult.itemCount,
                paymentMethod: 'Cash on Delivery',
                estimatedDelivery: '2-3 business days'
            }
        });

    } catch (error) {
        console.error('❌ Order processing failed:', error);
        
        // Send appropriate error response
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({
                success: false,
                error: 'Duplicate order detected'
            });
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            res.status(400).json({
                success: false,
                error: 'Invalid product reference'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to process order. Please try again.'
            });
        }
    }
});

// Get order by order number
app.get('/api/order/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        console.log(`🔍 Looking up order: ${orderNumber}`);

        const order = await db.orders.getByNumber(orderNumber);
        
        if (!order) {
            console.log(`❌ Order not found: ${orderNumber}`);
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        console.log(`✅ Order found: ${orderNumber}`);
        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('❌ Error fetching order:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
        res.json({
            status: 'OK',
            database: dbStatus ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 TechStore Server Started Successfully!
📍 Server running on: http://localhost:${PORT}
🌐 Website: http://localhost:${PORT}
🛒 Products: http://localhost:${PORT}/products.html
💳 Checkout: http://localhost:${PORT}/checkout.html
🩺 Health Check: http://localhost:${PORT}/api/health

📊 API Endpoints:
   GET  /api/products         - Get all products
   POST /api/submit-order     - Submit new order
   GET  /api/order/:number    - Get order details
   GET  /api/health          - Server health status

💾 Database: ${process.env.DB_NAME || 'techstore_db'}
🔄 Ready to process orders!
`);
});
