# Install PostgreSQL Dependencies

## Step 1: Install PostgreSQL Packages

Run this command in the `backend` folder:

```bash
npm install pg pg-hstore
npm uninstall mysql2
```

## Step 2: Verify Installation

Check your `package.json` - you should see:
```json
"dependencies": {
  "pg": "^8.11.3",
  "pg-hstore": "^2.3.4",
  ...
}
```

And `mysql2` should be removed.

## Step 3: Test Local PostgreSQL Connection (Optional)

If you want to test locally before deploying:

### Install PostgreSQL Locally

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password during installation
4. Default port: 5432

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Local Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE flutter_learning_platform;

# Exit
\q
```

### Update .env for Local Testing

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASS=your_postgres_password
DB_NAME=flutter_learning_platform
DB_PORT=5432
```

### Run Database Setup

```bash
psql -U postgres -d flutter_learning_platform -f database_setup_postgres.sql
```

## Step 4: Test Backend

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
```

## Done!

Your backend is now ready for PostgreSQL and Supabase deployment! 🎉
