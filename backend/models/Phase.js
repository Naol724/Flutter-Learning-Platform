const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Phase = sequelize.define('Phase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startWeek: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  endWeek: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiredPointsPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 80,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'phases' // Explicitly specify table name
});

module.exports = Phase;