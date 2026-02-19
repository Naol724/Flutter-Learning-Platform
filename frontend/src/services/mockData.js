// Mock data service for deployment without database
// This provides sample data for demonstration purposes

const mockData = {
  // Mock user data
  user: {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "student",
    avatar: null,
    createdAt: new Date().toISOString()
  },

  // Mock dashboard data
  dashboard: {
    user: {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      role: "student"
    },
    stats: {
      totalPoints: 1250,
      currentPhase: 2,
      currentWeek: 4,
      completedWeeks: 3,
      totalWeeks: 12,
      progress: 25
    },
    phases: [
      {
        id: 1,
        name: "Foundation",
        number: 1,
        description: "Learn the basics of Flutter",
        isCompleted: true,
        isLocked: false,
        weeks: [
          { id: 1, weekNumber: 1, title: "Introduction to Flutter", isCompleted: true },
          { id: 2, weekNumber: 2, title: "Widgets and Layouts", isCompleted: true },
          { id: 3, weekNumber: 3, title: "State Management", isCompleted: true },
          { id: 4, weekNumber: 4, title: "Navigation", isCompleted: false }
        ]
      },
      {
        id: 2,
        name: "Intermediate",
        number: 2,
        description: "Build intermediate Flutter apps",
        isCompleted: false,
        isLocked: false,
        weeks: [
          { id: 5, weekNumber: 5, title: "Advanced Widgets", isCompleted: false },
          { id: 6, weekNumber: 6, title: "Networking", isCompleted: false },
          { id: 7, weekNumber: 7, title: "Database Integration", isCompleted: false },
          { id: 8, weekNumber: 8, title: "Authentication", isCompleted: false }
        ]
      },
      {
        id: 3,
        name: "Advanced",
        number: 3,
        description: "Master advanced Flutter concepts",
        isCompleted: false,
        isLocked: true,
        weeks: [
          { id: 9, weekNumber: 9, title: "Performance Optimization", isCompleted: false },
          { id: 10, weekNumber: 10, title: "Testing", isCompleted: false },
          { id: 11, weekNumber: 11, title: "Deployment", isCompleted: false },
          { id: 12, weekNumber: 12, title: "Final Project", isCompleted: false }
        ]
      }
    ],
    recentSubmissions: [
      {
        id: 1,
        week: { id: 3, weekNumber: 3, title: "State Management" },
        description: "Implemented a simple state management solution",
        githubUrl: "https://github.com/example/state-management",
        status: "approved",
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        grade: "A"
      },
      {
        id: 2,
        week: { id: 2, weekNumber: 2, title: "Widgets and Layouts" },
        description: "Created a responsive layout with various widgets",
        githubUrl: "https://github.com/example/widgets-layout",
        status: "reviewed",
        submittedAt: new Date(Date.now() - 172800000).toISOString(),
        grade: "B+"
      },
      {
        id: 3,
        week: { id: 1, weekNumber: 1, title: "Introduction to Flutter" },
        description: "Built a simple hello world app",
        githubUrl: "https://github.com/example/hello-world",
        status: "approved",
        submittedAt: new Date(Date.now() - 259200000).toISOString(),
        grade: "A-"
      }
    ]
  },

  // Mock week details
  weekDetails: {
    1: {
      id: 1,
      weekNumber: 1,
      title: "Introduction to Flutter",
      description: "Learn the basics of Flutter development",
      phase: { id: 1, name: "Foundation", number: 1 },
      content: {
        instructions: "Welcome to Flutter! In this week, you'll learn the fundamentals of Flutter development including setup, basic widgets, and your first app.",
        notes: "Flutter is a UI toolkit for building beautiful applications for mobile, web, and desktop from a single codebase.",
        video1Url: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
        video1Title: "Flutter Setup and Installation",
        video1Duration: 720,
        video2Url: "https://www.youtube.com/watch?v=XK6q8dRLa_c",
        video2Title: "Your First Flutter App",
        video2Duration: 900,
        assignmentDescription: "Create a simple 'Hello World' Flutter app with proper project structure.",
        assignmentDeadline: new Date(Date.now() + 604800000).toISOString(),
        assignmentGradingCriteria: "Code quality, proper structure, and functionality",
        multipleChoiceQuestions: [
          {
            id: 1,
            question: "What is Flutter?",
            options: [
              "A programming language",
              "A UI toolkit for building apps",
              "A database system",
              "An operating system"
            ],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Which programming language does Flutter use?",
            options: [
              "Java",
              "Swift",
              "Dart",
              "Kotlin"
            ],
            correctAnswer: 2
          }
        ]
      },
      submissions: [
        {
          id: 1,
          description: "Built my first Flutter app",
          githubUrl: "https://github.com/example/hello-world",
          status: "approved",
          submittedAt: new Date(Date.now() - 259200000).toISOString(),
          grade: "A-"
        }
      ],
      progress: {
        videoProgress: 100,
        isCompleted: true,
        isLocked: false
      }
    },
    2: {
      id: 2,
      weekNumber: 2,
      title: "Widgets and Layouts",
      description: "Learn about Flutter widgets and layouts",
      phase: { id: 1, name: "Foundation", number: 1 },
      content: {
        instructions: "This week focuses on understanding Flutter widgets and creating responsive layouts.",
        notes: "Widgets are the building blocks of Flutter apps. Learn to use Container, Row, Column, and more.",
        video1Url: "https://www.youtube.com/watch?v=I1bq5V3G3lY",
        video1Title: "Understanding Widgets",
        video1Duration: 900,
        video2Url: "https://www.youtube.com/watch?v=vl_A1C9A4Mc",
        video2Title: "Layouts in Flutter",
        video2Duration: 1080,
        assignmentDescription: "Create a responsive profile screen using various Flutter widgets.",
        assignmentDeadline: new Date(Date.now() + 604800000).toISOString(),
        assignmentGradingCriteria: "Layout responsiveness, widget usage, and code organization",
        multipleChoiceQuestions: [
          {
            id: 1,
            question: "What is a Widget in Flutter?",
            options: [
              "A database connection",
              "A building block of the UI",
              "A programming function",
              "A styling property"
            ],
            correctAnswer: 1
          }
        ]
      },
      submissions: [],
      progress: {
        videoProgress: 75,
        isCompleted: false,
        isLocked: false
      }
    }
  }
};

// Local storage helpers
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting localStorage:', error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

// Mock API functions
export const mockAPI = {
  // Authentication
  login: async (credentials) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
      const user = mockData.user;
      storage.set('user', user);
      storage.set('token', 'mock-token-' + Date.now());
      return { success: true, user, token: 'mock-token-' + Date.now() };
    }
    
    return { success: false, message: 'Invalid credentials. Use demo@example.com / demo123' };
  },

  logout: async () => {
    storage.remove('user');
    storage.remove('token');
    return { success: true };
  },

  getCurrentUser: () => {
    return storage.get('user') || mockData.user;
  },

  // Dashboard
  getDashboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockData.dashboard;
  },

  // Week details
  getWeekDetails: async (weekId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const weekData = mockData.weekDetails[weekId];
    if (!weekData) {
      throw new Error('Week not found');
    }
    return { week: weekData };
  },

  // Submissions
  submitAssignment: async (weekId, data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submission = {
      id: Date.now(),
      week: { id: weekId, weekNumber: weekId, title: `Week ${weekId}` },
      description: data.description,
      githubUrl: data.githubUrl,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      grade: null
    };

    // Store submission in localStorage
    const submissions = storage.get('submissions') || [];
    submissions.push(submission);
    storage.set('submissions', submissions);

    return { success: true, submission };
  },

  getSubmissions: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return storage.get('submissions') || mockData.dashboard.recentSubmissions;
  },

  // Progress
  updateVideoProgress: async (weekId, progress) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const videoProgress = storage.get('videoProgress') || {};
    videoProgress[weekId] = progress;
    storage.set('videoProgress', videoProgress);

    return { success: true };
  },

  getProgressSummary: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const videoProgress = storage.get('videoProgress') || {};
    const submissions = storage.get('submissions') || [];
    
    return {
      totalWeeks: 12,
      completedWeeks: submissions.filter(s => s.status === 'approved').length,
      videoProgress: Object.keys(videoProgress).length,
      averageProgress: 65
    };
  },

  // Notes
  saveNotes: async (weekId, notes) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allNotes = storage.get('notes') || {};
    allNotes[weekId] = notes;
    storage.set('notes', allNotes);

    return { success: true };
  },

  getNotes: async (weekId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const allNotes = storage.get('notes') || {};
    return allNotes[weekId] || '';
  },

  // Dashboard notes
  saveStudentNotes: async (notes) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    storage.set('dashboardNotes', notes);
    return { success: true };
  },

  getStudentNotes: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return storage.get('dashboardNotes') || '';
  },

  // File upload (mock)
  uploadFile: async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const uploadedFile = {
      id: Date.now(),
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file)
    };

    const files = storage.get('uploadedFiles') || [];
    files.push(uploadedFile);
    storage.set('uploadedFiles', files);

    return { success: true, file: uploadedFile };
  },

  getUploadedFiles: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return storage.get('uploadedFiles') || [];
  }
};

export default mockAPI;
