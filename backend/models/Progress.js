const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  weekId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Week',
      key: 'id'
    }
  },
  videoWatched: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  videoProgress: {
    type: DataTypes.INTEGER, // percentage 0-100
    defaultValue: 0
  },
  videoWatchedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assignmentSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  assignmentSubmittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  videoPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  assignmentPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bonusPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  unlockedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'weekId']
    }
  ]
});

module.exports = Progress;