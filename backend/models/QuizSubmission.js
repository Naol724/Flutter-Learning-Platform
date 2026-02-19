const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QuizSubmission = sequelize.define('QuizSubmission', {
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
  answers: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_submissions',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'weekId']
    }
  ]
});

module.exports = QuizSubmission;
