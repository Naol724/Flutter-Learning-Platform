const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine if we're using a connection URL (production) or individual credentials (development)
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  // Production: Parse the DATABASE_URL and force IPv4
  const url = new URL(databaseUrl);
  
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: url.hostname,
    port: url.port || 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // Force IPv4
      family: 4
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