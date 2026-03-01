const { User, Phase, Week, Content, Submission, Progress, Certificate, QuizSubmission } = require('../models');
const { Op } = require('sequelize');
const { generateCertificate } = require('../utils/certificateGenerator');
const { sendCertificateEmail } = require('../utils/mailer');

// Get admin dashboard
const getDashboard = async (req, res) => {
  try {
    // Get statistics
    const totalStudents = await User.count({ where: { role: 'student' } });
    const activeStudents = await User.count({ 
      where: { 
        role: 'student', 
        isActive: true,
        lastLoginAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      } 
    });
    
    const pendingSubmissions = await Submission.count({ 
      where: { status: 'submitted' } 
    });
    
    const pendingQuizSubmissions = await QuizSubmission.count();
    
    const totalSubmissions = await Submission.count() + await QuizSubmission.count();
    const certificatesIssued = await Certificate.count();

    // Get recent submissions (assignments only for dashboard)
    const recentAssignmentSubmissions = await Submission.findAll({
      where: { status: 'submitted' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Week,
          as: 'week',
          attributes: ['weekNumber', 'title'],
          include: [{
            model: Phase,
            as: 'phase',
            attributes: ['number', 'title']
          }]
        }
      ],
      order: [['submittedAt', 'DESC']],
      limit: 5
    });

    // Get student progress overview
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'currentPhase', 'currentWeek', 'totalPoints', 'lastLoginAt'],
      order: [['totalPoints', 'DESC']],
      limit: 10
    });

    res.json({
      stats: {
        totalStudents,
        activeStudents,
        pendingSubmissions: pendingSubmissions + pendingQuizSubmissions,
        totalSubmissions,
        certificatesIssued
      },
      recentSubmissions: recentAssignmentSubmissions,
      topStudents: students
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
};

// Get full course structure (phases + weeks + content summary) for admin
const getCourseStructure = async (req, res) => {
  try {
    const phases = await Phase.findAll({
      include: [
        {
          model: Week,
          as: 'weeks',
          include: [
            {
              model: Content,
              as: 'content'
            }
          ],
          order: [['weekNumber', 'ASC']]
        }
      ],
      order: [['number', 'ASC']]
    });

    // Ensure resources and multipleChoiceQuestions are properly serialized
    phases.forEach(phase => {
      if (phase.weeks) {
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
      }
    });

    res.json(phases);
  } catch (error) {
    console.error('Get course structure error:', error);
    res.status(500).json({ message: 'Failed to load course structure', error: error.message });
  }
};

// Get week + content for admin editing
const getWeekContent = async (req, res) => {
  try {
    const { weekId } = req.params;

    const week = await Week.findByPk(weekId, {
      include: [{
        model: Content,
        as: 'content'
      }, {
        model: Phase,
        as: 'phase'
      }]
    });

    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }

    res.json({ week });
  } catch (error) {
    console.error('Get week content error:', error);
    res.status(500).json({ message: 'Failed to get week content', error: error.message });
  }
};

// Get all students with progress
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      role: 'student'
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: students } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{
        model: Certificate,
        as: 'certificate',
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get progress for each student
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const totalWeeks = await Week.count();
        const completedWeeks = await Progress.count({
          where: { userId: student.id, completed: true }
        });
        
        const progressPercentage = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
        
        return {
          ...student.toJSON(),
          progressPercentage,
          completedWeeks,
          totalWeeks
        };
      })
    );

    res.json({
      students: studentsWithProgress,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Failed to get students', error: error.message });
  }
};

// Get student details
const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findByPk(studentId, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{
        model: Certificate,
        as: 'certificate',
        required: false
      }]
    });

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get detailed progress
    const progress = await Progress.findAll({
      where: { userId: studentId },
      include: [{
        model: Week,
        as: 'week',
        include: [{
          model: Phase,
          as: 'phase'
        }]
      }],
      order: [[{ model: Week, as: 'week' }, 'weekNumber', 'ASC']]
    });

    // Get submissions
    const submissions = await Submission.findAll({
      where: { userId: studentId },
      include: [{
        model: Week,
        as: 'week',
        include: [{
          model: Phase,
          as: 'phase'
        }]
      }],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      student,
      progress,
      submissions
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ message: 'Failed to get student details', error: error.message });
  }
};

// Get all submissions for review
const getSubmissions = async (req, res) => {
  try {
    const { status = 'all', type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get all assignment submissions
    const { count: assignmentCount, rows: assignmentSubmissions } = await Submission.findAndCountAll({
      where: status !== 'all' ? { status } : {},
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Week,
          as: 'week',
          include: [{
            model: Phase,
            as: 'phase'
          }]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    // Get all quiz submissions
    let quizSubmissions = await QuizSubmission.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Week,
          as: 'week',
          include: [{
            model: Phase,
            as: 'phase'
          }]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    // For quiz submissions, determine status based on whether they have been reviewed
    // Quiz submissions are considered 'submitted' until they receive a score > 0
    quizSubmissions = quizSubmissions.map(quiz => ({
      ...quiz.toJSON(),
      type: 'quiz',
      status: quiz.score > 0 ? 'reviewed' : 'submitted'
    }));

    // Apply status filtering for quiz submissions if needed
    if (status !== 'all') {
      quizSubmissions = quizSubmissions.filter(quiz => quiz.status === status);
    }

    // Combine and filter by type
    let allSubmissions = [
      ...assignmentSubmissions.map(sub => ({
        ...sub.toJSON(),
        type: 'assignment'
      })),
      ...quizSubmissions
    ];

    // Apply type filtering if needed
    if (type !== 'all') {
      allSubmissions = allSubmissions.filter(sub => sub.type === type);
    }

    // Sort by submission date
    allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Apply pagination to combined results
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedSubmissions = allSubmissions.slice(startIndex, endIndex);

    res.json({
      submissions: paginatedSubmissions,
      pagination: {
        total: allSubmissions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(allSubmissions.length / limit)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Failed to get submissions', error: error.message });
  }
};

// Review and score submission
const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback, status = 'reviewed' } = req.body;

    console.log('=== ADMIN REVIEW SUBMISSION DEBUG ===');
    console.log('Submission ID:', submissionId);
    console.log('Request body:', req.body);
    console.log('Admin user ID:', req.user.id);

    // Try to find submission in Assignment table first
    let submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: User,
          as: 'user'
        },
        {
          model: Week,
          as: 'week'
        }
      ]
    });

    let submissionType = 'assignment';

    // If not found in Assignment table, try QuizSubmission table
    if (!submission) {
      submission = await QuizSubmission.findByPk(submissionId, {
        include: [
          {
            model: User,
            as: 'user'
          },
          {
            model: Week,
            as: 'week'
          }
        ]
      });
      submissionType = 'quiz';
    }

    console.log('Submission found:', submission ? 'YES' : 'NO');
    console.log('Submission type:', submissionType);
    console.log('Submission details:', submission ? {
      id: submission.id,
      userId: submission.userId,
      weekId: submission.weekId,
      status: submission.status
    } : 'NULL');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission based on type
    if (submissionType === 'quiz') {
      // Update quiz submission
      await submission.update({
        score: parseInt(score),
        feedback,
        status, // Note: QuizSubmission might not have status field, but we'll include it
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      });

      // Update progress with quiz points (quiz points are calculated differently)
      const progress = await Progress.findOne({
        where: { 
          userId: submission.userId, 
          weekId: submission.weekId 
        }
      });

      if (progress) {
        const quizPoints = Math.round((score / submission.totalQuestions) * submission.week.assignmentPoints);
        const bonusPoints = 0; // No bonus for quiz submissions
        
        const newPoints = progress.points - progress.quizPoints - progress.bonusPoints + quizPoints + bonusPoints;
        
        await progress.update({
          quizPoints,
          bonusPoints,
          points: newPoints,
          completed: progress.videoWatched && (score / submission.totalQuestions) >= 0.6 // 60% minimum to complete
        });

        // Update user total points
        const totalPoints = await Progress.sum('points', {
          where: { userId: submission.userId }
        });
        await submission.user.update({ totalPoints: totalPoints || 0 });
      }
    } else {
      // Update assignment submission
      await submission.update({
        score: parseInt(score),
        feedback,
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      });

      // Update progress with assignment points
      const progress = await Progress.findOne({
        where: { 
          userId: submission.userId, 
          weekId: submission.weekId 
        }
      });

      if (progress) {
        const assignmentPoints = Math.round((score / 100) * submission.week.assignmentPoints);
        const bonusPoints = submission.isOnTime ? Math.round(assignmentPoints * 0.1) : 0;
        
        const newPoints = progress.points - progress.assignmentPoints - progress.bonusPoints + assignmentPoints + bonusPoints;
        
        await progress.update({
          assignmentPoints,
          bonusPoints,
          points: newPoints,
          completed: progress.videoWatched && score >= 60 // 60% minimum to complete
        });

        // Update user total points
        const totalPoints = await Progress.sum('points', {
          where: { userId: submission.userId }
        });
        await submission.user.update({ totalPoints: totalPoints || 0 });
      }
    }

    console.log('Submission updated successfully');

    // Send notification to student
    const io = req.app.get('io');
    io.to(`user-${submission.userId}`).emit('submission-reviewed', {
      type: submissionType,
      score: parseInt(score),
      feedback,
      status
    });

    res.json({ 
      message: 'Submission reviewed successfully',
      type: submissionType
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Failed to review submission', error: error.message });
  }
};

// Update submission (edit)
const updateSubmission = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('=== VALIDATION ERRORS ===');
      console.log(errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { submissionId } = req.params;
    const { score, feedback, status } = req.body;

    // Try to find submission in Assignment table first
    let submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: User,
          as: 'user'
        },
        {
          model: Week,
          as: 'week'
        }
      ]
    });

    let submissionType = 'assignment';

    // If not found in Assignment, try QuizSubmission
    if (!submission) {
      submission = await QuizSubmission.findByPk(submissionId, {
        include: [
          {
            model: User,
            as: 'user'
          },
          {
            model: Week,
            as: 'week'
          }
        ]
      });
      submissionType = 'quiz';
    }

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submissionType === 'quiz') {
      // Update quiz submission
      await submission.update({
        score: parseInt(score),
        feedback,
        status
      });

      // Update progress with quiz points
      const progress = await Progress.findOne({
        where: { 
          userId: submission.userId, 
          weekId: submission.weekId 
        }
      });

      if (progress) {
        const quizPoints = Math.round((score / submission.totalQuestions) * submission.week.assignmentPoints);
        const bonusPoints = 0;
        
        const newPoints = progress.points - progress.quizPoints - progress.bonusPoints + quizPoints + bonusPoints;
        
        await progress.update({
          quizPoints,
          bonusPoints,
          points: newPoints,
          completed: progress.videoWatched && (score / submission.totalQuestions) >= 0.6
        });

        // Update user total points
        const totalPoints = await Progress.sum('points', {
          where: { userId: submission.userId }
        });
        await submission.user.update({ totalPoints: totalPoints || 0 });
      }
    } else {
      // Update assignment submission
      await submission.update({
        score: parseInt(score),
        feedback,
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      });

      // Update progress with assignment points
      const progress = await Progress.findOne({
        where: { 
          userId: submission.userId, 
          weekId: submission.weekId 
        }
      });

      if (progress) {
        const assignmentPoints = Math.round((score / 100) * submission.week.assignmentPoints);
        const bonusPoints = submission.isOnTime ? Math.round(assignmentPoints * 0.1) : 0;
        
        const newPoints = progress.points - progress.assignmentPoints - progress.bonusPoints + assignmentPoints + bonusPoints;
        
        await progress.update({
          assignmentPoints,
          bonusPoints,
          points: newPoints,
          completed: progress.videoWatched && score >= 60
        });

        // Update user total points
        const totalPoints = await Progress.sum('points', {
          where: { userId: submission.userId }
        });
        await submission.user.update({ totalPoints: totalPoints || 0 });
      }
    }

    res.json({ 
      message: 'Submission updated successfully',
      type: submissionType
    });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Failed to update submission', error: error.message });
  }
};

// Delete submission
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Try to find and delete from Assignment table first
    let submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: User,
          as: 'user'
        },
        {
          model: Week,
          as: 'week'
        }
      ]
    });

    let submissionType = 'assignment';

    // If not found in Assignment, try QuizSubmission
    if (!submission) {
      submission = await QuizSubmission.findByPk(submissionId, {
        include: [
          {
            model: User,
            as: 'user'
          },
          {
            model: Week,
            as: 'week'
          }
        ]
      });
      submissionType = 'quiz';
    }

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update progress to remove submission points
    const progress = await Progress.findOne({
      where: { 
        userId: submission.userId, 
        weekId: submission.weekId 
      }
    });

    if (progress) {
      if (submissionType === 'quiz') {
        const newPoints = progress.points - progress.quizPoints - progress.bonusPoints;
        await progress.update({
          quizPoints: 0,
          bonusPoints: 0,
          points: Math.max(0, newPoints),
          completed: progress.videoWatched && false
        });
      } else {
        const newPoints = progress.points - progress.assignmentPoints - progress.bonusPoints;
        await progress.update({
          assignmentPoints: 0,
          bonusPoints: 0,
          points: Math.max(0, newPoints),
          completed: progress.videoWatched && false
        });
      }

      // Update user total points
      const totalPoints = await Progress.sum('points', {
        where: { userId: submission.userId }
      });
      await submission.user.update({ totalPoints: totalPoints || 0 });
    }

    // Delete the submission
    await submission.destroy();

    res.json({ 
      message: 'Submission deleted successfully',
      type: submissionType
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Failed to delete submission', error: error.message });
  }
};

// Manage week content
const updateWeekContent = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { instructions, videoUrl, videoDuration, notes, assignmentDescription, assignmentDeadline, resources, isPublished } = req.body;

    const week = await Week.findByPk(weekId);
    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }

    // Find or create content
    let content = await Content.findOne({ where: { weekId } });
    
    const contentData = {
      instructions,
      videoUrl,
      videoDuration: videoDuration ? parseInt(videoDuration) : null,
      notes,
      assignmentDescription,
      assignmentDeadline: assignmentDeadline ? new Date(assignmentDeadline) : null,
      resources: resources || [],
      isPublished: isPublished !== undefined ? isPublished : true
    };

    // Handle notes file upload
    if (req.file) {
      contentData.notesFilePath = req.file.path;
    }

    if (content) {
      await content.update(contentData);
    } else {
      content = await Content.create({
        weekId,
        ...contentData
      });
    }

    res.json({
      message: 'Week content updated successfully',
      content
    });
  } catch (error) {
    console.error('Update week content error:', error);
    res.status(500).json({ message: 'Failed to update week content', error: error.message });
  }
};

// Approve phase completion
const approvePhaseCompletion = async (req, res) => {
  try {
    const { studentId, phaseId } = req.params;

    const student = await User.findByPk(studentId);
    const phase = await Phase.findByPk(phaseId);

    if (!student || !phase) {
      return res.status(404).json({ message: 'Student or phase not found' });
    }

    // Check if student has completed all weeks in the phase
    const phaseWeeks = await Week.findAll({
      where: { phaseId },
      include: [{
        model: Progress,
        as: 'progress',
        where: { userId: studentId },
        required: false
      }]
    });

    const completedWeeks = phaseWeeks.filter(week => 
      week.progress?.[0]?.completed
    ).length;

    if (completedWeeks < phaseWeeks.length) {
      return res.status(400).json({ 
        message: 'Student has not completed all weeks in this phase' 
      });
    }

    // Calculate phase points
    const totalPossiblePoints = phaseWeeks.reduce((sum, week) => sum + week.maxPoints, 0);
    const earnedPoints = phaseWeeks.reduce((sum, week) => 
      sum + (week.progress?.[0]?.points || 0), 0
    );
    
    const progressPercentage = totalPossiblePoints > 0 
      ? (earnedPoints / totalPossiblePoints) * 100 
      : 0;

    if (progressPercentage < phase.requiredPointsPercentage) {
      return res.status(400).json({ 
        message: `Student needs at least ${phase.requiredPointsPercentage}% to complete this phase. Current: ${Math.round(progressPercentage)}%` 
      });
    }

    // Update student's current phase
    const nextPhase = phase.number + 1;
    const hasNextPhase = await Phase.findOne({ where: { number: nextPhase } });
    
    await student.update({
      currentPhase: hasNextPhase ? nextPhase : phase.number,
      currentWeek: hasNextPhase ? phase.endWeek + 1 : student.currentWeek
    });

    // Unlock next phase weeks
    if (hasNextPhase) {
      const nextPhaseWeeks = await Week.findAll({
        where: { phaseId: hasNextPhase.id },
        order: [['weekNumber', 'ASC']],
        limit: 1 // Unlock only the first week of next phase
      });

      if (nextPhaseWeeks.length > 0) {
        await Progress.findOrCreate({
          where: { 
            userId: studentId, 
            weekId: nextPhaseWeeks[0].id 
          },
          defaults: {
            isLocked: false,
            unlockedAt: new Date()
          }
        });
      }
    }

    // Check if all phases completed - generate certificate
    const totalPhases = await Phase.count();
    if (student.currentPhase > totalPhases || (student.currentPhase === totalPhases && !hasNextPhase)) {
      await generateAndSendCertificate(studentId);
    }

    res.json({
      message: 'Phase completion approved successfully',
      nextPhase: hasNextPhase ? nextPhase : null
    });
  } catch (error) {
    console.error('Approve phase completion error:', error);
    res.status(500).json({ message: 'Failed to approve phase completion', error: error.message });
  }
};

// Generate certificate for completed student
const generateAndSendCertificate = async (studentId) => {
  try {
    const student = await User.findByPk(studentId);
    if (!student) return;

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ where: { userId: studentId } });
    if (existingCertificate) return;

    // Calculate completion stats
    const totalWeeks = await Week.count();
    const completedWeeks = await Progress.count({
      where: { userId: studentId, completed: true }
    });
    
    const completionPercentage = (completedWeeks / totalWeeks) * 100;
    const courseDuration = Math.ceil((new Date() - new Date(student.createdAt)) / (1000 * 60 * 60 * 24));

    // Generate certificate PDF
    const certificateId = `FLUTTER-${Date.now()}-${studentId}`;
    const filePath = await generateCertificate({
      studentName: student.name,
      certificateId,
      completionDate: new Date(),
      totalPoints: student.totalPoints,
      completionPercentage
    });

    // Save certificate record
    const certificate = await Certificate.create({
      userId: studentId,
      certificateId,
      filePath,
      totalPoints: student.totalPoints,
      completionPercentage,
      courseDuration
    });

    // Send email
    try {
      await sendCertificateEmail(student.email, student.name, filePath);
      await certificate.update({
        isEmailSent: true,
        emailSentAt: new Date()
      });
    } catch (emailError) {
      console.error('Failed to send certificate email:', emailError);
    }

    return certificate;
  } catch (error) {
    console.error('Generate certificate error:', error);
    throw error;
  }
};

// Update specific content type
const updateContent = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { type } = req.params;
    const updates = req.body;

    const content = await Content.findOne({ where: { weekId } });
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Update specific content type based on type parameter
    switch (type) {
      case 'notes':
        content.notes = updates.notes || content.notes;
        content.notesFilePath = updates.notesFilePath || content.notesFilePath;
        break;
      case 'video':
        content.videoUrl = updates.videoUrl || content.videoUrl;
        content.videoDuration = updates.videoDuration || content.videoDuration;
        break;
      case 'assignment':
        content.assignmentDescription = updates.assignmentDescription || content.assignmentDescription;
        content.assignmentDeadline = updates.assignmentDeadline || content.assignmentDeadline;
        break;
      case 'project':
        content.resources = updates.resources || content.resources;
        break;
      case 'publish':
        content.isPublished = updates.isPublished !== undefined ? updates.isPublished : content.isPublished;
        break;
      default:
        // General updates
        Object.assign(content, updates);
    }

    await content.save();

    res.json({
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Failed to update content' });
  }
};

// Add new content
const addContent = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { type } = req.params;
    const contentData = req.body;

    let content = await Content.findOne({ where: { weekId } });
    
    if (!content) {
      // Create new content if it doesn't exist
      content = await Content.create({
        weekId,
        isPublished: false
      });
    }

    // Add specific content type based on type parameter
    switch (type) {
      case 'notes':
        content.notes = contentData.notes;
        content.notesFilePath = contentData.notesFilePath;
        break;
      case 'video':
        content.videoUrl = contentData.videoUrl;
        content.videoDuration = contentData.videoDuration;
        break;
      case 'assignment':
        content.assignmentDescription = contentData.assignmentDescription;
        content.assignmentDeadline = contentData.assignmentDeadline;
        break;
      case 'project':
        content.resources = contentData.resources;
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    await content.save();

    res.json({
      message: 'Content added successfully',
      content
    });
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({ message: 'Failed to add content' });
  }
};

// Get content by type
const getContentByType = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { type } = req.params;

    const content = await Content.findOne({ 
      where: { weekId },
      include: [{
        model: Week,
        as: 'week',
        attributes: ['weekNumber', 'title', 'description']
      }]
    });

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    let response = { week: content.week };

    // Return specific content type
    switch (type) {
      case 'notes':
        response.notes = content.notes;
        response.notesFilePath = content.notesFilePath;
        break;
      case 'video':
        response.videoUrl = content.videoUrl;
        response.videoDuration = content.videoDuration;
        break;
      case 'assignment':
        response.assignmentDescription = content.assignmentDescription;
        response.assignmentDeadline = content.assignmentDeadline;
        break;
      case 'project':
        response.resources = content.resources;
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ message: 'Failed to get content' });
  }
};

// Disable/Enable user account
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent disabling admin accounts
    if (user.role === 'admin' && !isActive) {
      return res.status(400).json({ message: 'Cannot disable admin accounts' });
    }

    // Update user status
    await user.update({ isActive });

    res.json({ 
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Delete user account
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin accounts' });
    }

    // Check if user has submissions or certificates
    const submissionCount = await Submission.count({ where: { userId } });
    const certificateCount = await Certificate.count({ where: { userId } });

    if (submissionCount > 0 || certificateCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with existing submissions or certificates. Consider disabling the account instead.' 
      });
    }

    // Delete user
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by model hook
      role: role || 'student',
      isActive: true,
      currentPhase: 1,
      currentWeek: 1
    });

    res.status(201).json({ 
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Create a new week
const createWeek = async (req, res) => {
  try {
    const { weekNumber, title, description, maxPoints, videoPoints, assignmentPoints, phaseId } = req.body;

    // Validate required fields
    if (!weekNumber || !title || !phaseId) {
      return res.status(400).json({ message: 'Week number, title, and phase ID are required' });
    }

    // Check if phase exists
    const phase = await Phase.findByPk(phaseId);
    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    // Check if week number already exists in this phase
    const existingWeek = await Week.findOne({
      where: { weekNumber, phaseId }
    });

    if (existingWeek) {
      return res.status(400).json({ message: 'Week number already exists in this phase' });
    }

    // Create the week
    const week = await Week.create({
      weekNumber,
      title,
      description: description || '',
      maxPoints: maxPoints || 100,
      videoPoints: videoPoints || 40,
      assignmentPoints: assignmentPoints || 60,
      phaseId
    });

    res.status(201).json({
      message: 'Week created successfully',
      week
    });
  } catch (error) {
    console.error('Create week error:', error);
    res.status(500).json({ message: 'Failed to create week', error: error.message });
  }
};

// Update a week
const updateWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { weekNumber, title, description, maxPoints, videoPoints, assignmentPoints } = req.body;

    const week = await Week.findByPk(weekId);
    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }

    // If updating week number, check for conflicts
    if (weekNumber && weekNumber !== week.weekNumber) {
      const existingWeek = await Week.findOne({
        where: { 
          weekNumber, 
          phaseId: week.phaseId,
          id: { [Op.ne]: weekId }
        }
      });

      if (existingWeek) {
        return res.status(400).json({ message: 'Week number already exists in this phase' });
      }
    }

    // Update the week
    await week.update({
      weekNumber: weekNumber || week.weekNumber,
      title: title || week.title,
      description: description !== undefined ? description : week.description,
      maxPoints: maxPoints !== undefined ? maxPoints : week.maxPoints,
      videoPoints: videoPoints !== undefined ? videoPoints : week.videoPoints,
      assignmentPoints: assignmentPoints !== undefined ? assignmentPoints : week.assignmentPoints
    });

    res.json({
      message: 'Week updated successfully',
      week
    });
  } catch (error) {
    console.error('Update week error:', error);
    res.status(500).json({ message: 'Failed to update week', error: error.message });
  }
};

// Delete a week
const deleteWeek = async (req, res) => {
  try {
    const { weekId } = req.params;

    const week = await Week.findByPk(weekId, {
      include: [
        { model: Content, as: 'content' },
        { model: Submission, as: 'submissions' },
        { model: Progress, as: 'progress' }
      ]
    });

    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }

    // Check if there are any submissions or progress
    if (week.submissions && week.submissions.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete week with existing submissions. Please delete submissions first.' 
      });
    }

    if (week.progress && week.progress.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete week with student progress. Please reset progress first.' 
      });
    }

    // Delete associated content first
    if (week.content) {
      await Content.destroy({ where: { weekId } });
    }

    // Delete the week
    await week.destroy();

    res.json({
      message: 'Week deleted successfully'
    });
  } catch (error) {
    console.error('Delete week error:', error);
    res.status(500).json({ message: 'Failed to delete week', error: error.message });
  }
};

module.exports = {
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
};