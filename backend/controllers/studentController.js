const { User, Phase, Week, Content, Submission, Progress, Certificate } = require('../models');
const { Op } = require('sequelize');

// Get student dashboard data
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with current progress
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    // Get all phases with weeks
    const phases = await Phase.findAll({
      include: [{
        model: Week,
        as: 'weeks',
        include: [{
          model: Content,
          as: 'content'
        }, {
          model: Progress,
          as: 'progress',
          where: { userId },
          required: false
        }]
      }],
      order: [['number', 'ASC'], [{ model: Week, as: 'weeks' }, 'weekNumber', 'ASC']]
    });

    // Calculate overall progress
    const totalWeeks = await Week.count();
    const completedWeeks = await Progress.count({
      where: { userId, completed: true }
    });

    const overallProgress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

    // Get current week info
    const currentWeek = await Week.findOne({
      where: { weekNumber: user.currentWeek },
      include: [{
        model: Content,
        as: 'content'
      }, {
        model: Progress,
        as: 'progress',
        where: { userId },
        required: false
      }]
    });

    // Get recent submissions
    const recentSubmissions = await Submission.findAll({
      where: { userId },
      include: [{
        model: Week,
        as: 'week',
        attributes: ['weekNumber', 'title']
      }],
      order: [['submittedAt', 'DESC']],
      limit: 5
    });

    // Check if eligible for certificate
    const certificate = await Certificate.findOne({ where: { userId } });

    // Ensure resources are properly serialized in phases data
    phases.forEach(phase => {
      phase.weeks.forEach(week => {
        if (week.content) {
          if (week.content.resources && typeof week.content.resources === 'string') {
            week.content.resources = JSON.parse(week.content.resources);
          }
          if (week.content.multipleChoiceQuestions && typeof week.content.multipleChoiceQuestions === 'string') {
            week.content.multipleChoiceQuestions = JSON.parse(week.content.multipleChoiceQuestions);
          }
        }
      });
    });

    // Ensure resources are properly serialized in current week
    if (currentWeek && currentWeek.content) {
      if (currentWeek.content.resources && typeof currentWeek.content.resources === 'string') {
        currentWeek.content.resources = JSON.parse(currentWeek.content.resources);
      }
      if (currentWeek.content.multipleChoiceQuestions && typeof currentWeek.content.multipleChoiceQuestions === 'string') {
        currentWeek.content.multipleChoiceQuestions = JSON.parse(currentWeek.content.multipleChoiceQuestions);
      }
    }

    res.json({
      user,
      phases,
      currentWeek,
      overallProgress,
      completedWeeks,
      totalWeeks,
      recentSubmissions,
      certificate,
      stats: {
        totalPoints: user.totalPoints,
        currentPhase: user.currentPhase,
        currentWeek: user.currentWeek
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
};

// Get specific week details
const getWeekDetails = async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.user.id;

    const week = await Week.findByPk(weekId, {
      include: [{
        model: Content,
        as: 'content'
      }, {
        model: Phase,
        as: 'phase'
      }, {
        model: Progress,
        as: 'progress',
        where: { userId },
        required: false
      }, {
        model: Submission,
        as: 'submissions',
        where: { userId },
        required: false,
        order: [['submittedAt', 'DESC']]
      }]
    });

    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }

    const progress = week.progress?.[0];
    if (progress?.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Week is locked. Complete previous weeks first.' });
    }

    // Ensure resources is properly serialized as JSON
    if (week.content && week.content.resources) {
      if (typeof week.content.resources === 'string') {
        week.content.resources = JSON.parse(week.content.resources);
      }
      if (week.content.multipleChoiceQuestions && typeof week.content.multipleChoiceQuestions === 'string') {
        week.content.multipleChoiceQuestions = JSON.parse(week.content.multipleChoiceQuestions);
      }
    }

    res.json({ week });
  } catch (error) {
    console.error('Get week details error:', error);
    res.status(500).json({ message: 'Failed to get week details', error: error.message });
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { description, githubUrl } = req.body;
    const userId = req.user.id;

    console.log('=== ASSIGNMENT SUBMISSION DEBUG ===');
    console.log('req.params:', req.params);
    console.log('Week ID from params:', weekId);
    console.log('Week ID type:', typeof weekId);
    console.log('User ID:', userId);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);

    // Validate user
    if (!userId) {
      console.log('ERROR: User ID is undefined!');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate weekId
    if (!weekId) {
      console.log('ERROR: Week ID is undefined!');
      return res.status(400).json({ message: 'Week ID is required' });
    }

    // Check if week exists and is unlocked
    const week = await Week.findByPk(weekId, {
      include: [{
        model: Progress,
        as: 'progress',
        where: { userId },
        required: false
      }, {
        model: Content,
        as: 'content'
      }]
    });

    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }

    const progress = week.progress?.[0];
    if (progress?.isLocked) {
      return res.status(403).json({ message: 'Week is locked' });
    }

    // Check if assignment deadline has passed
    const deadline = week.content?.assignmentDeadline;
    const isOnTime = !deadline || new Date() <= new Date(deadline);

    // Create submission
    const submissionData = {
      userId,
      weekId,
      description,
      githubUrl,
      submissionType: req.file ? 'file' : 'text',
      status: 'submitted',
      isOnTime,
      submittedAt: new Date()
    };

    // Handle file upload
    if (req.file) {
      submissionData.filePath = req.file.path;
      submissionData.fileName = req.file.originalname;
      submissionData.fileSize = req.file.size;
    }

    const submission = await Submission.create(submissionData);

    // Update progress
    if (progress) {
      await progress.update({
        assignmentSubmitted: true,
        assignmentSubmittedAt: new Date()
      });
    } else {
      await Progress.create({
        userId,
        weekId,
        assignmentSubmitted: true,
        assignmentSubmittedAt: new Date(),
        isLocked: false
      });
    }

    // Send notification to admin
    const io = req.app.get('io');
    io.emit('new-submission', {
      userId,
      weekId,
      submissionId: submission.id,
      userName: req.user.name,
      weekTitle: week.title
    });

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission,
      isOnTime
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
};

// Update video progress
const updateVideoProgress = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { progress: videoProgress, completed } = req.body;
    const userId = req.user.id;

    // Find or create progress record
    let progress = await Progress.findOne({
      where: { userId, weekId }
    });

    if (!progress) {
      progress = await Progress.create({
        userId,
        weekId,
        isLocked: false
      });
    }

    // Update video progress
    const updateData = {
      videoProgress: Math.min(100, Math.max(0, videoProgress))
    };

    // If video is completed (>90% watched), award points
    if (completed || videoProgress >= 90) {
      const week = await Week.findByPk(weekId);
      updateData.videoWatched = true;
      updateData.videoWatchedAt = new Date();
      updateData.videoPoints = week.videoPoints;
      updateData.points = progress.points - progress.videoPoints + week.videoPoints;
    }

    await progress.update(updateData);

    // Update user total points
    const totalPoints = await Progress.sum('points', {
      where: { userId }
    });
    await req.user.update({ totalPoints: totalPoints || 0 });

    res.json({
      message: 'Video progress updated',
      progress
    });
  } catch (error) {
    console.error('Update video progress error:', error);
    res.status(500).json({ message: 'Failed to update video progress', error: error.message });
  }
};

// Get student progress summary
const getProgressSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get progress by phase
    const phases = await Phase.findAll({
      include: [{
        model: Week,
        as: 'weeks',
        include: [{
          model: Progress,
          as: 'progress',
          where: { userId },
          required: false
        }]
      }],
      order: [['number', 'ASC']]
    });

    const progressSummary = phases.map(phase => {
      const weeks = phase.weeks;
      const totalWeeks = weeks.length;
      const completedWeeks = weeks.filter(week => 
        week.progress?.[0]?.completed
      ).length;
      
      const totalPossiblePoints = weeks.reduce((sum, week) => sum + week.maxPoints, 0);
      const earnedPoints = weeks.reduce((sum, week) => 
        sum + (week.progress?.[0]?.points || 0), 0
      );

      const progressPercentage = totalPossiblePoints > 0 
        ? Math.round((earnedPoints / totalPossiblePoints) * 100) 
        : 0;

      return {
        phase: {
          id: phase.id,
          number: phase.number,
          title: phase.title,
          color: phase.color
        },
        totalWeeks,
        completedWeeks,
        totalPossiblePoints,
        earnedPoints,
        progressPercentage,
        isCompleted: completedWeeks === totalWeeks && progressPercentage >= phase.requiredPointsPercentage
      };
    });

    res.json({ progressSummary });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ message: 'Failed to get progress summary', error: error.message });
  }
};

// Update student notes
const updateNotes = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Find or create student notes for this week
    const [submission, created] = await Submission.findOrCreate({
      where: {
        userId,
        weekId,
        type: 'notes'
      },
      defaults: {
        notes,
        status: 'draft'
      }
    });

    if (!created) {
      // Update existing notes
      await submission.update({ notes });
    }

    res.json({
      message: 'Notes saved successfully',
      submission
    });
  } catch (error) {
    console.error('Update notes error:', error);
    res.status(500).json({ message: 'Failed to save notes', error: error.message });
  }
};

// Get student notes
const getNotes = async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.user.id;

    const submission = await Submission.findOne({
      where: {
        userId,
        weekId,
        type: 'notes'
      }
    });

    res.json({
      notes: submission?.notes || '',
      filePath: submission?.filePath || null
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Failed to get notes', error: error.message });
  }
};

// Upload notes file
const uploadNotesFile = async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.user.id;
    const notesFile = req.file;

    if (!notesFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find or create submission
    const [submission, created] = await Submission.findOrCreate({
      where: {
        userId,
        weekId,
        type: 'notes'
      },
      defaults: {
        filePath: notesFile.filename,
        originalFileName: notesFile.originalname,
        status: 'draft'
      }
    });

    if (!created) {
      // Update existing submission
      await submission.update({
        filePath: notesFile.filename,
        originalFileName: notesFile.originalname
      });
    }

    res.json({
      message: 'File uploaded successfully',
      submission
    });
  } catch (error) {
    console.error('Upload notes file error:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
};

// Get certificate
const getCertificate = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has completed all phases
    const phases = await Phase.findAll({
      include: [{
        model: Week,
        as: 'weeks',
        include: [{
          model: Progress,
          as: 'progress',
          where: { userId },
          required: false
        }]
      }]
    });

    const allPhasesCompleted = phases.every(phase => {
      const phaseProgress = phase.weeks.filter(week => 
        week.progress && week.progress.length > 0 && week.progress[0].completed
      ).length;
      return phaseProgress >= phase.weeks.length * 0.8; // 80% completion
    });

    if (!allPhasesCompleted) {
      return res.status(400).json({ 
        message: 'You must complete all phases to earn a certificate' 
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ where: { userId } });

    if (!certificate) {
      // Generate new certificate
      certificate = await Certificate.create({
        userId,
        certificateId: `FLUTTER-${Date.now()}-${userId}`,
        issuedAt: new Date(),
        status: 'issued'
      });
    }

    // Generate certificate URL (in a real app, this would be a PDF generation service)
    const certificateUrl = `/api/student/certificate/${certificate.id}/download`;

    res.json({
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
        certificateUrl
      }
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ message: 'Failed to get certificate', error: error.message });
  }
};

// Get student dashboard notes
const getStudentNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get student's notes from database (you might need to create a StudentNotes model)
    // For now, return empty data
    res.json({
      notes: '',
      files: []
    });
  } catch (error) {
    console.error('Get student notes error:', error);
    res.status(500).json({ message: 'Failed to get student notes', error: error.message });
  }
};

// Save student dashboard notes
const saveStudentNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;
    
    // Save notes to database (you might need to create a StudentNotes model)
    // For now, just return success
    res.json({ message: 'Notes saved successfully' });
  } catch (error) {
    console.error('Save student notes error:', error);
    res.status(500).json({ message: 'Failed to save student notes', error: error.message });
  }
};

// Upload student files
const uploadStudentFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Process uploaded files
    const uploadedFiles = files.map(file => ({
      fileName: file.originalname,
      fileSize: file.size,
      filePath: file.path,
      uploadedAt: new Date()
    }));
    
    // Save to database (you might need to create a StudentFiles model)
    // For now, just return success
    res.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload student files error:', error);
    res.status(500).json({ message: 'Failed to upload student files', error: error.message });
  }
};

// Delete student's own submission
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    // Find the submission and verify it belongs to the current student
    const submission = await Submission.findOne({
      where: {
        id: submissionId,
        userId: userId
      }
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or you do not have permission to delete it' });
    }

    // Check if submission is already reviewed/approved
    if (submission.status === 'reviewed' || submission.status === 'approved') {
      return res.status(400).json({ message: 'Cannot delete submission that has been reviewed or approved' });
    }

    // Delete the submission
    await submission.destroy();

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Failed to delete submission', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getWeekDetails,
  submitAssignment,
  updateVideoProgress,
  getProgressSummary,
  updateNotes,
  getNotes,
  getCertificate,
  uploadNotesFile,
  getStudentNotes,
  saveStudentNotes,
  uploadStudentFiles,
  deleteSubmission
};