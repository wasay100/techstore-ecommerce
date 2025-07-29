# TechStore E-commerce Website

A modern, dark-themed e-commerce website built with HTML5, CSS3, JavaScript, and Express.js backend with MySQL database integration.

## Features

✅ **Frontend Features:**
- Dark professional theme with smooth animations
- Responsive design (mobile-friendly)
- Shopping cart with localStorage persistence
- Product catalog with image support
- Direct checkout flow (no authentication required)
- Real-time cart updates and quantity management

✅ **Backend Features:**
- Express.js REST API server
- MySQL database integration
- Customer management system
- Order processing and tracking
- Product inventory management
- Comprehensive error handling and logging

✅ **Database Features:**
- Automatic database and table creation
- Customer information storage
- Order management with unique order numbers
- Order items tracking
- Product inventory with stock management
- Data relationships with foreign keys

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL with mysql2 driver
- **Environment:** dotenv for configuration
- **Development:** nodemon for auto-restart

## Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v14 or higher)
2. **MySQL Server** (v8.0 or higher)
3. **Git** (optional)

### Installing Prerequisites

#### Windows:
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Download MySQL from [mysql.com](https://dev.mysql.com/downloads/installer/)
3. During MySQL installation, remember your root password

#### macOS:
```bash
# Using Homebrew
brew install node
brew install mysql
```

#### Linux (Ubuntu/Debian):
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install mysql-server
```

## Installation & Setup

### Step 1: Clone/Download Project
```bash
git clone <repository-url>
cd e-commerce
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Database

**IMPORTANT:** Update your MySQL password in the `.env` file:

1. The `.env` file is already created with this template:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=techstore_db
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development
```

2. **Replace `your_mysql_password` with your actual MySQL root password**

### Step 4: Setup Database (Automatic)
```bash
npm run setup-db
```

This command will automatically:
- ✅ Connect to your MySQL server
- ✅ Create the `techstore_db` database
- ✅ Create all required tables:
  - `customers` - Store customer information
  - `orders` - Store order headers with unique order numbers
  - `order_items` - Store individual items in each order
  - `products` - Store product catalog with inventory
- ✅ Insert sample product data (6 products)
- ✅ Set up proper database relationships and indexes

### Step 5: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Usage

### Quick Start:
1. **Setup database:** `npm run setup-db`
2. **Start server:** `npm start`
3. **Open website:** `http://localhost:3001`
4. **Start shopping!** 🛒

### Customer Flow:
1. Browse products on homepage or products page
2. Add items to cart
3. Click "Proceed to Checkout"
4. Fill in delivery details
5. Submit order (Cash on Delivery)
6. Order is saved to database with unique order number

## Database Schema

The system creates these tables automatically:

### `customers` Table
```sql
- id (Primary Key)
- full_name, email, phone
- address, city, postal_code
- created_at, updated_at
- Indexes on email and phone
```

### `orders` Table
```sql
- id (Primary Key)
- order_number (Unique)
- customer_id (Foreign Key)
- total_amount, status, payment_method
- delivery_notes, created_at, updated_at
```

### `order_items` Table  
```sql
- id (Primary Key)
- order_id (Foreign Key)
- product_id, product_name, product_price
- quantity, subtotal, created_at
```

### `products` Table
```sql
- id (Primary Key)
- name, price, description, image
- stock_quantity, is_active
- created_at, updated_at
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Homepage |
| GET | `/products.html` | Products page |
| GET | `/checkout.html` | Checkout page |
| GET | `/api/products` | Get all products from database |
| POST | `/api/submit-order` | Submit order to database |
| GET | `/api/order/:number` | Get order details |
| GET | `/api/health` | Server and database status |

### Order Submission Example:
```json
{
  "customerInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "postalCode": "10001"
  },
  "cartItems": [
    {
      "id": 1,
      "name": "Premium Wireless Headphones", 
      "price": 199.99,
      "quantity": 1
    }
  ],
  "deliveryNotes": "Leave at front door"
}
```

## Troubleshooting

### Database Connection Issues:

**❌ Error: ER_ACCESS_DENIED_ERROR**
```
💡 Fix: Update your MySQL credentials in .env file
   - DB_USER=your_mysql_username  
   - DB_PASSWORD=your_mysql_password
```

**❌ Error: ECONNREFUSED**
```  
💡 Fix: Make sure MySQL server is running
   - Windows: Services → MySQL → Start
   - macOS: brew services start mysql
   - Linux: sudo systemctl start mysql
```

**❌ Error: Database setup failed**
```
💡 Check:
   1. MySQL is installed and running
   2. Correct password in .env file
   3. User has permission to create databases
```

### Server Issues:

**❌ Port already in use**
```
💡 Fix: Change PORT in .env or stop existing process
   - Windows: netstat -ano | findstr :3001
   - macOS/Linux: lsof -ti:3001
```

**❌ Missing dependencies**
```
💡 Fix: Install dependencies
   npm install
```

## Development

### Database Operations:
```bash
# Reset database completely
npm run setup-db

# Check database status
curl http://localhost:3001/api/health

# View products from database  
curl http://localhost:3001/api/products
```

### Adding New Products:
1. Add product image to project folder
2. Insert into database:
```sql
INSERT INTO products (name, price, description, image, stock_quantity) 
VALUES ('New Product', 99.99, 'Description', 'image.png', 50);
```

### Viewing Orders:
```sql
-- Connect to database
mysql -u root -p techstore_db

-- View all orders with customer info
SELECT o.order_number, c.full_name, o.total_amount, o.created_at 
FROM orders o 
JOIN customers c ON o.customer_id = c.id 
ORDER BY o.created_at DESC;

-- View order items
SELECT oi.product_name, oi.quantity, oi.subtotal 
FROM order_items oi 
JOIN orders o ON oi.order_id = o.id 
WHERE o.order_number = 'ORD123456789';
```

## Project Structure

```
e-commerce/
├── index.html              # Homepage
├── products.html           # Product catalog  
├── checkout.html           # Checkout form
├── server.js              # Express.js server with database
├── database.js            # Database operations & models
├── setup-database.js      # Automatic database setup
├── package.json           # Dependencies & scripts
├── .env                   # Database configuration
├── README.md              # Documentation
└── *.png                  # Product images
```

## What's Implemented ✅

**Step 1:** ✅ Customer fills checkout form  
**Step 2:** ✅ Data goes to Express server  
**Step 3:** ✅ **Server saves to MySQL database**

## Next Steps 🚀

**Step 4:** Email notifications (Nodemailer)  
**Step 5:** Order confirmation page  

---

**Status:** ✅ Step 3 Complete - MySQL Database Integration  
**Database:** Fully operational with automatic setup  
**Orders:** Saved with unique order numbers and full details  
**Ready for:** Email service integration (Step 4)
