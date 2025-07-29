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

### Step 3: Configure Database & Email

**IMPORTANT:** Update your MySQL password and email settings in the `.env` file:

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

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM_NAME=TechStore
EMAIL_FROM_ADDRESS=your_email@gmail.com

# Business Email Settings
BUSINESS_EMAIL=admin@techstore.com
BUSINESS_NAME=TechStore Admin
```

2. **Update database password:** Replace `your_mysql_password` with your actual MySQL root password

3. **Setup Gmail for emails:** 
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate app password for "Mail"
   - Replace `your_email@gmail.com` with your Gmail address
   - Replace `your_app_password` with the 16-character app password

📧 **For detailed email setup:** See `EMAIL_SETUP.md` for complete instructions

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
2. **Configure email:** Update Gmail settings in `.env` (see EMAIL_SETUP.md)
3. **Start server:** `npm start`  
4. **Test email:** `curl -X POST http://localhost:3001/api/test-email -H "Content-Type: application/json" -d '{"email":"your_email@gmail.com"}'`
5. **Open website:** `http://localhost:3001`
6. **Start shopping!** 🛒

### Customer Flow:
1. Browse products on homepage or products page
2. Add items to cart
3. Click "Proceed to Checkout"
4. Fill in delivery details
5. Submit order (Cash on Delivery)
6. Order is saved to database with unique order number
7. **NEW:** Customer receives order confirmation email
8. **NEW:** Business receives order notification email

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
| POST | `/api/submit-order` | Submit order to database + send emails |
| GET | `/api/order/:number` | Get order details |
| POST | `/api/test-email` | Send test email |
| GET | `/api/health` | Server, database & email status |

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

### Email Issues:

**❌ Error: Invalid login / Authentication failed**
```
💡 Fix: Use Gmail App Password (not regular password)
   1. Google Account → Security → 2-Step Verification
   2. Generate App Password for Mail
   3. Use 16-character app password in .env
```

**❌ Error: Email connection failed**
```
💡 Fix: Check email configuration in .env
   - EMAIL_USER=your_actual_gmail@gmail.com
   - EMAIL_PASSWORD=your_16_char_app_password
   - Test with: curl http://localhost:3001/api/health
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

### Testing Email System:
```bash
# Test email configuration
curl http://localhost:3001/api/health

# Send test email
curl -X POST http://localhost:3001/api/test-email \
-H "Content-Type: application/json" \
-d '{"email":"your_test_email@gmail.com"}'

# Complete order test (triggers all emails)
curl -X POST http://localhost:3001/api/submit-order \
-H "Content-Type: application/json" -d '{...order_data...}'
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
├── server.js              # Express.js server with database & email
├── database.js            # Database operations & models
├── email-service.js       # Email functionality (Nodemailer)
├── setup-database.js      # Automatic database setup
├── package.json           # Dependencies & scripts
├── .env                   # Database & email configuration
├── README.md              # Main documentation
├── EMAIL_SETUP.md         # Email configuration guide
└── *.png                  # Product images
```

## What's Implemented ✅

**Step 1:** ✅ Customer fills checkout form  
**Step 2:** ✅ Data goes to Express server  
**Step 3:** ✅ Server saves to MySQL database
**Step 4:** ✅ **Server sends emails (Customer + Business notifications)**

## Next Steps 🚀

**Step 5:** Order confirmation page with tracking  

---

**Status:** ✅ Step 4 Complete - Email Service Integration  
**Database:** Fully operational with automatic setup  
**Orders:** Saved with unique order numbers and full details  
**Email System:** Customer confirmations + business notifications  
**Ready for:** Order confirmation page (Step 5)
