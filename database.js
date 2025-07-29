const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'techstore_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
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
