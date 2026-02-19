const { sequelize, User, Phase, Week, Content, Progress } = require('../models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database (be careful in production!)
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Course Administrator',
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create phases
    const phases = await Phase.bulkCreate([
      {
        number: 1,
        title: 'Foundation',
        description: 'Learn Dart basics and Flutter fundamentals',
        startWeek: 1,
        endWeek: 8,
        color: '#10B981',
        requiredPointsPercentage: 80
      },
      {
        number: 2,
        title: 'Intermediate',
        description: 'Master state management, APIs, and databases',
        startWeek: 9,
        endWeek: 16,
        color: '#F59E0B',
        requiredPointsPercentage: 80
      },
      {
        number: 3,
        title: 'Advanced & Portfolio',
        description: 'Advanced topics, testing, deployment, and capstone projects',
        startWeek: 17,
        endWeek: 26,
        color: '#3B82F6',
        requiredPointsPercentage: 80
      }
    ]);
    console.log('✅ Phases created');

    // Week data with exact schedule from Jan 26 – Jul 26, 2026
    const weekData = [
      // Phase 1 - Foundation (Weeks 1-8)
      { phaseId: 1, weekNumber: 1, title: 'Flutter setup + Dart basics', description: 'Variables, control flow', startDate: '2026-01-26', endDate: '2026-02-01' },
      { phaseId: 1, weekNumber: 2, title: 'Dart functions, null safety + first Flutter widgets', description: 'Functions and basic widgets', startDate: '2026-02-02', endDate: '2026-02-08' },
      { phaseId: 1, weekNumber: 3, title: 'Layout widgets', description: 'Row, Column, Stack, ListView', startDate: '2026-02-09', endDate: '2026-02-15' },
      { phaseId: 1, weekNumber: 4, title: 'Forms & interactivity', description: 'TextField, Buttons, Checkbox, Themes', startDate: '2026-02-16', endDate: '2026-02-22' },
      { phaseId: 1, weekNumber: 5, title: 'Stateful widgets + simple state management', description: 'Navigation basics', startDate: '2026-02-23', endDate: '2026-03-01' },
      { phaseId: 1, weekNumber: 6, title: 'Packages & persistence', description: 'shared_preferences, intl, loading indicators', startDate: '2026-03-02', endDate: '2026-03-08' },
      { phaseId: 1, weekNumber: 7, title: 'Consolidation', description: 'Review & polish todo app, deploy to web', startDate: '2026-03-09', endDate: '2026-03-15' },
      { phaseId: 1, weekNumber: 8, title: 'Mini-project', description: 'Daily Journal app, edit/delete entries, sort by date', startDate: '2026-03-16', endDate: '2026-03-22' },

      // Phase 2 - Intermediate (Weeks 9-16)
      { phaseId: 2, weekNumber: 9, title: 'State Management intro', description: 'Riverpod, Provider, Notifier, ConsumerWidget', startDate: '2026-03-23', endDate: '2026-03-29' },
      { phaseId: 2, weekNumber: 10, title: 'Riverpod deep dive', description: 'flutter_bloc overview, undo/redo functionality', startDate: '2026-03-30', endDate: '2026-04-05' },
      { phaseId: 2, weekNumber: 11, title: 'Navigation', description: 'go_router, routes, path/query params, BottomNavigationBar, tabs', startDate: '2026-04-06', endDate: '2026-04-12' },
      { phaseId: 2, weekNumber: 12, title: 'APIs & Networking', description: 'http, dio, JSON parsing, FutureBuilder, fetch posts', startDate: '2026-04-13', endDate: '2026-04-19' },
      { phaseId: 2, weekNumber: 13, title: 'Advanced APIs', description: 'POST/PUT/DELETE, Auth, caching with hive/shared_preferences', startDate: '2026-04-20', endDate: '2026-04-26' },
      { phaseId: 2, weekNumber: 14, title: 'Local DB & Cloud', description: 'hive, drift/sqflite, Firebase setup, Auth, Firestore', startDate: '2026-04-27', endDate: '2026-05-03' },
      { phaseId: 2, weekNumber: 15, title: 'Cloud integration', description: 'StreamBuilder, Riverpod + Firebase, offline support', startDate: '2026-05-04', endDate: '2026-05-10' },
      { phaseId: 2, weekNumber: 16, title: 'Intermediate consolidation', description: 'Build News Reader app, polish categories/favorites', startDate: '2026-05-11', endDate: '2026-05-17' },

      // Phase 3 - Advanced & Portfolio (Weeks 17-26)
      { phaseId: 3, weekNumber: 17, title: 'Animations', description: 'AnimatedContainer, Hero, AnimationController, Lottie/Rive', startDate: '2026-05-18', endDate: '2026-05-24' },
      { phaseId: 3, weekNumber: 18, title: 'UI polish & responsive', description: 'MediaQuery, LayoutBuilder, flutter_screenutil, themes, fonts, intl, accessibility', startDate: '2026-05-25', endDate: '2026-05-31' },
      { phaseId: 3, weekNumber: 19, title: 'Testing', description: 'Unit, widget, integration tests, mocktail', startDate: '2026-06-01', endDate: '2026-06-07' },
      { phaseId: 3, weekNumber: 20, title: 'Performance & optimization', description: 'DevTools, const constructors, image caching, list optimization', startDate: '2026-06-08', endDate: '2026-06-14' },
      { phaseId: 3, weekNumber: 21, title: 'Deployment', description: 'Android/iOS/web builds, Firebase App Distribution, Play Store, Netlify', startDate: '2026-06-15', endDate: '2026-06-21' },
      { phaseId: 3, weekNumber: 22, title: 'Capstone Project 1 Start', description: 'E-commerce clone (Fake Store API + Riverpod + mock checkout)', startDate: '2026-06-22', endDate: '2026-06-28' },
      { phaseId: 3, weekNumber: 23, title: 'Capstone Project 1 Finish', description: 'Animations, tests, polish, deploy, GitHub portfolio', startDate: '2026-06-29', endDate: '2026-07-05' },
      { phaseId: 3, weekNumber: 24, title: 'Capstone Project 2', description: 'Chat/News/Social app skeleton (Firebase), notifications basics', startDate: '2026-07-06', endDate: '2026-07-12' },
      { phaseId: 3, weekNumber: 25, title: 'Capstone Project 3 + Portfolio', description: 'Your own idea (weather, fitness, expense tracker), polish & deploy 2–3 apps', startDate: '2026-07-13', endDate: '2026-07-19' },
      { phaseId: 3, weekNumber: 26, title: 'Final review & next steps', description: 'Fix bugs, update GitHub, explore advanced topics (plugins, desktop apps)', startDate: '2026-07-20', endDate: '2026-07-26' }
    ];

    // Create weeks
    const weeks = [];
    for (let i = 0; i < weekData.length; i++) {
      const weekInfo = weekData[i];
      const week = await Week.create({
        phaseId: weekInfo.phaseId,
        weekNumber: weekInfo.weekNumber,
        title: weekInfo.title,
        description: weekInfo.description,
        startDate: new Date(weekInfo.startDate),
        endDate: new Date(weekInfo.endDate),
        maxPoints: 100,
        videoPoints: 40,
        assignmentPoints: 60,
        order: weekInfo.weekNumber
      });
      weeks.push(week);
    }
    console.log('✅ Weeks created');

    // Create placeholder content for each week
    const contentData = weeks.map(week => ({
      weekId: week.id,
      instructions: `Welcome to Week ${week.weekNumber}: ${week.title}\n\n${week.description}\n\nThis week you will learn important concepts and complete practical exercises. Make sure to watch the video content and submit your assignment on time.`,
      videoUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, // Placeholder URL
      videoDuration: 1800, // 30 minutes
      notes: `Week ${week.weekNumber} study notes and additional resources will be provided here.`,
      assignmentDescription: `Complete the Week ${week.weekNumber} assignment focusing on: ${week.description}. Submit your code as a ZIP file or provide a GitHub repository link.`,
      assignmentDeadline: new Date(week.endDate.getTime() + 24 * 60 * 60 * 1000), // 1 day after week ends
      resources: [
        {
          title: 'Flutter Documentation',
          url: 'https://flutter.dev/docs',
          type: 'documentation'
        },
        {
          title: 'Dart Language Tour',
          url: 'https://dart.dev/guides/language/language-tour',
          type: 'tutorial'
        }
      ],
      isPublished: true
    }));

    await Content.bulkCreate(contentData);
    console.log('✅ Content created');

    // Create a sample student for testing
    const student = await User.create({
      email: 'student@example.com',
      password: 'student123',
      name: 'John Doe',
      role: 'student',
      currentPhase: 1,
      currentWeek: 1
    });

    // Unlock first week for the sample student
    await Progress.create({
      userId: student.id,
      weekId: weeks[0].id,
      isLocked: false,
      unlockedAt: new Date()
    });

    console.log('✅ Sample student created with first week unlocked');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Student: student@example.com / student123');
    console.log('\n📅 Course Schedule: Jan 26 – Jul 26, 2026 (26 weeks)');
    console.log('🏗️  3 Phases: Foundation (1-8), Intermediate (9-16), Advanced (17-26)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;