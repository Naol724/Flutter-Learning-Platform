const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  weekId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Week',
      key: 'id'
    }
  },
  // 1. Instructions
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 2. Weekly Notes (Text-based)
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 3. Two Video Lessons
  video1Url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  video1Title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  video1Duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  video2Url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  video2Title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  video2Duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  // 4. Multiple Choice Questions
  multipleChoiceQuestions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // 5. Assignment
  assignmentDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assignmentDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assignmentGradingCriteria: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Legacy fields for backward compatibility
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  videoDuration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  notesFilePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resources: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'contents'
});

module.exports = Content;