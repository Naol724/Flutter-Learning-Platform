const { Sequelize } = require('sequelize');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 DNS resolution
dns.setDefaultResultOrder('ipv4first');

// Determine if we're using a connection URL (production) or individual credentials (development)
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  // Production: Use DATABASE_URL from environment (Supabase/Render)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Supabase
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else {
  // Development: Use individual credentials
  sequelize = new Sequelize(
    process.env.DB_NAME || 'flutter_learning_platform',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      }
    }
  );
}

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection test successful');
  })
  .catch(err => {
    console.error('❌ Database connection test failed:', err.message);
  });

module.exports = sequelize;