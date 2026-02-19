const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Week = sequelize.define('Week', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Phase',
      key: 'id'
    }
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  videoPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 40
  },
  assignmentPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'weeks'
});

module.exports = Week;