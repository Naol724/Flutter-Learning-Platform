const { Week, Content, QuizSubmission, Progress } = require('../models');

// Submit quiz answers
const submitQuiz = async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.user.id;

    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('req.params:', req.params);
    console.log('Week ID from params:', weekId);
    console.log('Week ID type:', typeof weekId);
    console.log('User ID:', userId);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);

    // Parse answers from request body
    let answers;
    if (req.body && typeof req.body === 'object') {
      answers = req.body.answers || req.body;
    }

    console.log('Parsed answers:', answers);
    console.log('Answers type:', typeof answers);

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

    // Validate answers
    if (!answers) {
      console.log('ERROR: No answers provided!');
      return res.status(400).json({ message: 'No answers provided' });
    }

    if (typeof answers !== 'object') {
      console.log('ERROR: Invalid answers format!');
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Get week content with quiz questions
    const week = await Week.findByPk(weekId, {
      include: [{
        model: Content,
        as: 'content'
      }]
    });

    if (!week || !week.content) {
      return res.status(404).json({ message: 'Week or quiz not found' });
    }

    const questions = week.content.multipleChoiceQuestions || [];
    
    if (questions.length === 0) {
      return res.status(400).json({ message: 'No quiz questions available for this week' });
    }

    // Check if already submitted
    const existingSubmission = await QuizSubmission.findOne({
      where: { userId, weekId }
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    // Calculate score
    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score += question.points || 1;
      }
    });

    // Create submission record
    const submission = await QuizSubmission.create({
      userId,
      weekId,
      answers,
      score,
      totalQuestions,
      submittedAt: new Date()
    });

    // Update progress
    let progress = await Progress.findOne({
      where: { userId, weekId }
    });

    if (progress) {
      await progress.update({
        quizSubmitted: true,
        quizSubmittedAt: new Date(),
        quizScore: score,
        quizPoints: score,
        points: progress.points - (progress.quizPoints || 0) + score
      });
    } else {
      await Progress.create({
        userId,
        weekId,
        quizSubmitted: true,
        quizSubmittedAt: new Date(),
        quizScore: score,
        quizPoints: score,
        points: score,
        isLocked: false
      });
    }

    // Update user total points
    const totalPoints = await Progress.sum('points', {
      where: { userId }
    });
    await req.user.update({ totalPoints: totalPoints || 0 });

    res.status(201).json({
      message: 'Quiz submitted successfully',
      score,
      totalQuestions,
      submission
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
};

// Get quiz results
const getQuizResults = async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.user.id;

    const submission = await QuizSubmission.findOne({
      where: { userId, weekId },
      include: [{
        model: Week,
        as: 'week',
        attributes: ['weekNumber', 'title']
      }]
    });

    if (!submission) {
      return res.status(404).json({ message: 'Quiz submission not found' });
    }

    res.json({ submission });

  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ message: 'Failed to get quiz results', error: error.message });
  }
};

module.exports = {
  submitQuiz,
  getQuizResults
};
