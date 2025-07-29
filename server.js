const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database operations and email service
const db = require('./database');
const emailService = require('./email-service');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Test database and email connections on startup
db.testConnection();
emailService.testEmailConnection();

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

app.get('/order-confirmed.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'order-confirmed.html'));
});

// API Routes

// Initialize database tables (for Railway deployment)
app.get('/api/init-db', async (req, res) => {
    try {
        console.log('🔧 Manual database initialization requested...');
        
        const connection = await db.pool.getConnection();
        
        // Create customers table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address TEXT NOT NULL,
                city VARCHAR(100) NOT NULL,
                postal_code VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Create orders table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
                order_status VARCHAR(50) DEFAULT 'Pending',
                delivery_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);
        
        // Create order_items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_price DECIMAL(10, 2) NOT NULL,
                quantity INT NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        
        // Create products table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                image_url VARCHAR(500),
                stock_quantity INT DEFAULT 100,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Insert sample products if table is empty
        const [productRows] = await connection.execute('SELECT COUNT(*) as count FROM products');
        if (productRows[0].count === 0) {
            console.log('📦 Inserting sample products...');
            await connection.execute(`
                INSERT INTO products (id, name, price, description, image_url, category) VALUES
                (1, 'Premium Wireless Headphones', 199.99, 'High-quality wireless headphones with noise cancellation and 30-hour battery life.', 'Premium_Wireless_Headphones.png', 'Audio'),
                (2, 'Smart Fitness Watch', 299.99, 'Advanced fitness tracking with heart rate monitor, GPS, and smartphone connectivity.', 'Smart_Fitness_Watch.png', 'Wearables'),
                (3, '4K Webcam Pro', 149.99, 'Ultra HD webcam perfect for streaming, video calls, and content creation.', '4K_Webcam_Pro.png', 'Cameras'),
                (4, 'Mechanical Gaming Keyboard', 179.99, 'RGB backlit mechanical keyboard with premium switches for gaming enthusiasts.', 'Mechanical_Gaming_Keyboard.png', 'Gaming'),
                (5, 'Wireless Charging Pad', 79.99, 'Fast wireless charging pad compatible with all Qi-enabled devices.', 'Wireless_Charging_Pad.png', 'Accessories'),
                (6, 'Bluetooth Speaker Pro', 129.99, 'Portable Bluetooth speaker with 360° sound and waterproof design.', 'Bluetooth_Speaker_Pro.png', 'Audio')
            `);
        }
        
        connection.release();
        
        console.log('✅ Database tables initialized successfully via API');
        res.json({
            success: true,
            message: 'Database tables created successfully!'
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        res.status(500).json({
            success: false,
            error: `Database initialization failed: ${error.message}`
        });
    }
});

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
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city'];
        for (const field of requiredFields) {
            if (!customerInfo[field]) {
                console.log(`❌ Validation failed: Missing ${field}`);
                return res.status(400).json({
                    success: false,
                    error: `Missing required field: ${field}`
                });
            }
        }

        // Set default postalCode if not provided
        if (!customerInfo.postalCode) {
            customerInfo.postalCode = '00000';
        }

        console.log('✅ Order validation passed');

        // Step 1: Create or find customer
        console.log('📝 Creating/finding customer...');
        console.log('Customer data:', customerInfo);
        const customerId = await db.customers.findOrCreate(customerInfo);
        console.log('✅ Customer created/found with ID:', customerId);

        // Step 2: Create order with items
        console.log('📋 Creating order...');
        console.log('Cart items:', cartItems);
        const orderResult = await db.orders.create(customerId, {
            items: cartItems,
            deliveryNotes: deliveryNotes
        });
        console.log('✅ Order created:', orderResult);

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

        // Step 4: Send email notifications
        console.log('📧 Sending email notifications...');
        
        // Transform cart items to match email template format
        const emailItems = cartItems.map(item => ({
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        }));
        
        const emailData = {
            orderNumber: orderResult.orderNumber,
            customer: customerInfo,
            items: emailItems,
            totalAmount: orderResult.totalAmount,
            orderDate: new Date(),
            deliveryNotes: deliveryNotes
        };

        // Send emails asynchronously (don't wait for completion)
        emailService.sendOrderEmails(emailData)
            .then(emailResults => {
                if (emailResults.success) {
                    console.log('✅ All email notifications sent successfully');
                } else {
                    console.log('⚠️ Some email notifications failed:', emailResults);
                }
            })
            .catch(emailError => {
                console.error('❌ Email sending failed:', emailError.message);
            });

        console.log('✅ Order processing completed successfully!');
        console.log(`📋 Order Details:
   - Order ID: ${orderResult.orderId}
   - Order Number: ${orderResult.orderNumber}
   - Customer ID: ${customerId}
   - Total Amount: $${orderResult.totalAmount.toFixed(2)}
   - Items Count: ${orderResult.itemCount}
   - Payment: Cash on Delivery
   - Email Status: Queued for delivery`);

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Order placed successfully! Confirmation emails are being sent.',
            orderDetails: {
                orderId: orderResult.orderId,
                orderNumber: orderResult.orderNumber,
                totalAmount: orderResult.totalAmount,
                itemCount: orderResult.itemCount,
                paymentMethod: 'Cash on Delivery',
                estimatedDelivery: '2-3 business days',
                emailStatus: 'Sending confirmation emails...'
            }
        });

    } catch (error) {
        console.error('❌ Order processing failed:', error);
        console.error('Error stack:', error.stack);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
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
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            res.status(500).json({
                success: false,
                error: 'Database connection failed. Please try again later.'
            });
        } else if (error.message && error.message.includes('ER_')) {
            res.status(500).json({
                success: false,
                error: `Database error: ${error.message}`
            });
        } else {
            res.status(500).json({
                success: false,
                error: `Order processing failed: ${error.message || 'Unknown error'}. Please try again.`
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

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        console.log(`📧 Sending test email to: ${email}`);
        const result = await emailService.sendTestEmail(email);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                messageId: result.messageId,
                recipient: result.recipient
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to send test email'
        });
    }
});

// Health check endpoint with email status
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
        const emailStatus = await emailService.testEmailConnection();
        
        res.json({
            status: 'OK',
            database: dbStatus ? 'Connected' : 'Disconnected',
            email: emailStatus ? 'Connected' : 'Disconnected',
            services: {
                database: dbStatus,
                email: emailStatus
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            database: 'Unknown',
            email: 'Unknown',
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
   POST /api/submit-order     - Submit new order (with emails)
   GET  /api/order/:number    - Get order details
   POST /api/test-email       - Send test email
   GET  /api/health          - Server and email health status

💾 Database: ${process.env.DB_NAME || 'techstore_db'}
� Email Service: ${process.env.EMAIL_HOST || 'Not configured'}
�🔄 Ready to process orders with email notifications!
`);
});
