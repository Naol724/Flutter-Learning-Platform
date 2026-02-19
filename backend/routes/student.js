const express = require('express');
const { authenticateToken, requireStudent } = require('../middleware/auth');
const { uploadAssignment, handleUploadError } = require('../middleware/upload');
const {
  getDashboard,
  getWeekDetails,
  submitAssignment,
  updateVideoProgress,
  getProgressSummary,
  updateNotes,
  getNotes,
  uploadNotesFile,
  getCertificate,
  getStudentNotes,
  saveStudentNotes,
  uploadStudentFiles,
  deleteSubmission
} = require('../controllers/studentController');

const router = express.Router();

// Apply authentication and student role check to all routes
router.use(authenticateToken);
router.use(requireStudent);

// Routes
router.get('/dashboard', getDashboard);
router.get('/week/:weekId', getWeekDetails);
router.post('/week/:weekId/submit', uploadAssignment.single('assignment'), handleUploadError, submitAssignment);
router.put('/week/:weekId/video-progress', updateVideoProgress);
router.get('/progress-summary', getProgressSummary);
// Notes routes
router.put('/week/:weekId/notes', updateNotes);
router.get('/week/:weekId/notes', getNotes);
router.post('/week/:weekId/notes/upload', uploadAssignment.single('notesFile'), handleUploadError, uploadNotesFile);
router.get('/certificate', getCertificate);
// Dashboard notes routes
router.get('/notes', getStudentNotes);
router.post('/notes', saveStudentNotes);
router.post('/files/upload', uploadAssignment.array('files', 5), handleUploadError, uploadStudentFiles);
// Delete submission route
router.delete('/submission/:submissionId', deleteSubmission);

module.exports = router;