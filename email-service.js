const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
};

// Create transporter
let transporter;

try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('📧 Email transporter created successfully');
} catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
}

// Test email connection
async function testEmailConnection() {
    try {
        if (!transporter) {
            throw new Error('Email transporter not initialized');
        }
        
        await transporter.verify();
        console.log('✅ Email server connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email connection failed:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('💡 Fix: Check your email credentials in .env file');
            console.log('   - EMAIL_USER=your_email@gmail.com');
            console.log('   - EMAIL_PASSWORD=your_app_password (not regular password)');
        } else if (error.code === 'ECONNECTION') {
            console.log('💡 Fix: Check your internet connection and SMTP settings');
        }
        
        return false;
    }
}

// Generate customer order confirmation email
function generateCustomerEmailTemplate(orderData) {
    const { orderNumber, customer, items, totalAmount, orderDate } = orderData;
    
    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; text-align: left;">${item.product_name}</td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right;">$${item.product_price.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-weight: bold;">$${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation - ${orderNumber}</title>
</head>
<body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">TechStore</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order Confirmation</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Thank you for your order, ${customer.full_name}! 🎉</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Your order has been received and is being processed. We'll send you another email when your items are on their way.
            </p>

            <!-- Order Details -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #1f2937;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
                <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
                <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
            </div>

            <!-- Delivery Address -->
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #1f2937;">Delivery Address</h3>
                <p style="margin: 5px 0;"><strong>${customer.full_name}</strong></p>
                <p style="margin: 5px 0;">${customer.address}</p>
                <p style="margin: 5px 0;">${customer.city}, ${customer.postal_code}</p>
                <p style="margin: 5px 0;">📱 ${customer.phone}</p>
                <p style="margin: 5px 0;">📧 ${customer.email}</p>
            </div>

            <!-- Order Items -->
            <h3 style="color: #1f2937; margin-bottom: 15px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: white; border: 1px solid #ddd;">
                <thead>
                    <tr style="background-color: #1f2937; color: white;">
                        <th style="padding: 15px; text-align: left;">Product</th>
                        <th style="padding: 15px; text-align: center;">Qty</th>
                        <th style="padding: 15px; text-align: right;">Price</th>
                        <th style="padding: 15px; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr style="background-color: #f8f9fa; font-weight: bold; font-size: 18px;">
                        <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                        <td style="padding: 15px; text-align: right; color: #1f2937;">$${totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Important Information -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #856404;">💡 Important Information</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Payment will be collected at the time of delivery</li>
                    <li>Please keep this order number for reference: <strong>${orderNumber}</strong></li>
                    <li>Someone should be available at the delivery address to receive the package</li>
                    <li>You can track your order status by replying to this email</li>
                </ul>
            </div>

            <!-- Contact Information -->
            <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #1f2937; margin-top: 0;">Need Help?</h3>
                <p>Our customer support team is here to help!</p>
                <p>
                    📧 <a href="mailto:support@techstore.com" style="color: #1f2937;">support@techstore.com</a><br>
                    📱 +1 (555) 123-4567<br>
                    🕒 Mon-Fri: 9AM-6PM
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; color: white; text-align: center; padding: 20px;">
            <p style="margin: 0; font-size: 14px;">
                © 2025 TechStore. All rights reserved.<br>
                Thank you for choosing TechStore for your tech needs! 🚀
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

// Generate business notification email
function generateBusinessEmailTemplate(orderData) {
    const { orderNumber, customer, items, totalAmount, orderDate, deliveryNotes } = orderData;
    
    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${item.product_name}</td>
            <td style="padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; text-align: right;">$${item.product_price.toFixed(2)}</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">$${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Order Alert - ${orderNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 NEW ORDER ALERT</h1>
            <p style="margin: 5px 0 0 0;">TechStore Admin Panel</p>
        </div>

        <!-- Content -->
        <div style="padding: 25px;">
            <h2 style="color: #dc3545; margin-bottom: 20px;">New Order Received!</h2>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333;">Order Information</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
                <p><strong>Total Amount:</strong> <span style="color: #28a745; font-weight: bold; font-size: 18px;">$${totalAmount.toFixed(2)}</span></p>
                <p><strong>Payment:</strong> Cash on Delivery</p>
                <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">PENDING</span></p>
            </div>

            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333;">Customer Details</h3>
                <p><strong>Name:</strong> ${customer.full_name}</p>
                <p><strong>Email:</strong> <a href="mailto:${customer.email}">${customer.email}</a></p>
                <p><strong>Phone:</strong> <a href="tel:${customer.phone}">${customer.phone}</a></p>
                <p><strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.postal_code}</p>
                ${deliveryNotes ? `<p><strong>Special Instructions:</strong> ${deliveryNotes}</p>` : ''}
            </div>

            <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #343a40; color: white;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                        <th style="padding: 10px; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td colspan="3" style="padding: 12px; text-align: right;">TOTAL:</td>
                        <td style="padding: 12px; text-align: right; color: #28a745; font-size: 16px;">$${totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h4 style="margin-top: 0; color: #856404;">⚡ Action Required</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Process this order within 24 hours</li>
                    <li>Prepare items for packaging</li>
                    <li>Schedule delivery within 2-3 business days</li>
                    <li>Update order status in the system</li>
                </ul>
            </div>

            <div style="text-align: center; padding: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                    This is an automated notification from TechStore Order Management System<br>
                    Generated on ${new Date().toLocaleString()}
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

// Send customer order confirmation
async function sendCustomerConfirmation(orderData) {
    try {
        if (!transporter) {
            throw new Error('Email transporter not available');
        }

        const { customer, orderNumber } = orderData;
        
        const mailOptions = {
            from: {
                name: process.env.EMAIL_FROM_NAME || 'TechStore',
                address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
            },
            to: customer.email,
            subject: `Order Confirmation - ${orderNumber} | TechStore`,
            html: generateCustomerEmailTemplate(orderData),
            text: `
Order Confirmation - ${orderNumber}

Dear ${customer.full_name},

Thank you for your order! Your order ${orderNumber} has been received and is being processed.

Order Details:
- Order Number: ${orderNumber}
- Total Amount: $${orderData.totalAmount.toFixed(2)}
- Payment: Cash on Delivery
- Estimated Delivery: 2-3 business days

Delivery Address:
${customer.address}
${customer.city}, ${customer.postal_code}

We'll send you another email when your items are on their way.

Thank you for choosing TechStore!

TechStore Team
support@techstore.com
+1 (555) 123-4567
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Customer confirmation sent to: ${customer.email}`);
        console.log(`📧 Message ID: ${result.messageId}`);
        
        return {
            success: true,
            messageId: result.messageId,
            recipient: customer.email
        };

    } catch (error) {
        console.error('❌ Failed to send customer confirmation:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send business notification
async function sendBusinessNotification(orderData) {
    try {
        if (!transporter) {
            throw new Error('Email transporter not available');
        }

        const { orderNumber, totalAmount } = orderData;
        const businessEmail = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;
        
        const mailOptions = {
            from: {
                name: 'TechStore System',
                address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
            },
            to: businessEmail,
            subject: `🚨 NEW ORDER ALERT - ${orderNumber} ($${totalAmount.toFixed(2)})`,
            html: generateBusinessEmailTemplate(orderData),
            text: `
NEW ORDER ALERT - ${orderNumber}

Order Details:
- Order Number: ${orderNumber}
- Customer: ${orderData.customer.full_name}
- Email: ${orderData.customer.email}
- Phone: ${orderData.customer.phone}
- Total: $${totalAmount.toFixed(2)}
- Payment: Cash on Delivery

Address: ${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.postal_code}

Items: ${orderData.items.length} products

Action Required: Process this order within 24 hours.

TechStore Admin System
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Business notification sent to: ${businessEmail}`);
        console.log(`📧 Message ID: ${result.messageId}`);
        
        return {
            success: true,
            messageId: result.messageId,
            recipient: businessEmail
        };

    } catch (error) {
        console.error('❌ Failed to send business notification:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send both emails for an order
async function sendOrderEmails(orderData) {
    console.log(`📧 Sending order emails for: ${orderData.orderNumber}`);
    
    const results = {
        customer: null,
        business: null,
        success: false
    };

    try {
        // Send customer confirmation
        console.log('📤 Sending customer confirmation...');
        results.customer = await sendCustomerConfirmation(orderData);
        
        // Send business notification
        console.log('📤 Sending business notification...');
        results.business = await sendBusinessNotification(orderData);
        
        // Check if both emails were sent successfully
        results.success = results.customer.success && results.business.success;
        
        if (results.success) {
            console.log('✅ All order emails sent successfully!');
        } else {
            console.log('⚠️ Some emails failed to send');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Error sending order emails:', error.message);
        results.error = error.message;
        return results;
    }
}

// Send test email
async function sendTestEmail(toEmail) {
    try {
        if (!transporter) {
            throw new Error('Email transporter not available');
        }

        const mailOptions = {
            from: {
                name: process.env.EMAIL_FROM_NAME || 'TechStore',
                address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
            },
            to: toEmail,
            subject: '✅ TechStore Email Test - Configuration Successful',
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px; background-color: #28a745; color: white; border-radius: 8px;">
        <h1>✅ Email Configuration Test</h1>
        <p>TechStore Email Service</p>
    </div>
    
    <div style="padding: 20px;">
        <h2>Email Test Successful! 🎉</h2>
        <p>This is a test email to verify that your TechStore email configuration is working correctly.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
                <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
                <li><strong>SMTP Port:</strong> ${process.env.EMAIL_PORT}</li>
                <li><strong>From Email:</strong> ${process.env.EMAIL_FROM_ADDRESS}</li>
                <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
        </div>
        
        <p>Your email service is now ready to send order confirmations and business notifications!</p>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 5px;">
            <p style="margin: 0; color: #1976d2;">
                <strong>TechStore Email Service</strong><br>
                Ready for production use! 🚀
            </p>
        </div>
    </div>
</body>
</html>
            `,
            text: `
TechStore Email Test - Configuration Successful

This is a test email to verify that your TechStore email configuration is working correctly.

Configuration Details:
- SMTP Host: ${process.env.EMAIL_HOST}
- SMTP Port: ${process.env.EMAIL_PORT}
- From Email: ${process.env.EMAIL_FROM_ADDRESS}
- Test Date: ${new Date().toLocaleString()}

Your email service is now ready to send order confirmations and business notifications!

TechStore Email Service - Ready for production use!
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Test email sent successfully to: ${toEmail}`);
        console.log(`📧 Message ID: ${result.messageId}`);
        
        return {
            success: true,
            messageId: result.messageId,
            recipient: toEmail
        };

    } catch (error) {
        console.error('❌ Failed to send test email:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export email functions
module.exports = {
    testEmailConnection,
    sendOrderEmails,
    sendCustomerConfirmation,
    sendBusinessNotification,
    sendTestEmail
};
