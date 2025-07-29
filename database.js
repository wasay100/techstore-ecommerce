const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration - supports both Railway URL and individual variables
let dbConfig;

console.log('🔧 Database Configuration Debug:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
console.log('MYSQL_HOST exists:', !!process.env.MYSQL_HOST);
console.log('MYSQL_USER exists:', !!process.env.MYSQL_USER);
console.log('MYSQL_PASSWORD exists:', !!process.env.MYSQL_PASSWORD);
console.log('MYSQL_DATABASE exists:', !!process.env.MYSQL_DATABASE);

if (process.env.DATABASE_URL) {
    try {
        // Railway deployment - parse the DATABASE_URL
        console.log('🔗 Using Railway DATABASE_URL for connection');
        console.log('Raw DATABASE_URL:', process.env.DATABASE_URL.substring(0, 20) + '...');
        
        const url = new URL(process.env.DATABASE_URL);
        console.log('Parsed URL components:');
        console.log('- Protocol:', url.protocol);
        console.log('- Hostname:', url.hostname);
        console.log('- Port:', url.port);
        console.log('- Username:', url.username);
        console.log('- Database:', url.pathname.slice(1));
        
        dbConfig = {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1), // Remove the leading '/'
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: {
                rejectUnauthorized: false // Railway requires SSL
            },
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        
        console.log('Final DB Config (password hidden):');
        console.log({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            database: dbConfig.database,
            ssl: dbConfig.ssl
        });
        
    } catch (urlError) {
        console.error('❌ Failed to parse DATABASE_URL:', urlError);
        throw new Error('Invalid DATABASE_URL format');
    }
} else if (process.env.MYSQL_HOST) {
    // Railway might provide individual MySQL variables
    console.log('🚄 Using Railway individual MySQL variables');
    dbConfig = {
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: {
            rejectUnauthorized: false
        },
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    };
    
    console.log('Railway MySQL Config (password hidden):');
    console.log({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
    });
} else {
    // Local development - use individual variables
    console.log('🏠 Using local database configuration');
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'techstore_db',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection and setup tables
async function testConnection() {
    let connection;
    try {
        console.log('🔍 Testing database connection...');
        
        // Try to get a connection from the pool
        connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Test query successful:', rows[0]);
        
        // Initialize tables if they don't exist
        await initializeTables(connection);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Error errno:', error.errno);
        console.error('Error stack:', error.stack);
        
        // Try alternative connection if Railway URL parsing failed
        if (process.env.DATABASE_URL && error.code === 'ENOTFOUND') {
            console.log('🔄 Trying alternative DATABASE_URL parsing...');
            return await tryAlternativeConnection();
        }
        
        return false;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Alternative connection method for Railway
async function tryAlternativeConnection() {
    try {
        // Try using the DATABASE_URL directly with mysql2
        const alternativePool = mysql.createPool(process.env.DATABASE_URL + '?ssl={"rejectUnauthorized":false}');
        
        const connection = await alternativePool.getConnection();
        console.log('✅ Alternative database connection successful');
        
        // Test query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Alternative test query successful:', rows[0]);
        
        connection.release();
        
        // Replace the global pool with the working one
        await pool.end();
        global.pool = alternativePool;
        
        return true;
    } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError.message);
        return false;
    }
}

// Initialize database tables
async function initializeTables(connection) {
    try {
        console.log('📋 Initializing database tables...');
        
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
        
        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize database tables:', error);
        throw error;
    }
}

// Customer operations
const customerOperations = {
    // Create new customer
    async create(customerData) {
        const { fullName, email, phone, address, city, postalCode } = customerData;
        
        try {
            const [result] = await pool.execute(
                `INSERT INTO customers (full_name, email, phone, address, city, postal_code) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [fullName, email, phone, address, city, postalCode]
            );
            
            console.log(`✅ Customer created with ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ Error creating customer:', error.message);
            throw error;
        }
    },

    // Find customer by email
    async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM customers WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Error finding customer:', error.message);
            throw error;
        }
    },

    // Find or create customer
    async findOrCreate(customerData) {
        try {
            const existing = await this.findByEmail(customerData.email);
            if (existing) {
                console.log(`✅ Found existing customer: ${existing.id}`);
                return existing.id;
            }
            return await this.create(customerData);
        } catch (error) {
            console.error('❌ Error in findOrCreate:', error.message);
            throw error;
        }
    }
};

// Order operations
const orderOperations = {
    // Generate unique order number
    generateOrderNumber() {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD${timestamp}${random}`;
    },

    // Create new order
    async create(customerId, orderData) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const orderNumber = this.generateOrderNumber();
            const { items, deliveryNotes } = orderData;
            
            // Calculate total amount
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Insert order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (order_number, customer_id, total_amount, payment_method, delivery_notes) 
                 VALUES (?, ?, ?, ?, ?)`,
                [orderNumber, customerId, totalAmount, 'cod', deliveryNotes || null]
            );
            
            const orderId = orderResult.insertId;
            console.log(`✅ Order created with ID: ${orderId}, Number: ${orderNumber}`);
            
            // Insert order items
            for (const item of items) {
                const subtotal = item.price * item.quantity;
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, item.id, item.name, item.price, item.quantity, subtotal]
                );
            }
            
            console.log(`✅ ${items.length} order items inserted`);
            
            await connection.commit();
            
            return {
                orderId,
                orderNumber,
                totalAmount,
                itemCount: items.length
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error creating order:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get order by number
    async getByNumber(orderNumber) {
        try {
            const [orderRows] = await pool.execute(
                `SELECT o.*, c.full_name, c.email, c.phone, c.address, c.city, c.postal_code
                 FROM orders o 
                 JOIN customers c ON o.customer_id = c.id 
                 WHERE o.order_number = ?`,
                [orderNumber]
            );
            
            if (orderRows.length === 0) return null;
            
            const order = orderRows[0];
            
            // Get order items
            const [itemRows] = await pool.execute(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );
            
            return {
                ...order,
                items: itemRows
            };
            
        } catch (error) {
            console.error('❌ Error getting order:', error.message);
            throw error;
        }
    },

    // Update order status
    async updateStatus(orderNumber, status) {
        try {
            const [result] = await pool.execute(
                'UPDATE orders SET status = ? WHERE order_number = ?',
                [status, orderNumber]
            );
            
            console.log(`✅ Order ${orderNumber} status updated to: ${status}`);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error updating order status:', error.message);
            throw error;
        }
    }
};

// Product operations
const productOperations = {
    // Get all products
    async getAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM products WHERE is_active = TRUE ORDER BY id'
            );
            return rows;
        } catch (error) {
            console.error('❌ Error getting products:', error.message);
            throw error;
        }
    },

    // Get product by ID
    async getById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Error getting product:', error.message);
            throw error;
        }
    },

    // Update stock quantity
    async updateStock(productId, quantity) {
        try {
            const [result] = await pool.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [quantity, productId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error updating stock:', error.message);
            throw error;
        }
    }
};

// Export database operations
module.exports = {
    pool,
    testConnection,
    customers: customerOperations,
    orders: orderOperations,
    products: productOperations
};
