import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Lock
} from 'lucide-react'
import { skillTracksData } from '../data/skillTracks'
import db from '../utils/database'
import { calendarCore } from '../utils/calendarSystem'

const SkillWarRoom = () => {
  // Core state - simplified
  const [activeTrack, setActiveTrack] = useState('linux')
  const [currentWeek, setCurrentWeek] = useState(1)
  const [todayTask, setTodayTask] = useState(null)
  const [taskCompleted, setTaskCompleted] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentTimer, setCurrentTimer] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [skillUnlockStatus, setSkillUnlockStatus] = useState({})
  
  // Advanced state (hidden by default)
  const [weekProgress, setWeekProgress] = useState({ completed: 0, total: 0 })
  const [allTasks, setAllTasks] = useState([])
  const [skillProgress, setSkillProgress] = useState({})

  useEffect(() => {
    loadSkillData()
    checkSkillUnlocks()
  }, [activeTrack, currentWeek])

  const checkSkillUnlocks = async () => {
    try {
      // Check if Linux Week 1 is completed
      const linuxProgress = await db.getSkillProgress('linux', 1)
      const linuxWeek1Tasks = skillTracksData.linux.weeks[0].dailyTasks
      const completedLinuxTasks = linuxProgress.filter(p => p.completed).length
      const linuxWeek1Complete = completedLinuxTasks >= linuxWeek1Tasks.length
      
      setSkillUnlockStatus({
        linux: true, // Always unlocked
        bash: linuxWeek1Complete,
        python: true, // Independent track
        aiSecurity: true // Independent track
      })
    } catch (error) {
      console.error('Failed to check skill unlocks:', error)
      // Default to all unlocked on error
      setSkillUnlockStatus({
        linux: true,
        bash: true,
        python: true,
        aiSecurity: true
      })
    }
  }

  const loadSkillData = async () => {
    try {
      // Get current track and week data
      const track = skillTracksData[activeTrack]
      const weekData = track?.weeks[currentWeek - 1]
      
      if (!weekData) return
      
      // Find today's task (simplified - just get first incomplete task)
      const progress = await db.getSkillProgress(activeTrack, currentWeek)
      const progressMap = {}
      progress.forEach(p => {
        progressMap[p.taskId] = p
      })
      
      setSkillProgress(progressMap)
      
      // Find today's task (next incomplete task)
      const nextTask = weekData.dailyTasks.find(task => 
        !progressMap[task.day]?.completed
      )
      
      setTodayTask(nextTask)
      setTaskCompleted(nextTask ? progressMap[nextTask.day]?.completed || false : false)
      
      // Get time spent on current task
      const today = calendarCore.getTodayString()
      const timeData = await db.getTimeTracking(today, activeTrack)
      const totalTime = timeData.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
      setTimeSpent(totalTime)
      
      // Load advanced data if needed
      if (showAdvanced) {
        await loadAdvancedData(weekData, progressMap)
      }
    } catch (error) {
      console.error('Failed to load skill data:', error)
    }
  }

  const loadAdvancedData = async (weekData, progressMap) => {
    try {
      // Calculate week progress
      const completed = weekData.dailyTasks.filter(task => 
        progressMap[task.day]?.completed
      ).length
      setWeekProgress({ completed, total: weekData.dailyTasks.length })
      
      // Load all tasks with status
      const tasksWithStatus = weekData.dailyTasks.map(task => ({
        ...task,
        completed: progressMap[task.day]?.completed || false,
        timeSpent: progressMap[task.day]?.timeSpent || 0
      }))
      setAllTasks(tasksWithStatus)
    } catch (error) {
      console.error('Failed to load advanced data:', error)
    }
  }

  const completeTask = async () => {
    if (!todayTask) return
    
    try {
      await db.updateSkillProgress(activeTrack, currentWeek, todayTask.day, true, timeSpent)
      
      // Log time if timer was used
      if (currentTimer > 0) {
        const today = calendarCore.getTodayString()
        await db.trackTime('skill-training', activeTrack, Math.floor(currentTimer / 60), today)
      }
      
      setTaskCompleted(true)
      setIsTimerRunning(false)
      setCurrentTimer(0)
      
      // Reload data to get next task and check unlocks
      await loadSkillData()
      await checkSkillUnlocks()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const toggleTaskCompletion = async (taskId) => {
    try {
      const task = allTasks.find(t => t.day === taskId)
      if (!task) return
      
      const newCompleted = !task.completed
      await db.updateSkillProgress(activeTrack, currentWeek, taskId, newCompleted, task.timeSpent)
      
      // Reload advanced data
      if (showAdvanced) {
        const track = skillTracksData[activeTrack]
        const weekData = track?.weeks[currentWeek - 1]
        const progress = await db.getSkillProgress(activeTrack, currentWeek)
        const progressMap = {}
        progress.forEach(p => {
          progressMap[p.taskId] = p
        })
        await loadAdvancedData(weekData, progressMap)
      }
      
      // Update today's task if it was the one toggled
      if (todayTask && todayTask.day === taskId) {
        setTaskCompleted(newCompleted)
      }
      
      // Check unlocks after task completion
      await checkSkillUnlocks()
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleTrackSelection = (trackId) => {
    // Check if track is unlocked
    if (!skillUnlockStatus[trackId]) {
      return // Do nothing if locked
    }
    setActiveTrack(trackId)
  }

  // Timer effect
  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTimer(timer => timer + 1)
      }, 1000)
    } else if (!isTimerRunning && currentTimer !== 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, currentTimer])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentTrack = skillTracksData[activeTrack]
  const currentWeekData = currentTrack?.weeks[currentWeek - 1]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between py-4 border-b border-gray-700"
      >
        <div className="text-gray-400 text-sm">
          Skill Training - Week {currentWeek}
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white">{currentTrack?.name}</span>
          </div>
          {timeSpent > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-white">{timeSpent}m today</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Conceptual Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-sm text-gray-500"
      >
        Linux = understanding the system • Bash = commanding the system
      </motion.div>

      {/* Track Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center gap-4"
      >
        {Object.entries(skillTracksData).map(([trackId, track]) => {
          const isLocked = !skillUnlockStatus[trackId]
          return (
            <button
              key={trackId}
              onClick={() => handleTrackSelection(trackId)}
              disabled={isLocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                activeTrack === trackId
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : isLocked
                  ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
              }`}
            >
              {isLocked && <Lock className="w-4 h-4" />}
              <span className="text-lg">{track.icon}</span>
              <span className="font-semibold">{track.name}</span>
            </button>
          )
        })}
      </motion.div>

      {/* Locked Track Message */}
      {!skillUnlockStatus[activeTrack] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gray-900 border border-gray-700 rounded-lg p-6"
        >
          <Lock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Track Locked</h3>
          <p className="text-gray-500">
            Complete Linux Fundamentals – Week 1 to unlock Bash
          </p>
        </motion.div>
      )}

      {/* Current Task Card */}
      {skillUnlockStatus[activeTrack] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {todayTask && !taskCompleted ? (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                {todayTask.task}
              </h1>
              <p className="text-gray-400 text-lg mb-2">
                {currentWeekData?.title} - Day {todayTask.day}
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Target: {todayTask.minTime} minutes
              </p>
              
              {/* Timer */}
              {isTimerRunning && (
                <div className="mb-6">
                  <div className="text-4xl font-mono text-blue-500 mb-2">
                    {formatTime(currentTimer)}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTimer}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isTimerRunning 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2 inline" />
                      PAUSE TIMER
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 inline" />
                      START TIMER
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={completeTask}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  COMPLETE TASK
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-green-500 rounded-lg p-8">
              <h1 className="text-3xl font-bold text-green-500 mb-4">
                🎯 Week {currentWeek} Complete!
              </h1>
              <p className="text-gray-400 text-lg mb-6">
                All tasks finished for {currentTrack?.name}
              </p>
              <button
                onClick={() => setCurrentWeek(currentWeek + 1)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                START WEEK {currentWeek + 1}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Progress Indicator */}
      {skillUnlockStatus[activeTrack] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Week Progress</h3>
              <p className="text-gray-400">{currentWeekData?.title}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {Math.round((weekProgress.completed / weekProgress.total) * 100)}%
              </div>
              <div className="text-sm text-gray-400">
                {weekProgress.completed}/{weekProgress.total} tasks
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Secondary Actions */}
      {skillUnlockStatus[activeTrack] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <button 
            onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
            disabled={currentWeek === 1}
            className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            <h4 className="font-semibold text-white mb-1">Previous Week</h4>
            <p className="text-gray-400 text-sm">Review completed tasks</p>
          </button>
          <button 
            onClick={() => setCurrentWeek(currentWeek + 1)}
            disabled={!currentTrack?.weeks[currentWeek]}
            className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            <h4 className="font-semibold text-white mb-1">Next Week</h4>
            <p className="text-gray-400 text-sm">Preview upcoming tasks</p>
          </button>
        </motion.div>
      )}

      {/* Advanced Toggle */}
      {skillUnlockStatus[activeTrack] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => {
              setShowAdvanced(!showAdvanced)
              if (!showAdvanced) {
                const track = skillTracksData[activeTrack]
                const weekData = track?.weeks[currentWeek - 1]
                if (weekData) {
                  loadAdvancedData(weekData, skillProgress)
                }
              }
            }}
            className="flex items-center gap-2 mx-auto text-gray-400 hover:text-white transition-colors"
          >
            <span>View All Tasks</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </motion.div>
      )}

      {/* Advanced Section - All Tasks */}
      {showAdvanced && skillUnlockStatus[activeTrack] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-white text-center">All Week {currentWeek} Tasks</h3>
          
          {allTasks.map((task, index) => (
            <motion.div
              key={task.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-900 border rounded-lg p-4 ${
                task.completed ? 'border-green-500 bg-green-500/5' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleTaskCompletion(task.day)}
                  >
                    {task.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
                    )}
                  </motion.button>
                  
                  <div>
                    <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      Day {task.day}: {task.task}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Target: {task.minTime}m • Difficulty: {task.difficulty}/5
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {task.timeSpent || 0}m
                  </div>
                  <div className="text-xs text-gray-400">
                    {task.completed ? 'COMPLETE' : 'PENDING'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default SkillWarRoom