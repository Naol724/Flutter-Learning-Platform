const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { User, Phase, Week, Progress } = require('../models');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Check and unlock next week/phase based on progress
const checkAndUnlockProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current progress
    const user = await User.findByPk(userId);
    const currentWeek = await Week.findOne({
      where: { weekNumber: user.currentWeek },
      include: [{ model: Phase, as: 'phase' }]
    });

    if (!currentWeek) {
      return res.status(404).json({ message: 'Current week not found' });
    }

    // Check if current week is completed
    const currentProgress = await Progress.findOne({
      where: { userId, weekId: currentWeek.id }
    });

    if (!currentProgress || !currentProgress.completed) {
      return res.json({ message: 'Current week not completed yet' });
    }

    // Check if we need to unlock next week
    const nextWeekNumber = user.currentWeek + 1;
    const nextWeek = await Week.findOne({
      where: { weekNumber: nextWeekNumber },
      include: [{ model: Phase, as: 'phase' }]
    });

    if (nextWeek) {
      // Check if it's in the same phase or if phase requirements are met
      if (nextWeek.phaseId === currentWeek.phaseId) {
        // Same phase - unlock next week
        await unlockWeek(userId, nextWeek.id);
        await user.update({ currentWeek: nextWeekNumber });
      } else {
        // Different phase - check phase completion requirements
        const phaseWeeks = await Week.findAll({
          where: { phaseId: currentWeek.phaseId }
        });

        const completedPhaseWeeks = await Progress.count({
          where: {
            userId,
            weekId: { [require('sequelize').Op.in]: phaseWeeks.map(w => w.id) },
            completed: true
          }
        });

        const totalPossiblePoints = phaseWeeks.reduce((sum, week) => sum + week.maxPoints, 0);
        const earnedPoints = await Progress.sum('points', {
          where: {
            userId,
            weekId: { [require('sequelize').Op.in]: phaseWeeks.map(w => w.id) }
          }
        });

        const progressPercentage = totalPossiblePoints > 0 
          ? (earnedPoints / totalPossiblePoints) * 100 
          : 0;

        if (completedPhaseWeeks === phaseWeeks.length && 
            progressPercentage >= currentWeek.phase.requiredPointsPercentage) {
          // Phase requirements met - needs admin approval
          return res.json({ 
            message: 'Phase completed! Waiting for admin approval to unlock next phase.',
            needsApproval: true,
            phaseId: currentWeek.phaseId,
            progressPercentage: Math.round(progressPercentage)
          });
        }
      }
    }

    res.json({ message: 'Progress checked and updated' });
  } catch (error) {
    console.error('Check progress error:', error);
    res.status(500).json({ message: 'Failed to check progress', error: error.message });
  }
};

// Helper function to unlock a week
const unlockWeek = async (userId, weekId) => {
  const [progress] = await Progress.findOrCreate({
    where: { userId, weekId },
    defaults: {
      isLocked: false,
      unlockedAt: new Date()
    }
  });

  if (progress.isLocked) {
    await progress.update({
      isLocked: false,
      unlockedAt: new Date()
    });
  }

  return progress;
};

// Get detailed progress for a specific phase
const getPhaseProgress = async (req, res) => {
  try {
    const { phaseId } = req.params;
    const userId = req.user.id;

    const phase = await Phase.findByPk(phaseId, {
      include: [{
        model: Week,
        as: 'weeks',
        include: [{
          model: Progress,
          as: 'progress',
          where: { userId },
          required: false
        }],
        order: [['weekNumber', 'ASC']]
      }]
    });

    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    // Calculate phase statistics
    const totalWeeks = phase.weeks.length;
    const completedWeeks = phase.weeks.filter(week => 
      week.progress?.[0]?.completed
    ).length;

    const totalPossiblePoints = phase.weeks.reduce((sum, week) => sum + week.maxPoints, 0);
    const earnedPoints = phase.weeks.reduce((sum, week) => 
      sum + (week.progress?.[0]?.points || 0), 0
    );

    const progressPercentage = totalPossiblePoints > 0 
      ? Math.round((earnedPoints / totalPossiblePoints) * 100) 
      : 0;

    res.json({
      phase,
      stats: {
        totalWeeks,
        completedWeeks,
        totalPossiblePoints,
        earnedPoints,
        progressPercentage,
        isCompleted: completedWeeks === totalWeeks && progressPercentage >= phase.requiredPointsPercentage
      }
    });
  } catch (error) {
    console.error('Get phase progress error:', error);
    res.status(500).json({ message: 'Failed to get phase progress', error: error.message });
  }
};

// Routes
router.post('/check-unlock', checkAndUnlockProgress);
router.get('/phase/:phaseId', getPhaseProgress);

module.exports = router;