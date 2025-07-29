const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔧 Setting up TechStore Database...\n');
        
        // First connect without specifying database to create it
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'techstore_db'}`);
        console.log(`✅ Database '${process.env.DB_NAME || 'techstore_db'}' created/verified`);

        // Close connection and reconnect to specific database
        await connection.end();
        
        // Reconnect to the specific database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'techstore_db',
            port: process.env.DB_PORT || 3306
        });

        // Create customers table
        const createCustomersTable = `
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address TEXT NOT NULL,
                city VARCHAR(100) NOT NULL,
                postal_code VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_phone (phone)
            )
        `;
        
        await connection.execute(createCustomersTable);
        console.log('✅ Customers table created/verified');

        // Create orders table
        const createOrdersTable = `
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                payment_method ENUM('cod', 'online') DEFAULT 'cod',
                delivery_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_order_number (order_number),
                INDEX idx_customer_id (customer_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        `;
        
        await connection.execute(createOrdersTable);
        console.log('✅ Orders table created/verified');

        // Create order_items table
        const createOrderItemsTable = `
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_price DECIMAL(10, 2) NOT NULL,
                quantity INT NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                INDEX idx_order_id (order_id),
                INDEX idx_product_id (product_id)
            )
        `;
        
        await connection.execute(createOrderItemsTable);
        console.log('✅ Order Items table created/verified');

        // Create products table for reference
        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                image VARCHAR(255),
                stock_quantity INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name),
                INDEX idx_price (price),
                INDEX idx_is_active (is_active)
            )
        `;
        
        await connection.execute(createProductsTable);
        console.log('✅ Products table created/verified');

        // Insert sample products if table is empty
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
        if (rows[0].count === 0) {
            const sampleProducts = [
                ['Premium Wireless Headphones', 199.99, 'High-quality wireless headphones with noise cancellation and 30-hour battery life.', 'Premium_Wireless_Headphones.png', 50],
                ['Smart Fitness Watch', 299.99, 'Advanced fitness tracking with heart rate monitor, GPS, and smartphone connectivity.', 'Smart_Fitness_Watch.png', 30],
                ['4K Webcam Pro', 149.99, 'Ultra HD webcam perfect for streaming, video calls, and content creation.', '4K_Webcam_Pro.png', 25],
                ['Mechanical Gaming Keyboard', 179.99, 'RGB backlit mechanical keyboard with premium switches for gaming enthusiasts.', 'Mechanical_Gaming_Keyboard.png', 40],
                ['Wireless Charging Pad', 79.99, 'Fast wireless charging pad compatible with all Qi-enabled devices.', 'Wireless_Charging_Pad.png', 60],
                ['Bluetooth Speaker Pro', 129.99, 'Portable Bluetooth speaker with 360° sound and waterproof design.', 'Bluetooth_Speaker_Pro.png', 35]
            ];

            for (const product of sampleProducts) {
                await connection.execute(
                    'INSERT INTO products (name, price, description, image, stock_quantity) VALUES (?, ?, ?, ?, ?)',
                    product
                );
            }
            console.log('✅ Sample products inserted');
        } else {
            console.log('✅ Products table already has data');
        }

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nDatabase Schema:');
        console.log('📋 customers - Store customer information');
        console.log('📋 orders - Store order headers');
        console.log('📋 order_items - Store individual order items');
        console.log('📋 products - Store product information');
        console.log('\n🚀 You can now start the server with: npm start');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Fix: Update your MySQL credentials in .env file');
            console.log('   - DB_USER=your_mysql_username');
            console.log('   - DB_PASSWORD=your_mysql_password');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Fix: Make sure MySQL server is running');
            console.log('   - Start MySQL service');
            console.log('   - Check if MySQL is running on port 3306');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
setupDatabase();
