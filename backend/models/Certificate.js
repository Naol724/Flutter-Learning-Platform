const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  certificateId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  completionPercentage: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  courseDuration: {
    type: DataTypes.INTEGER, // in days
    allowNull: false
  },
  isEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Certificate;