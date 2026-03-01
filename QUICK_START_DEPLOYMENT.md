# ⚡ Quick Start Deployment - 15 Minutes

Follow these steps in order. Each step takes 2-3 minutes.

---

## Step 1: Install PostgreSQL Packages (2 min)

```bash
cd backend
npm install pg pg-hstore
npm uninstall mysql2
```

✅ Done when you see: "added 2 packages, removed 1 package"

---

## Step 2: Setup Supabase Database (3 min)

1. Go to: https://supabase.com
2. Login and select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open file: `backend/database_setup_postgres.sql`
6. Copy ALL content and paste into SQL Editor
7. Click **RUN** button (bottom right)
8. Wait for: "✅ Database setup completed successfully!"

✅ Done when you see 8 tables in Table Editor

---

## Step 3: Deploy Backend to Render (5 min)

1. Commit your code:
```bash
cd backend
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to: https://render.com
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Fill in:
   - Name: `flutter-learning-backend`
   - Root Directory: `backend` (if backend is in subfolder)
   - Build Command: `npm install`
   - Start Command: `npm start`

6. Click **Advanced** and add these environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Super@base1234@db.tpzphnogmpdndqiipylv.supabase.co:5432/postgres
JWT_SECRET=flutter_learning_platform_super_secret_key_2024_make_it_very_long_and_secure
JWT_REFRESH_SECRET=flutter_learning_platform_refresh_secret_2024_also_very_long_and_secure
CLIENT_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

7. Click **Create Web Service**
8. Wait 5 minutes for deployment
9. Copy your backend URL (e.g., `https://flutter-learning-backend.onrender.com`)

✅ Done when you can open: `https://your-backend-url.onrender.com/api/health`

---

## Step 4: Build & Deploy Frontend (3 min)

1. Update frontend config:
```bash
cd frontend
```

2. Edit `.env.production`:
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```
(Replace with your actual Render URL from Step 3)

3. Build:
```bash
npm install
npm run build
```

4. Upload `dist` folder to your domain:
   - Via cPanel File Manager
   - Or via FTP
   - Or via SSH

5. Create `.htaccess` in your domain root:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

✅ Done when you can open: `https://yourdomain.com`

---

## Step 5: Update CORS & Test (2 min)

1. Go back to Render Dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Update `CORS_ORIGINS` with your ACTUAL domain:
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```
5. Update `CLIENT_URL`:
```
CLIENT_URL=https://yourdomain.com
```
6. Click **Save Changes** (Render will auto-redeploy)

7. Test your app:
   - Open: `https://yourdomain.com`
   - Login with: `admin@flutterlearn.com` / `admin123`
   - Check Dashboard loads
   - Check all pages work

✅ Done when you can login and see the dashboard!

---

## 🎉 Deployment Complete!

Your app is now live:
- Frontend: https://yourdomain.com
- Backend: https://your-backend-url.onrender.com
- Database: Supabase PostgreSQL

---

## ⚠️ Important: Change Admin Password!

1. Login as admin
2. Go to profile/settings
3. Change password immediately

---

## 🐛 Something Not Working?

### Backend won't start
- Check Render logs
- Verify all environment variables are set
- Check DATABASE_URL is correct

### Frontend can't connect
- Check VITE_API_URL in .env.production
- Rebuild: `npm run build`
- Re-upload dist folder

### CORS error
- Add your domain to CORS_ORIGINS in Render
- Format: `https://yourdomain.com,https://www.yourdomain.com`
- Save and wait for redeploy

### 404 on page refresh
- Add .htaccess file (see Step 4)
- Make sure it's in domain root

---

## 📚 Need More Help?

Read the complete guide: `DEPLOYMENT_GUIDE.md`

---

**Total Time**: ~15 minutes
**Difficulty**: Easy
**Cost**: Free (using free tiers)
