// Skill War Room - Fixed 4-Week Initial Curriculum
export const skillTracksData = {
  linux: {
    id: 'linux',
    name: 'Linux Fundamentals',
    icon: '🐧',
    color: 'cyber-blue',
    weeks: [
      {
        weekNumber: 1,
        title: 'Linux Foundation',
        goal: 'Master essential Linux system concepts',
        dailyTasks: [
          { day: 'Monday', task: 'Filesystem structure & navigation (/, /home, /etc)', difficulty: 2, minTime: 20 },
          { day: 'Tuesday', task: 'Basic CLI commands (ls, cd, pwd, mkdir, rm)', difficulty: 2, minTime: 20 },
          { day: 'Wednesday', task: 'File permissions & ownership (chmod, chown)', difficulty: 3, minTime: 20 },
          { day: 'Thursday', task: 'Process management (ps, top, kill)', difficulty: 3, minTime: 20 },
          { day: 'Friday', task: 'Package management (apt/yum basics)', difficulty: 3, minTime: 20 },
          { day: 'Saturday', task: 'System information commands (uname, df, free)', difficulty: 2, minTime: 15 },
          { day: 'Sunday', task: 'Practice session: Navigate & manage files', difficulty: 3, minTime: 20 }
        ],
        emergencyTask: 'Practice 3 basic Linux commands (10 min)'
      }
    ]
  },
  bash: {
    id: 'bash',
    name: 'Bash / Shell Scripting',
    icon: '⚔️',
    color: 'cyber-green',
    weeks: [
      {
        weekNumber: 1,
        title: 'Bash Fundamentals',
        goal: 'Master basic shell operations and scripting syntax',
        dailyTasks: [
          { day: 'Monday', task: 'Shell navigation & file operations', difficulty: 2, minTime: 30 },
          { day: 'Tuesday', task: 'Variables, echo, and basic I/O', difficulty: 2, minTime: 30 },
          { day: 'Wednesday', task: 'Conditional statements (if/else)', difficulty: 3, minTime: 45 },
          { day: 'Thursday', task: 'Loops (for, while) and arrays', difficulty: 3, minTime: 45 },
          { day: 'Friday', task: 'Functions and script organization', difficulty: 4, minTime: 60 },
          { day: 'Saturday', task: 'File permissions & process management', difficulty: 3, minTime: 45 },
          { day: 'Sunday', task: 'Build a system info script (project)', difficulty: 4, minTime: 60 }
        ],
        emergencyTask: 'Practice 5 basic bash commands (15 min)'
      },
      {
        weekNumber: 2,
        title: 'Advanced Bash + Python Basics',
        goal: 'Advanced shell scripting + Python foundation',
        dailyTasks: [
          { day: 'Monday', task: 'Advanced bash: sed, awk, grep patterns', difficulty: 4, minTime: 45 },
          { day: 'Tuesday', task: 'Bash automation: cron jobs & scheduling', difficulty: 4, minTime: 45 },
          { day: 'Wednesday', task: 'Python setup & basic syntax', difficulty: 2, minTime: 30 },
          { day: 'Thursday', task: 'Python data types & control structures', difficulty: 3, minTime: 45 },
          { day: 'Friday', task: 'Python functions & modules', difficulty: 3, minTime: 45 },
          { day: 'Saturday', task: 'File handling in Python', difficulty: 3, minTime: 45 },
          { day: 'Sunday', task: 'Build log analyzer (bash + python)', difficulty: 5, minTime: 90 }
        ],
        emergencyTask: 'Write one Python function (15 min)'
      },
      {
        weekNumber: 3,
        title: 'Python Automation + System Interaction',
        goal: 'Automate system tasks with Python',
        dailyTasks: [
          { day: 'Monday', task: 'Python subprocess & os modules', difficulty: 4, minTime: 45 },
          { day: 'Tuesday', task: 'API requests with requests library', difficulty: 3, minTime: 45 },
          { day: 'Wednesday', task: 'JSON/CSV data processing', difficulty: 3, minTime: 45 },
          { day: 'Thursday', task: 'Email automation with smtplib', difficulty: 4, minTime: 60 },
          { day: 'Friday', task: 'Web scraping basics (BeautifulSoup)', difficulty: 4, minTime: 60 },
          { day: 'Saturday', task: 'Task scheduling with Python', difficulty: 4, minTime: 60 },
          { day: 'Sunday', task: 'Build system monitor dashboard', difficulty: 5, minTime: 120 }
        ],
        emergencyTask: 'Run one automation script (15 min)'
      },
      {
        weekNumber: 4,
        title: 'AI Security + Final Project',
        goal: 'Security fundamentals + capstone project',
        dailyTasks: [
          { day: 'Monday', task: 'Security basics: encryption, hashing', difficulty: 4, minTime: 60 },
          { day: 'Tuesday', task: 'Network security: nmap, wireshark basics', difficulty: 5, minTime: 60 },
          { day: 'Wednesday', task: 'AI security: prompt injection, model safety', difficulty: 4, minTime: 60 },
          { day: 'Thursday', task: 'Secure coding practices in Python', difficulty: 4, minTime: 60 },
          { day: 'Friday', task: 'Build security audit script', difficulty: 5, minTime: 90 },
          { day: 'Saturday', task: 'Final project: Automated security toolkit', difficulty: 5, minTime: 120 },
          { day: 'Sunday', task: 'Project presentation & documentation', difficulty: 4, minTime: 90 }
        ],
        emergencyTask: 'Review one security concept (20 min)'
      }
    ]
  },
  python: {
    id: 'python',
    name: 'Python Automation',
    icon: '🐍',
    color: 'cyber-purple',
    weeks: [
      // Python track runs parallel to bash, focusing on automation
      {
        weekNumber: 1,
        title: 'Python Environment Setup',
        goal: 'Establish robust Python development environment',
        dailyTasks: [
          { day: 'Monday', task: 'Python installation & virtual environments', difficulty: 2, minTime: 30 },
          { day: 'Tuesday', task: 'IDE setup (VS Code) & debugging', difficulty: 2, minTime: 30 },
          { day: 'Wednesday', task: 'Package management with pip', difficulty: 2, minTime: 30 },
          { day: 'Thursday', task: 'Git integration for Python projects', difficulty: 3, minTime: 45 },
          { day: 'Friday', task: 'Code formatting & linting setup', difficulty: 3, minTime: 45 },
          { day: 'Saturday', task: 'Testing framework introduction (pytest)', difficulty: 4, minTime: 60 },
          { day: 'Sunday', task: 'Build first automation utility', difficulty: 4, minTime: 60 }
        ],
        emergencyTask: 'Run python --version and pip list (10 min)'
      }
      // Additional weeks will be auto-generated by AI
    ]
  },
  aiSecurity: {
    id: 'aiSecurity',
    name: 'AI + Security',
    icon: '🛡️',
    color: 'cyber-red',
    weeks: [
      {
        weekNumber: 1,
        title: 'Security Fundamentals',
        goal: 'Build foundation in cybersecurity concepts',
        dailyTasks: [
          { day: 'Monday', task: 'CIA Triad & security principles', difficulty: 2, minTime: 30 },
          { day: 'Tuesday', task: 'Common vulnerabilities (OWASP Top 10)', difficulty: 3, minTime: 45 },
          { day: 'Wednesday', task: 'Cryptography basics: symmetric vs asymmetric', difficulty: 4, minTime: 60 },
          { day: 'Thursday', task: 'Network security fundamentals', difficulty: 4, minTime: 60 },
          { day: 'Friday', task: 'Authentication & authorization', difficulty: 3, minTime: 45 },
          { day: 'Saturday', task: 'Security tools overview', difficulty: 3, minTime: 45 },
          { day: 'Sunday', task: 'Hands-on: Set up security lab environment', difficulty: 5, minTime: 90 }
        ],
        emergencyTask: 'Read one security news article (15 min)'
      }
      // Additional weeks will be auto-generated
    ]
  }
}

// Daily Routine Block Structure
export const dailyRoutineBlocks = [
  {
    id: 'academics',
    name: '📘 4th Sem Study',
    description: 'Existing syllabus progress',
    minTime: 60,
    priority: 'critical',
    integrates: 'existing_syllabus_tracker'
  },
  {
    id: 'skillWarRoom',
    name: '⚙️ Skill War Room',
    description: 'Daily skill track task',
    minTime: 30,
    priority: 'critical',
    integrates: 'skill_tracks'
  },
  {
    id: 'revision',
    name: '🧠 Revision / Notes',
    description: 'Review and consolidate learning',
    minTime: 20,
    priority: 'important',
    integrates: 'notes_system'
  },
  {
    id: 'checklist',
    name: '✅ Daily Checklist',
    description: 'Existing daily tasks completion',
    minTime: 10,
    priority: 'important',
    integrates: 'existing_daily_checklist'
  }
]

// Consistency Rules
export const consistencyRules = {
  streakMaintenance: {
    criticalBlocks: ['academics', 'skillWarRoom'],
    minimumBlocks: 2, // At least 2 blocks must be completed
    emergencyModeThreshold: 3 // Days missed before emergency mode
  },
  momentumScoring: {
    weights: {
      today: 0.4,
      yesterday: 0.3,
      last3Days: 0.2,
      last7Days: 0.1
    }
  },
  recoveryMode: {
    triggerAfterMissedDays: 2,
    reducedTargets: true,
    focusOnCriticalOnly: true
  }
}