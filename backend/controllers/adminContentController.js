const { Content, Week, QuizSubmission } = require('../models');

// Get content for a specific week (Admin)
const getWeekContent = async (req, res) => {
  try {
    const { weekId } = req.params;
    
    const content = await Content.findOne({
      where: { weekId },
      include: [{
        model: Week,
        as: 'week',
        attributes: ['id', 'weekNumber', 'title']
      }]
    });

    if (!content) {
      return res.status(404).json({ message: 'Content not found for this week' });
    }

    // Ensure resources is properly serialized as JSON
    if (content.resources && typeof content.resources === 'string') {
      content.resources = JSON.parse(content.resources);
    }

    res.json({ content });
  } catch (error) {
    console.error('Get week content error:', error);
    res.status(500).json({ message: 'Failed to get week content', error: error.message });
  }
};

// Create or update week content
const upsertWeekContent = async (req, res) => {
  try {
    console.log('Upsert week content request:', req.params.weekId);
    console.log('Request body keys:', Object.keys(req.body));
    
    const { weekId } = req.params;
    const {
      instructions,
      notes,
      video1Url,
      video1Title,
      video1Duration,
      video2Url,
      video2Title,
      video2Duration,
      multipleChoiceQuestions,
      assignmentDescription,
      assignmentDeadline,
      assignmentGradingCriteria,
      resources,
      isPublished
    } = req.body;

    // Validate required fields
    const week = await Week.findByPk(weekId);
    if (!week) {
      console.log('Week not found:', weekId);
      return res.status(404).json({ message: 'Week not found' });
    }

    console.log('Week found:', week.title);

    // Parse JSON fields - handle both string and array formats
    let parsedQuestions = [];
    let parsedResources = [];
    
    try {
      if (typeof multipleChoiceQuestions === 'string') {
        parsedQuestions = JSON.parse(multipleChoiceQuestions);
      } else if (Array.isArray(multipleChoiceQuestions)) {
        parsedQuestions = multipleChoiceQuestions;
      } else {
        parsedQuestions = [];
      }
    } catch (e) {
      console.error('Error parsing multipleChoiceQuestions:', e);
      parsedQuestions = [];
    }
    
    try {
      if (typeof resources === 'string') {
        parsedResources = JSON.parse(resources);
      } else if (Array.isArray(resources)) {
        parsedResources = resources;
      } else {
        parsedResources = [];
      }
    } catch (e) {
      console.error('Error parsing resources:', e);
      parsedResources = [];
    }

    const [content, created] = await Content.findOrCreate({
      where: { weekId },
      defaults: {
        weekId,
        instructions: instructions || '',
        notes: notes || '',
        video1Url: video1Url || '',
        video1Title: video1Title || '',
        video1Duration: video1Duration || 0,
        video2Url: video2Url || '',
        video2Title: video2Title || '',
        video2Duration: video2Duration || 0,
        multipleChoiceQuestions: parsedQuestions,
        assignmentDescription: assignmentDescription || '',
        assignmentDeadline: assignmentDeadline ? new Date(assignmentDeadline) : null,
        assignmentGradingCriteria: assignmentGradingCriteria || '',
        resources: parsedResources,
        isPublished: isPublished || false
      }
    });

    if (!created) {
      // Update existing content
      await content.update({
        instructions: instructions || content.instructions,
        notes: notes || content.notes,
        video1Url: video1Url || content.video1Url,
        video1Title: video1Title || content.video1Title,
        video1Duration: video1Duration || content.video1Duration,
        video2Url: video2Url || content.video2Url,
        video2Title: video2Title || content.video2Title,
        video2Duration: video2Duration || content.video2Duration,
        multipleChoiceQuestions: parsedQuestions,
        assignmentDescription: assignmentDescription || content.assignmentDescription,
        assignmentDeadline: assignmentDeadline ? new Date(assignmentDeadline) : content.assignmentDeadline,
        assignmentGradingCriteria: assignmentGradingCriteria || content.assignmentGradingCriteria,
        resources: parsedResources,
        isPublished: isPublished !== undefined ? isPublished : content.isPublished
      });
    }

    console.log('Content upsert successful, created:', created);
    
    res.status(created ? 201 : 200).json({
      message: created ? 'Content created successfully' : 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Upsert week content error:', error);
    res.status(500).json({ message: 'Failed to save week content', error: error.message });
  }
};

// Delete week content
const deleteWeekContent = async (req, res) => {
  try {
    const { weekId } = req.params;
    
    const deleted = await Content.destroy({
      where: { weekId }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete week content error:', error);
    res.status(500).json({ message: 'Failed to delete content', error: error.message });
  }
};

// Get quiz submissions for a week
const getQuizSubmissions = async (req, res) => {
  try {
    const { weekId } = req.params;
    
    const submissions = await QuizSubmission.findAll({
      where: { weekId },
      include: [{
        model: Week,
        as: 'week',
        attributes: ['weekNumber', 'title']
      }, {
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['submittedAt', 'DESC']]
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Get quiz submissions error:', error);
    res.status(500).json({ message: 'Failed to get quiz submissions', error: error.message });
  }
};

// Submit quiz (Student)
const submitQuiz = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Get content to check questions
    const content = await Content.findOne({
      where: { weekId }
    });

    if (!content) {
      return res.status(404).json({ message: 'Content not found for this week' });
    }

    if (!content.multipleChoiceQuestions || content.multipleChoiceQuestions.length === 0) {
      return res.status(400).json({ message: 'No quiz questions available for this week' });
    }

    // Calculate score
    let score = 0;
    const questions = content.multipleChoiceQuestions;
    
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });

    // Check if already submitted
    const existingSubmission = await QuizSubmission.findOne({
      where: { userId, weekId }
    });

    if (existingSubmission) {
      // Update existing submission
      await existingSubmission.update({
        answers,
        score,
        totalQuestions: questions.length,
        submittedAt: new Date()
      });
    } else {
      // Create new submission
      await QuizSubmission.create({
        userId,
        weekId,
        answers,
        score,
        totalQuestions: questions.length,
        submittedAt: new Date()
      });
    }

    res.json({
      message: 'Quiz submitted successfully',
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100)
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
};

// Get student quiz results
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
  getWeekContent,
  upsertWeekContent,
  deleteWeekContent,
  getQuizSubmissions,
  submitQuiz,
  getQuizResults
};
