const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getWeekContent,
  upsertWeekContent,
  deleteWeekContent,
  getQuizSubmissions
} = require('../controllers/adminContentController');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Content Management Routes
router.get('/weeks/:weekId/content', getWeekContent);
router.post('/weeks/:weekId/content', upsertWeekContent);
router.put('/weeks/:weekId/content', upsertWeekContent);
router.delete('/weeks/:weekId/content', deleteWeekContent);

// Quiz Submissions Management
router.get('/weeks/:weekId/quiz-submissions', getQuizSubmissions);

module.exports = router;
