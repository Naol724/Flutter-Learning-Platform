const express = require('express');
const router = express.Router();
const { authenticateToken, requireStudent } = require('../middleware/auth');
const { submitQuiz, getQuizResults } = require('../controllers/quizController');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireStudent);

// Quiz Routes for Students
router.post('/weeks/:weekId/submit', submitQuiz);
router.get('/weeks/:weekId/results', getQuizResults);

module.exports = router;
