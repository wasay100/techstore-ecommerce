# Email Setup Guide for TechStore

This guide will help you configure Gmail SMTP for sending order confirmation emails.

## Quick Setup Steps

### Step 1: Enable Gmail App Passwords

1. **Go to your Google Account settings**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** → **Enable 2FA** (if not already enabled)
3. **Security** → **App passwords** → **Generate app password**
4. **Select app**: Mail
5. **Select device**: Computer
6. **Copy the 16-character app password** (like: `abcd efgh ijkl mnop`)

### Step 2: Update .env File

Open your `.env` file and update these values:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM_NAME=TechStore
EMAIL_FROM_ADDRESS=your_actual_email@gmail.com

# Business Email Settings
BUSINESS_EMAIL=admin@techstore.com
BUSINESS_NAME=TechStore Admin
```

**Important:**
- Replace `your_actual_email@gmail.com` with your Gmail address
- Replace `your_16_character_app_password` with the app password from Step 1
- Use the app password, NOT your regular Gmail password

### Step 3: Test Email Configuration

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test email sending:**
   ```bash
   curl -X POST http://localhost:3001/api/test-email \
   -H "Content-Type: application/json" \
   -d '{"email":"your_test_email@gmail.com"}'
   ```

   Or visit: http://localhost:3001/api/health to check email connection status

### Step 4: Verify Setup

You should see:
- ✅ Email server connection verified (in server logs)
- ✅ Test email received in your inbox
- ✅ Health check shows email: "Connected"

## Email Features

### Customer Emails
When an order is placed, customers receive:
- **Professional HTML email** with order details
- **Order confirmation number**
- **Delivery address confirmation**
- **Cash on Delivery information**
- **Estimated delivery time**
- **Contact information for support**

### Business Notifications
Business owners receive:
- **Instant order alerts** with customer details
- **Order summary** with all items
- **Customer contact information**
- **Total order value**
- **Action required notifications**

## Alternative Email Providers

### Using Other Gmail Accounts
Just update these in `.env`:
```env
EMAIL_USER=business@yourdomain.com
EMAIL_FROM_ADDRESS=business@yourdomain.com
```

### Using Custom SMTP (like cPanel hosting)
```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=orders@yourdomain.com
EMAIL_PASSWORD=your_email_password
```

### Using Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_app_password
```

## Troubleshooting

### ❌ Error: Invalid login
**Solution:** Make sure you're using an App Password, not your regular Gmail password

### ❌ Error: Less secure app access
**Solution:** Enable 2-Factor Authentication and use App Passwords

### ❌ Error: Connection timeout
**Solution:** Check firewall settings and internet connection

### ❌ Error: Authentication failed
**Solution:** Verify your email and app password are correct in `.env`

## Testing Commands

### Test email connection:
```bash
curl http://localhost:3001/api/health
```

### Send test email:
```bash
curl -X POST http://localhost:3001/api/test-email \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com"}'
```

### Place test order (triggers all emails):
```bash
curl -X POST http://localhost:3001/api/submit-order \
-H "Content-Type: application/json" \
-d '{
  "customerInfo": {
    "fullName": "Test Customer",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "postalCode": "12345"
  },
  "cartItems": [
    {
      "id": 1,
      "name": "Test Product",
      "price": 99.99,
      "quantity": 1
    }
  ],
  "deliveryNotes": "Test order"
}'
```

## Production Setup

For production use:
1. Use a business email address (orders@yourbusiness.com)
2. Set up proper email signatures
3. Configure email monitoring
4. Set up email backup/logging
5. Test email delivery thoroughly

---

**Status:** Ready for Step 4 - Email Service Integration
**Next:** Complete email configuration and test email delivery
