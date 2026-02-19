const sequelize = require('../config/db');
const User = require('./User');
const Phase = require('./Phase');
const Week = require('./Week');
const Content = require('./Content');
const Submission = require('./Submission');
const Progress = require('./Progress');
const Certificate = require('./Certificate');
const QuizSubmission = require('./QuizSubmission');

// Define associations
User.hasMany(Submission, { foreignKey: 'userId', as: 'submissions' });
User.hasMany(Progress, { foreignKey: 'userId', as: 'progress' });
User.hasMany(QuizSubmission, { foreignKey: 'userId', as: 'quizSubmissions' });
User.hasOne(Certificate, { foreignKey: 'userId', as: 'certificate' });

Phase.hasMany(Week, { foreignKey: 'phaseId', as: 'weeks' });

Week.belongsTo(Phase, { foreignKey: 'phaseId', as: 'phase' });
Week.hasOne(Content, { foreignKey: 'weekId', as: 'content' });
Week.hasMany(Submission, { foreignKey: 'weekId', as: 'submissions' });
Week.hasMany(Progress, { foreignKey: 'weekId', as: 'progress' });
Week.hasMany(QuizSubmission, { foreignKey: 'weekId', as: 'quizSubmissions' });

Content.belongsTo(Week, { foreignKey: 'weekId', as: 'week' });

Submission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Submission.belongsTo(Week, { foreignKey: 'weekId', as: 'week' });

Progress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Progress.belongsTo(Week, { foreignKey: 'weekId', as: 'week' });

QuizSubmission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
QuizSubmission.belongsTo(Week, { foreignKey: 'weekId', as: 'week' });

Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Phase,
  Week,
  Content,
  Submission,
  Progress,
  Certificate,
  QuizSubmission
};