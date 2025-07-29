# 🚀 TechStore Railway Deployment Guide

## 📋 Pre-Deployment Checklist ✅
- [✅] Git repository initialized
- [✅] Railway.toml configuration created
- [✅] Package.json with correct start script
- [✅] Environment variables template ready
- [✅] .gitignore file configured

## 🛤️ Railway Deployment Steps

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub account (recommended)
3. Verify your email address

### Step 2: Create New Project
1. Click "New Project" on Railway dashboard
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account if not already connected
4. Create a new GitHub repository for your code

### Step 3: Push Code to GitHub
Run these commands in your project folder:
```bash
# Add GitHub repository as remote (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/techstore-ecommerce.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Connect GitHub to Railway
1. Select your GitHub repository from the list
2. Railway will automatically detect it's a Node.js project
3. Click "Deploy" - Railway will start building your app

### Step 5: Add MySQL Database
1. In your Railway project dashboard, click "New"
2. Select "Database" → "Add MySQL"
3. Wait for database to be provisioned
4. Copy the database connection details

### Step 6: Configure Environment Variables
In Railway project settings → "Variables", add these:

**Database Variables:**
- `DB_HOST`: (from Railway MySQL service)
- `DB_USER`: (from Railway MySQL service)  
- `DB_PASSWORD`: (from Railway MySQL service)
- `DB_NAME`: railway
- `DB_PORT`: 3306

**Email Variables:**
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587
- `EMAIL_SECURE`: false
- `EMAIL_USER`: your-email@gmail.com
- `EMAIL_PASS`: your-gmail-app-password
- `EMAIL_FROM`: your-email@gmail.com
- `EMAIL_TO`: your-business-email@gmail.com

**Server Variables:**
- `NODE_ENV`: production
- `PORT`: 3000

### Step 7: Setup Database Tables
1. Wait for your app to deploy successfully
2. Go to your deployed app URL + `/api/health` to check status
3. Database tables will be created automatically on first run

### Step 8: Test Your Deployed Website
1. Visit your Railway app URL (something like `https://your-app-name.up.railway.app`)
2. Test the complete order flow:
   - Browse products
   - Add items to cart
   - Complete checkout form
   - Verify order confirmation
   - Check email delivery

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)
1. Buy a domain from any registrar
2. In Railway project → Settings → Domains
3. Add your custom domain
4. Update DNS settings as instructed

### Monitoring Setup
1. Railway provides automatic monitoring
2. Check logs in Railway dashboard
3. Set up email alerts for downtime

## 📊 Important URLs After Deployment
- **Main Website**: https://your-app.up.railway.app
- **Products Page**: https://your-app.up.railway.app/products.html
- **Checkout**: https://your-app.up.railway.app/checkout.html
- **Health Check**: https://your-app.up.railway.app/api/health

## 🛠️ Troubleshooting
- **App won't start**: Check environment variables are set correctly
- **Database errors**: Verify MySQL connection details
- **Email not working**: Confirm Gmail app password is correct
- **404 errors**: Ensure all HTML files are in root directory

## 💰 Cost Information
- **Railway Free Tier**: $0/month with limited usage
- **MySQL Database**: Included in free tier
- **Upgrade needed**: When you exceed free tier limits

## 🔄 Future Updates
To update your deployed site:
1. Make changes locally
2. Commit and push to GitHub
3. Railway automatically redeploys

## ✅ Success Indicators
- ✅ App builds successfully on Railway
- ✅ Health check endpoint returns 200
- ✅ Database connection established
- ✅ Orders process and emails send
- ✅ All pages load correctly
- ✅ Mobile responsive design works

Your TechStore is now ready for production! 🎉
