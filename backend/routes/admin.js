const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadNotes, handleUploadError } = require('../middleware/upload');
const {
  getDashboard,
  getCourseStructure,
  getStudents,
  getStudentDetails,
  getSubmissions,
  reviewSubmission,
  updateSubmission,
  deleteSubmission,
  updateWeekContent,
  approvePhaseCompletion,
  getWeekContent,
  updateContent,
  addContent,
  getContentByType,
  toggleUserStatus,
  deleteUser,
  createUser,
  createWeek,
  updateWeek,
  deleteWeek
} = require('../controllers/adminController');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Validation rules
const reviewSubmissionValidation = [
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a positive number'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['reviewed', 'approved', 'rejected', 'submitted'])
    .withMessage('Invalid status')
];

const updateContentValidation = [
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Instructions must not exceed 5000 characters'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid video URL'),
  body('videoDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Video duration must be a positive number'),
  body('assignmentDescription')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Assignment description must not exceed 2000 characters'),
  body('assignmentDeadline')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid deadline date')
];

const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be student or admin')
];

const toggleUserValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Routes
router.get('/dashboard', getDashboard);
router.get('/course-structure', getCourseStructure);
router.get('/students', getStudents);
router.get('/students/:studentId', getStudentDetails);
router.post('/users', createUserValidation, createUser);
router.put('/users/:userId/toggle-status', toggleUserValidation, toggleUserStatus);
router.delete('/users/:userId', deleteUser);
router.get('/submissions', getSubmissions);
router.get('/week/:weekId', getWeekContent);
router.get('/week/:weekId/content/:type', getContentByType);
router.put('/submissions/:submissionId/review', reviewSubmissionValidation, reviewSubmission);
router.put('/submissions/:submissionId', reviewSubmissionValidation, updateSubmission);
router.delete('/submissions/:submissionId', deleteSubmission);
router.put('/week/:weekId/content', uploadNotes.single('notesFile'), handleUploadError, updateContentValidation, updateWeekContent);
router.put('/week/:weekId/content/:type', updateContent);
router.post('/week/:weekId/content/:type', addContent);
router.post('/students/:studentId/approve-phase/:phaseId', approvePhaseCompletion);
router.post('/week', createWeek);
router.put('/week/:weekId', updateWeek);
router.delete('/week/:weekId', deleteWeek);

module.exports = router;