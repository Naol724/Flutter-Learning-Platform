# Flutter Learning Platform - Deployment Guide

## Architecture
- **Frontend**: Your Domain (Static Hosting)
- **Backend**: Render (Node.js)
- **Database**: Supabase (PostgreSQL)

---

## Part 1: Database Setup (Supabase)

### Step 1: Access Supabase
1. Go to https://supabase.com
2. Login to your account
3. Select your project: `db.tpzphnogmpdndqiipylv`

### Step 2: Run Database Setup
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `backend/database_setup_postgres.sql`
4. Paste it into the SQL Editor
5. Click **Run** button
6. Wait for success message: "✅ Database setup completed successfully!"

### Step 3: Verify Tables Created
1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - Users
   - Phases
   - Weeks
   - Contents
   - Progress
   - Submissions
   - quiz_submissions
   - Certificates

### Step 4: Note Your Connection Details
```
Host: db.tpzphnogmpdndqiipylv.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: Super@base1234
Connection String: postgresql://postgres:Super@base1234@db.tpzphnogmpdndqiipylv.supabase.co:5432/postgres
```

---

## Part 2: Backend Deployment (Render)

### Step 1: Prepare Backend Code
1. Make sure you've run: `npm install pg pg-hstore` in backend folder
2. Commit all changes to Git:
```bash
cd backend
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up or login
3. Click **New +** → **Web Service**

### Step 3: Connect Repository
1. Connect your GitHub/GitLab account
2. Select your repository
3. Select the `backend` folder (or root if backend is in root)

### Step 4: Configure Web Service
```
Name: flutter-learning-backend
Region: Oregon (or closest to you)
Branch: main
Root Directory: backend (if backend is in subfolder, leave empty if in root)
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### Step 5: Add Environment Variables
Click **Advanced** → **Add Environment Variable**

Add these variables:

```
NODE_ENV=production

DATABASE_URL=postgresql://postgres:Super@base1234@db.tpzphnogmpdndqiipylv.supabase.co:5432/postgres

JWT_SECRET=flutter_learning_platform_super_secret_key_2024_make_it_very_long_and_secure

JWT_REFRESH_SECRET=flutter_learning_platform_refresh_secret_2024_also_very_long_and_secure

JWT_EXPIRES_IN=1h

JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=https://yourdomain.com

CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

PORT=5000
```

**IMPORTANT**: Replace `https://yourdomain.com` with your actual domain!

### Step 6: Deploy
1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://flutter-learning-backend.onrender.com`
4. **Save this URL** - you'll need it for frontend!

### Step 7: Test Backend
1. Open: `https://your-backend-url.onrender.com/api/health`
2. You should see: `{"status":"OK","timestamp":"..."}`
3. If you see this, backend is working! ✅

---

## Part 3: Frontend Deployment (Your Domain)

### Step 1: Update Frontend Environment
1. Open `frontend/.env.production`
2. Update `VITE_API_URL` with your Render backend URL:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Step 2: Build Frontend
```bash
cd frontend
npm install
npm run build
```

This creates a `dist` folder with your production files.

### Step 3: Deploy to Your Domain

#### Option A: Using cPanel
1. Login to your cPanel
2. Go to **File Manager**
3. Navigate to `public_html` (or your domain's root folder)
4. Delete all existing files (if any)
5. Upload all files from `frontend/dist` folder
6. Make sure `index.html` is in the root

#### Option B: Using FTP
1. Connect to your server via FTP (FileZilla, etc.)
2. Navigate to your domain's root folder
3. Upload all files from `frontend/dist` folder

#### Option C: Using SSH
```bash
# On your server
cd /path/to/your/domain
rm -rf *
# Then upload dist files
```

### Step 4: Configure Server (Important!)
Your server needs to redirect all routes to `index.html` for React Router to work.

#### For Apache (.htaccess)
Create `.htaccess` file in your domain root:
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

#### For Nginx
Add to your nginx config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Step 5: Test Frontend
1. Open your domain: `https://yourdomain.com`
2. You should see the login page
3. Try logging in with: `admin@flutterlearn.com` / `admin123`
4. If login works, deployment is successful! ✅

---

## Part 4: Update Backend CORS (After Frontend Deployment)

### Step 1: Update Render Environment Variables
1. Go to Render Dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Update `CORS_ORIGINS` with your actual domain:
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```
5. Update `CLIENT_URL`:
```
CLIENT_URL=https://yourdomain.com
```
6. Click **Save Changes**
7. Render will automatically redeploy

---

## Part 5: Seed Initial Data (Optional)

### Option 1: Using Supabase SQL Editor
1. Go to Supabase SQL Editor
2. Run this to create sample phases and weeks:

```sql
-- Insert Phases
INSERT INTO "Phases" (number, title, description, "startWeek", "endWeek", "requiredPointsPercentage")
VALUES 
(1, 'Foundation', 'Learn Dart basics and Flutter fundamentals', 1, 8, 60),
(2, 'Intermediate', 'State management and API integration', 9, 16, 70),
(3, 'Advanced', 'Testing, deployment, and portfolio projects', 17, 26, 80);

-- Insert Sample Weeks for Phase 1
INSERT INTO "Weeks" ("phaseId", "weekNumber", title, description, "maxPoints", "assignmentPoints")
VALUES 
(1, 1, 'Introduction to Dart', 'Learn Dart programming basics', 100, 70),
(1, 2, 'Dart Functions & OOP', 'Master functions and object-oriented programming', 100, 70),
(1, 3, 'Flutter Setup', 'Set up Flutter development environment', 100, 70);
```

### Option 2: Using Backend API
1. Create an admin account
2. Use the admin panel to create phases and weeks

---

## Part 6: Post-Deployment Checklist

### Backend Checks
- [ ] Backend URL is accessible
- [ ] `/api/health` endpoint returns OK
- [ ] Database connection works
- [ ] Environment variables are set correctly
- [ ] CORS is configured with your domain

### Frontend Checks
- [ ] Frontend loads on your domain
- [ ] Login page appears
- [ ] Can login with admin credentials
- [ ] Dashboard loads after login
- [ ] API calls work (check browser console)
- [ ] All pages are accessible
- [ ] Images and assets load correctly

### Database Checks
- [ ] All tables created in Supabase
- [ ] Default admin user exists
- [ ] Can create new users
- [ ] Data persists correctly

---

## Troubleshooting

### Issue: "Failed to load dashboard"
**Solution**: Check CORS settings in Render. Make sure your domain is in `CORS_ORIGINS`.

### Issue: "Network Error" in frontend
**Solution**: 
1. Check `VITE_API_URL` in frontend `.env.production`
2. Make sure backend URL is correct
3. Check if backend is running on Render

### Issue: "Database connection failed"
**Solution**:
1. Verify `DATABASE_URL` in Render environment variables
2. Check Supabase is running
3. Verify password is correct: `Super@base1234`

### Issue: "401 Unauthorized"
**Solution**:
1. Clear browser localStorage
2. Login again
3. Check JWT_SECRET is set in Render

### Issue: "CORS Error"
**Solution**:
1. Add your domain to `CORS_ORIGINS` in Render
2. Include both `https://yourdomain.com` and `https://www.yourdomain.com`
3. Redeploy backend after changing

### Issue: "404 on page refresh"
**Solution**:
1. Add `.htaccess` file (Apache) or configure Nginx
2. Make sure server redirects all routes to `index.html`

---

## Maintenance

### Update Backend
1. Make changes to code
2. Commit and push to Git
3. Render auto-deploys from Git

### Update Frontend
1. Make changes to code
2. Run `npm run build`
3. Upload new `dist` files to your domain

### Backup Database
1. Go to Supabase Dashboard
2. Database → Backups
3. Download backup

### Monitor Logs
- **Backend**: Render Dashboard → Logs tab
- **Frontend**: Browser Console (F12)
- **Database**: Supabase Dashboard → Logs

---

## Security Recommendations

1. **Change Default Admin Password**
   - Login as admin
   - Go to profile settings
   - Change password immediately

2. **Use Strong JWT Secrets**
   - Generate new secrets: `openssl rand -base64 32`
   - Update in Render environment variables

3. **Enable HTTPS**
   - Render provides HTTPS automatically
   - Make sure your domain has SSL certificate

4. **Regular Backups**
   - Set up automatic backups in Supabase
   - Download backups weekly

5. **Monitor Logs**
   - Check Render logs daily
   - Set up error alerts

---

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check Render logs for backend errors
3. Check Supabase logs for database errors
4. Verify all environment variables are set correctly

---

## Summary

✅ Database: Supabase PostgreSQL
✅ Backend: Render (Node.js + Express)
✅ Frontend: Your Domain (Static Files)

**Your URLs:**
- Frontend: https://yourdomain.com
- Backend: https://your-backend-url.onrender.com
- Database: db.tpzphnogmpdndqiipylv.supabase.co

**Default Admin:**
- Email: admin@flutterlearn.com
- Password: admin123

🎉 **Deployment Complete!**
