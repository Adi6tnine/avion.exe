// AI Decision Layer - Groq-powered intelligent decision making for AVION.EXE
import db from './database'
import { calendarCore } from './calendarSystem'

class AIDecisionLayer {
  constructor() {
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY
    // Use proxy endpoint to avoid CORS issues in production
    this.groqApiUrl = window.location.hostname === 'localhost' 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : '/api/groq-proxy'
    this.model = 'llama-3.1-8b-instant' // Fast Groq model (560 T/sec)
    this.fallbackModel = 'llama-3.3-70b-versatile' // Backup model if primary fails
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second
  }

  // Core Groq API interaction
  async makeGroqRequest(messages, temperature = 0.7, maxTokens = 1000, useBackupModel = false) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured. Set VITE_GROQ_API_KEY environment variable.')
    }

    const modelToUse = useBackupModel ? this.fallbackModel : this.model
    const isUsingProxy = this.groqApiUrl.startsWith('/api/')

    const requestBody = {
      model: modelToUse,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        }

        // Only add Authorization header for direct API calls, not proxy
        if (!isUsingProxy) {
          headers['Authorization'] = `Bearer ${this.groqApiKey}`
        }

        const response = await fetch(this.groqApiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error?.message || 'Unknown error'
          
          // If model is decommissioned and we haven't tried backup yet, try backup model
          if (errorMessage.includes('decommissioned') && !useBackupModel) {
            console.warn(`Model ${modelToUse} decommissioned, trying backup model ${this.fallbackModel}`)
            return this.makeGroqRequest(messages, temperature, maxTokens, true)
          }
          
          throw new Error(`Groq API error: ${response.status} - ${errorMessage}`)
        }

        const data = await response.json()
        return data.choices[0].message.content

      } catch (error) {
        console.error(`Groq API attempt ${attempt} failed:`, error)
        
        if (attempt === this.maxRetries) {
          // If we haven't tried the backup model yet, try it as a last resort
          if (!useBackupModel && !error.message.includes('decommissioned')) {
            console.warn('Trying backup model as last resort...')
            return this.makeGroqRequest(messages, temperature, maxTokens, true)
          }
          throw new Error(`Groq API failed after ${this.maxRetries} attempts: ${error.message}`)
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  // 1. Daily Primary Objective Selector
  async selectDailyObjective() {
    try {
      const startTime = Date.now()
      
      // Gather context
      const context = await this.gatherDailyContext()
      
      const prompt = `You are AVION.EXE, an AI execution engine for academic and skill mastery. Analyze today's context and select ONE primary objective.

CONTEXT:
- Date: ${context.date}
- Day Type: ${context.dayType}
- Current Streak: ${context.currentStreak} days
- Momentum Score: ${context.momentumScore}%
- Protocol Status: ${context.protocolCompleted}/${context.protocolTotal} blocks completed
- Next Deadline: ${context.nextDeadline?.title} in ${context.nextDeadline?.daysUntil} days (${context.nextDeadline?.type})
- Skill Progress: ${context.skillProgress}
- Academic Progress: ${context.academicProgress}%
- Recent Performance: ${context.recentPerformance}

RULES:
1. Select EXACTLY ONE primary objective for today
2. Consider streak risk, upcoming deadlines, and momentum
3. Balance academics and skills based on urgency
4. If streak < 3 days, prioritize streak recovery
5. If deadline ≤ 3 days, prioritize deadline preparation
6. Otherwise, focus on weakest placement-core area

OUTPUT FORMAT (JSON):
{
  "objective": "Complete Morning Protocol Block",
  "type": "protocol|academic|skill|deadline",
  "priority": "critical|high|medium",
  "reason": "Brief explanation why this is today's priority",
  "estimatedTime": "30-60 minutes",
  "successCriteria": "Specific completion criteria"
}

Respond with ONLY the JSON object, no additional text.`

      const messages = [
        {
          role: 'system',
          content: 'You are AVION.EXE AI Decision Engine. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      const response = await this.makeGroqRequest(messages, 0.3, 500)
      const decision = JSON.parse(response.trim())
      
      // Log the decision
      await db.logAIDecision(
        'daily_objective',
        context,
        decision,
        this.calculateConfidence(context, decision)
      )

      const executionTime = Date.now() - startTime
      console.log(`Daily objective selected in ${executionTime}ms:`, decision.objective)
      
      return decision

    } catch (error) {
      console.error('Failed to select daily objective:', error)
      
      // Fallback decision
      const fallbackDecision = {
        objective: 'Complete Morning Protocol Block',
        type: 'protocol',
        priority: 'high',
        reason: 'AI unavailable - defaulting to protocol consistency',
        estimatedTime: '30 minutes',
        successCriteria: 'Complete at least 2 critical blocks'
      }
      
      await db.logAIDecision('daily_objective', { error: error.message }, fallbackDecision, 0.1)
      return fallbackDecision
    }
  }

  // 2. Weekly Performance Analyzer
  async analyzeWeeklyPerformance() {
    try {
      const startTime = Date.now()
      
      // Gather weekly context
      const context = await this.gatherWeeklyContext()
      
      const prompt = `You are AVION.EXE performance analyzer. Analyze the last 7 days and provide strategic adjustments.

WEEKLY DATA:
- Execution Days: ${context.executionDays}/7
- Average Daily Score: ${context.avgDailyScore}%
- Streak Status: ${context.streakStatus}
- Protocol Completion: ${context.protocolCompletion}%
- Skill Progress: ${context.skillProgress}
- Academic Progress: ${context.academicProgress}
- Time Distribution: ${JSON.stringify(context.timeDistribution)}
- Missed Days: ${context.missedDays}
- Performance Trend: ${context.performanceTrend}

ANALYSIS REQUIRED:
1. Performance verdict (excellent/good/needs_improvement/critical)
2. Weakest area identification
3. Focus shift recommendation for next week
4. Specific adjustments needed

OUTPUT FORMAT (JSON):
{
  "verdict": "excellent|good|needs_improvement|critical",
  "weeklyScore": 85,
  "weakestArea": "skill_training|academic_study|protocol_consistency|time_management",
  "focusShift": "Specific recommendation for next week's focus",
  "adjustments": [
    "Specific adjustment 1",
    "Specific adjustment 2"
  ],
  "riskFactors": ["Risk factor 1", "Risk factor 2"],
  "strengths": ["Strength 1", "Strength 2"]
}

Respond with ONLY the JSON object.`

      const messages = [
        {
          role: 'system',
          content: 'You are AVION.EXE Performance Analyzer. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      const response = await this.makeGroqRequest(messages, 0.4, 800)
      const analysis = JSON.parse(response.trim())
      
      // Log the analysis
      await db.logAIDecision(
        'weekly_analysis',
        context,
        analysis,
        this.calculateConfidence(context, analysis)
      )

      const executionTime = Date.now() - startTime
      console.log(`Weekly analysis completed in ${executionTime}ms:`, analysis.verdict)
      
      return analysis

    } catch (error) {
      console.error('Failed to analyze weekly performance:', error)
      
      // Fallback analysis
      const fallbackAnalysis = {
        verdict: 'needs_improvement',
        weeklyScore: 50,
        weakestArea: 'protocol_consistency',
        focusShift: 'Focus on daily protocol completion',
        adjustments: ['Complete morning blocks daily', 'Track time more consistently'],
        riskFactors: ['Inconsistent execution'],
        strengths: ['System awareness']
      }
      
      await db.logAIDecision('weekly_analysis', { error: error.message }, fallbackAnalysis, 0.1)
      return fallbackAnalysis
    }
  }

  // 3. Adaptive Skill Syllabus Generator
  async generateSkillSyllabus(trackId, weekNumber) {
    try {
      const startTime = Date.now()
      
      // Gather skill context
      const context = await this.gatherSkillContext(trackId, weekNumber)
      
      const prompt = `You are AVION.EXE curriculum generator. Create next week's skill syllabus based on performance.

SKILL TRACK: ${context.trackName}
WEEK: ${weekNumber}
PERFORMANCE DATA:
- Previous Week Completion: ${context.previousCompletion}%
- Average Difficulty Handled: ${context.avgDifficulty}/5
- Time Efficiency: ${context.timeEfficiency}%
- Confidence Rating: ${context.avgConfidence}/5
- Struggle Areas: ${context.struggleAreas.join(', ')}
- Strengths: ${context.strengths.join(', ')}

ADAPTATION RULES:
1. If completion < 70%, reduce difficulty by 1 level
2. If completion > 90% and confidence > 4, increase difficulty by 1 level
3. If time efficiency < 60%, add more practice tasks
4. Focus on struggle areas while maintaining strengths
5. Include emergency mode fallback (50% time reduction)

OUTPUT FORMAT (JSON):
{
  "weekTitle": "Week ${weekNumber}: Adaptive ${context.trackName}",
  "difficultyLevel": 3,
  "focusAreas": ["Area 1", "Area 2"],
  "dailyTasks": [
    {
      "day": "Day 1",
      "task": "Specific task description",
      "difficulty": 3,
      "minTime": 45,
      "emergencyTime": 22,
      "skills": ["skill1", "skill2"]
    }
  ],
  "emergencyTask": "Simplified task for emergency mode",
  "adaptationReason": "Why this difficulty/focus was chosen"
}

Generate 7 daily tasks. Respond with ONLY the JSON object.`

      const messages = [
        {
          role: 'system',
          content: 'You are AVION.EXE Curriculum Generator. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      const response = await this.makeGroqRequest(messages, 0.5, 1200)
      const syllabus = JSON.parse(response.trim())
      
      // Log the generation
      await db.logAIDecision(
        'skill_syllabus',
        { trackId, weekNumber, ...context },
        syllabus,
        this.calculateConfidence(context, syllabus)
      )

      const executionTime = Date.now() - startTime
      console.log(`Skill syllabus generated in ${executionTime}ms for ${trackId} week ${weekNumber}`)
      
      return syllabus

    } catch (error) {
      console.error('Failed to generate skill syllabus:', error)
      
      // Fallback syllabus
      const fallbackSyllabus = {
        weekTitle: `Week ${weekNumber}: Basic Training`,
        difficultyLevel: 2,
        focusAreas: ['Fundamentals'],
        dailyTasks: Array.from({ length: 7 }, (_, i) => ({
          day: `Day ${i + 1}`,
          task: 'Basic practice exercises',
          difficulty: 2,
          minTime: 30,
          emergencyTime: 15,
          skills: ['basic']
        })),
        emergencyTask: 'Quick review session',
        adaptationReason: 'AI unavailable - using safe defaults'
      }
      
      await db.logAIDecision('skill_syllabus', { trackId, weekNumber, error: error.message }, fallbackSyllabus, 0.1)
      return fallbackSyllabus
    }
  }

  // 4. Recovery Mode Decision Engine
  async shouldEnterRecoveryMode() {
    try {
      const context = await this.gatherRecoveryContext()
      
      const prompt = `You are AVION.EXE recovery system. Decide if the user should enter recovery mode.

CURRENT STATE:
- Current Streak: ${context.currentStreak} days
- Days Since Last Activity: ${context.daysSinceActivity}
- Recent Completion Rate: ${context.recentCompletionRate}%
- Momentum Score: ${context.momentumScore}%
- Missed Critical Blocks: ${context.missedCriticalBlocks}
- System Stress Indicators: ${context.stressIndicators.join(', ')}
- Emergency Mode Usage: ${context.emergencyModeUsage}%
- Consecutive Missed Days: ${context.consecutiveMissedDays}

RECOVERY MODE TRIGGERS:
1. Streak broken (0 days) AND days since activity > 2
2. Completion rate < 30% for 3+ days
3. Momentum score < 20%
4. Multiple stress indicators present
5. Emergency mode overuse (>50% of days)

OUTPUT FORMAT (JSON):
{
  "enterRecoveryMode": true,
  "recoveryLevel": "light|deep|emergency",
  "reason": "Specific reason for decision",
  "recoveryDuration": "3-7 days",
  "simplifiedTasks": [
    "Simplified task 1",
    "Simplified task 2"
  ],
  "exitCriteria": "Criteria to exit recovery mode",
  "urgencyLevel": "low|medium|high"
}

Respond with ONLY the JSON object.`

      const messages = [
        {
          role: 'system',
          content: 'You are AVION.EXE Recovery System. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      const response = await this.makeGroqRequest(messages, 0.2, 600)
      const decision = JSON.parse(response.trim())
      
      await db.logAIDecision('recovery_mode', context, decision, this.calculateConfidence(context, decision))
      
      return decision

    } catch (error) {
      console.error('Failed to decide recovery mode:', error)
      return {
        enterRecoveryMode: false,
        recoveryLevel: 'light',
        reason: 'AI unavailable - maintaining current mode',
        recoveryDuration: 'N/A',
        simplifiedTasks: [
          'Complete one small study task',
          'Maintain basic routine'
        ],
        exitCriteria: 'Complete 2 consecutive days of basic tasks',
        urgencyLevel: 'low'
      }
    }
  }

  // 5. Placement Readiness Explainer
  async explainPlacementReadiness() {
    try {
      const context = await this.gatherPlacementContext()
      
      const prompt = `You are AVION.EXE placement advisor. Explain current placement readiness and provide concrete next actions.

PLACEMENT DATA:
- Overall Readiness: ${context.overallReadiness}%
- Academic Progress: ${context.academicBreakdown}
- Skill Progress: ${context.skillBreakdown}
- Recent Trend: ${context.recentTrend}
- Weak Areas: ${context.weakAreas.join(', ')}
- Strong Areas: ${context.strongAreas.join(', ')}
- Days to Placement Season: ${context.daysToPlacement}

ANALYSIS REQUIRED:
1. Why readiness went up/down recently
2. Two concrete next actions
3. Timeline for improvement
4. Risk assessment

OUTPUT FORMAT (JSON):
{
  "readinessExplanation": "Clear explanation of current readiness level",
  "trendAnalysis": "Why readiness changed recently",
  "nextActions": [
    "Concrete action 1 with timeline",
    "Concrete action 2 with timeline"
  ],
  "riskAssessment": "low|medium|high",
  "timeToImprove": "2-4 weeks",
  "focusPriority": "DAA|Java|Projects|Skills"
}

Respond with ONLY the JSON object.`

      const messages = [
        {
          role: 'system',
          content: 'You are AVION.EXE Placement Advisor. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]

      const response = await this.makeGroqRequest(messages, 0.3, 700)
      const explanation = JSON.parse(response.trim())
      
      await db.logAIDecision('placement_readiness', context, explanation, this.calculateConfidence(context, explanation))
      
      return explanation

    } catch (error) {
      console.error('Failed to explain placement readiness:', error)
      return {
        readinessExplanation: 'Continue consistent study across all subjects',
        trendAnalysis: 'Steady progress maintained',
        nextActions: [
          'Complete daily protocol blocks',
          'Focus on weakest subject area'
        ],
        riskAssessment: 'medium',
        timeToImprove: '4-6 weeks',
        focusPriority: 'DAA'
      }
    }
  }

  // Context gathering methods
  async gatherDailyContext() {
    const today = calendarCore.getTodayString()
    const systemState = await db.getSystemState()
    const todayExecution = await db.getDailyExecution(today)
    const todayRoutine = await db.getDailyRoutine(today)
    const upcomingEvents = await calendarCore.getUpcomingEvents(today, 14)
    
    // Find next critical deadline
    const criticalEvents = upcomingEvents.filter(e => 
      e.eventType === 'exam' || e.eventType === 'deadline' || e.type === 'exam' || e.type === 'dead'
    )
    const nextDeadline = criticalEvents.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
    
    return {
      date: today,
      dayType: await calendarCore.getDayType(),
      currentStreak: systemState.currentStreak || 0,
      momentumScore: systemState.momentumScore || 0,
      protocolCompleted: Object.values(todayRoutine?.blocks || {}).filter(b => b?.completed).length,
      protocolTotal: 4,
      nextDeadline: nextDeadline ? {
        title: nextDeadline.event || nextDeadline.title,
        daysUntil: Math.ceil((new Date(nextDeadline.date) - new Date()) / (1000 * 60 * 60 * 24)),
        type: nextDeadline.type || nextDeadline.eventType
      } : null,
      skillProgress: 'In progress', // Simplified for now
      academicProgress: 65, // Simplified for now
      recentPerformance: 'Steady' // Simplified for now
    }
  }

  async gatherWeeklyContext() {
    const executionHistory = await db.getExecutionHistory(7)
    const routineHistory = await db.getRoutineHistory(7)
    
    return {
      executionDays: executionHistory.length,
      avgDailyScore: executionHistory.reduce((sum, e) => sum + (e.executionScore || 0), 0) / Math.max(executionHistory.length, 1),
      streakStatus: executionHistory.length > 0 ? 'active' : 'broken',
      protocolCompletion: routineHistory.reduce((sum, r) => sum + (r.momentumScore || 0), 0) / Math.max(routineHistory.length, 1),
      skillProgress: 'Steady progress',
      academicProgress: 65,
      timeDistribution: { protocol: 40, skills: 35, academic: 25 },
      missedDays: 7 - executionHistory.length,
      performanceTrend: 'stable'
    }
  }

  async gatherSkillContext(trackId, weekNumber) {
    const skillProgress = await db.getEnhancedSkillProgress(trackId, weekNumber - 1)
    
    return {
      trackName: trackId.charAt(0).toUpperCase() + trackId.slice(1),
      previousCompletion: skillProgress.filter(s => s.completed).length / Math.max(skillProgress.length, 1) * 100,
      avgDifficulty: skillProgress.reduce((sum, s) => sum + (s.difficultyLevel || 2), 0) / Math.max(skillProgress.length, 1),
      timeEfficiency: 75, // Simplified
      avgConfidence: skillProgress.reduce((sum, s) => sum + (s.confidenceRating || 3), 0) / Math.max(skillProgress.length, 1),
      struggleAreas: ['Complex algorithms'],
      strengths: ['Basic syntax']
    }
  }

  async gatherRecoveryContext() {
    const systemState = await db.getSystemState()
    const recentExecution = await db.getExecutionHistory(7)
    const recentRoutines = await db.getRoutineHistory(7)
    
    // Calculate stress indicators
    const stressIndicators = []
    
    const consecutiveMissed = this.calculateConsecutiveMissedDays(recentExecution)
    if (consecutiveMissed >= 2) stressIndicators.push('consecutive_missed_days')
    
    const completionRate = recentExecution.reduce((sum, e) => sum + (e.executionScore || 0), 0) / Math.max(recentExecution.length, 1)
    if (completionRate < 30) stressIndicators.push('low_completion_rate')
    
    const emergencyUsage = recentRoutines.filter(r => r.emergencyMode).length / Math.max(recentRoutines.length, 1) * 100
    if (emergencyUsage > 30) stressIndicators.push('emergency_mode_overuse')
    
    if (systemState.momentumScore < 25) stressIndicators.push('low_momentum')
    
    return {
      currentStreak: systemState.currentStreak || 0,
      daysSinceActivity: consecutiveMissed,
      recentCompletionRate: Math.round(completionRate),
      momentumScore: systemState.momentumScore || 0,
      missedCriticalBlocks: this.calculateMissedCriticalBlocks(recentRoutines),
      stressIndicators,
      emergencyModeUsage: Math.round(emergencyUsage),
      consecutiveMissedDays: consecutiveMissed
    }
  }

  calculateConsecutiveMissedDays(executionHistory) {
    let consecutiveMissed = 0
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      const dayExecution = executionHistory.find(exec => exec.date === dateStr)
      if (!dayExecution || dayExecution.executionScore === 0) {
        consecutiveMissed++
      } else {
        break
      }
    }
    
    return consecutiveMissed
  }

  calculateMissedCriticalBlocks(routineHistory) {
    return routineHistory.reduce((count, routine) => {
      const blocks = routine.blocks || {}
      const criticalBlocks = ['morning', 'evening']
      const missedCritical = criticalBlocks.filter(blockId => !blocks[blockId]?.completed).length
      return count + missedCritical
    }, 0)
  }

  async gatherPlacementContext() {
    const systemState = await db.getSystemState()
    
    return {
      overallReadiness: 65,
      academicBreakdown: { DAA: 70, Java: 60, OS: 65 },
      skillBreakdown: { Bash: 50, Python: 70, Security: 40 },
      recentTrend: 'improving',
      weakAreas: ['AI Security', 'Advanced Algorithms'],
      strongAreas: ['Python', 'Basic Java'],
      daysToPlacement: 120
    }
  }

  // Utility methods
  calculateConfidence(context, decision) {
    // Simple confidence calculation based on data completeness
    let confidence = 0.5
    
    if (context.currentStreak !== undefined) confidence += 0.1
    if (context.momentumScore !== undefined) confidence += 0.1
    if (context.nextDeadline) confidence += 0.1
    if (decision.objective || decision.verdict || decision.enterRecoveryMode !== undefined) confidence += 0.2
    
    return Math.min(confidence, 1.0)
  }

  // Health check method
  async healthCheck() {
    try {
      const testMessages = [
        {
          role: 'system',
          content: 'You are a test system. Respond with exactly: {"status": "ok"}'
        },
        {
          role: 'user',
          content: 'Health check'
        }
      ]
      
      const response = await this.makeGroqRequest(testMessages, 0.1, 50)
      const result = JSON.parse(response.trim())
      
      return result.status === 'ok'
    } catch (error) {
      console.error('AI Decision Layer health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const aiDecisionLayer = new AIDecisionLayer()
export default aiDecisionLayer