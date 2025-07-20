"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Calendar,
  User,
  Edit3,
  Trash2,
  Flag,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Check,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react"
import type { Task, SubTask, Person } from "@/lib/types"

interface GanttChartProps {
  project: { id: string; name: string; openDate?: Date }
  category: string
  tasks: Task[]
  people: Person[]
  onBack: () => void
  loading?: boolean
  onRefresh?: () => void
  onAddTask?: (taskData: {
    name: string
    startDate: Date
    endDate: Date
    assignedPersonId?: string
  }) => Promise<any>
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDeleteTask?: (taskId: string) => Promise<void>
  onAddSubTask?: (taskId: string, name: string) => Promise<any>
  onUpdateSubTask?: (subTaskId: string, updates: { name?: string; completed?: boolean }) => Promise<void>
  onDeleteSubTask?: (subTaskId: string) => Promise<void>
}

interface GanttItem {
  type: "task" | "subtask"
  task: Task
  subTask?: SubTask
  level: number
  isVisible: boolean
}

export function GanttChart({
  project,
  category,
  tasks,
  people,
  onBack,
  loading = false,
  onRefresh,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubTask,
  onUpdateSubTask,
  onDeleteSubTask,
}: GanttChartProps) {
  // State management
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [hiddenTasks, setHiddenTasks] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [isEditSubTaskOpen, setIsEditSubTaskOpen] = useState(false)
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false)
  const [isDeleteSubTaskOpen, setIsDeleteSubTaskOpen] = useState(false)
  const [isAddSubTaskOpen, setIsAddSubTaskOpen] = useState(false)
  const [newTaskForm, setNewTaskForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    assignedPersonId: "",
  })
  const [editTaskForm, setEditTaskForm] = useState({
    name: "",
    assignedPersonId: "",
  })
  const [editSubTaskForm, setEditSubTaskForm] = useState({
    name: "",
  })
  const [newSubTaskName, setNewSubTaskName] = useState("")

  // Initialize expanded tasks
  useEffect(() => {
    const allTaskIds = new Set(tasks.map((task) => task.id))
    setExpandedTasks(allTaskIds)
  }, [tasks])

  // Calculate date range for the chart
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date()
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from today
        totalDays: 30,
      }
    }

    let minDate = new Date(Math.min(...tasks.map((task) => task.startDate.getTime())))
    let maxDate = new Date(Math.max(...tasks.map((task) => task.endDate.getTime())))

    // Add some padding
    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week before
    maxDate = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week after

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000))

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays,
    }
  }, [tasks])

  // Generate calendar headers
  const calendarHeaders = useMemo(() => {
    const headers = []
    const currentDate = new Date(dateRange.startDate)

    for (let i = 0; i < dateRange.totalDays; i++) {
      headers.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        month: currentDate.getMonth() + 1,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isOpenDate: project.openDate && currentDate.toDateString() === project.openDate.toDateString(),
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return headers
  }, [dateRange, project.openDate])

  // Create gantt items (tasks and subtasks)
  const ganttItems = useMemo(() => {
    const items: GanttItem[] = []

    tasks.forEach((task) => {
      const isTaskHidden = hiddenTasks.has(task.id)
      const isTaskExpanded = expandedTasks.has(task.id)

      // Add main task
      items.push({
        type: "task",
        task,
        level: 0,
        isVisible: !isTaskHidden,
      })

      // Add subtasks if task is expanded and not hidden
      if (isTaskExpanded && !isTaskHidden && task.subTasks) {
        task.subTasks.forEach((subTask) => {
          items.push({
            type: "subtask",
            task,
            subTask,
            level: 1,
            isVisible: true,
          })
        })
      }
    })

    return items.filter((item) => item.isVisible)
  }, [tasks, expandedTasks, hiddenTasks])

  // Helper functions
  const calculateTaskPosition = (startDate: Date, endDate: Date) => {
    const startOffset = Math.max(
      0,
      Math.floor((startDate.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000)),
    )
    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))

    return {
      left: (startOffset / dateRange.totalDays) * 100,
      width: (duration / dateRange.totalDays) * 100,
    }
  }

  const getTaskNameStyle = (progress: number) => {
    if (progress === 100) {
      return "text-green-700 font-medium line-through"
    } else if (progress > 0) {
      return "text-blue-700 font-medium"
    }
    return "text-gray-700 font-medium"
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500"
    if (progress >= 75) return "bg-blue-500"
    if (progress >= 50) return "bg-yellow-500"
    if (progress >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  // Event handlers
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const toggleTaskVisibility = (taskId: string) => {
    setHiddenTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleAddTask = async () => {
    if (!onAddTask || !newTaskForm.name || !newTaskForm.startDate || !newTaskForm.endDate) return

    try {
      await onAddTask({
        name: newTaskForm.name,
        startDate: new Date(newTaskForm.startDate),
        endDate: new Date(newTaskForm.endDate),
        assignedPersonId: newTaskForm.assignedPersonId || undefined,
      })
      setNewTaskForm({ name: "", startDate: "", endDate: "", assignedPersonId: "" })
      setIsAddTaskOpen(false)
    } catch (error) {
      console.error("Failed to add task:", error)
    }
  }

  const handleEditTask = async () => {
    if (!onUpdateTask || !selectedTask) return

    try {
      const assignedPerson = editTaskForm.assignedPersonId
        ? people.find((p) => p.id === editTaskForm.assignedPersonId)
        : undefined

      await onUpdateTask(selectedTask.id, {
        name: editTaskForm.name,
        assignedPerson,
      })
      setIsEditTaskOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const handleDeleteTask = async () => {
    if (!onDeleteTask || !selectedTask) return

    try {
      await onDeleteTask(selectedTask.id)
      setIsDeleteTaskOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleAddSubTask = async () => {
    if (!onAddSubTask || !selectedTask || !newSubTaskName) return

    try {
      await onAddSubTask(selectedTask.id, newSubTaskName)
      setNewSubTaskName("")
      setIsAddSubTaskOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error("Failed to add subtask:", error)
    }
  }

  const handleEditSubTask = async () => {
    if (!onUpdateSubTask || !selectedSubTask) return

    try {
      await onUpdateSubTask(selectedSubTask.id, {
        name: editSubTaskForm.name,
      })
      setIsEditSubTaskOpen(false)
      setSelectedSubTask(null)
    } catch (error) {
      console.error("Failed to update subtask:", error)
    }
  }

  const handleDeleteSubTask = async () => {
    if (!onDeleteSubTask || !selectedSubTask) return

    try {
      await onDeleteSubTask(selectedSubTask.id)
      setIsDeleteSubTaskOpen(false)
      setSelectedSubTask(null)
    } catch (error) {
      console.error("Failed to delete subtask:", error)
    }
  }

  const handleSubTaskToggle = async (subTask: SubTask) => {
    if (!onUpdateSubTask) return

    try {
      await onUpdateSubTask(subTask.id, {
        completed: !subTask.completed,
      })
    } catch (error) {
      console.error("Failed to toggle subtask:", error)
    }
  }

  const openEditTask = (task: Task) => {
    setSelectedTask(task)
    setEditTaskForm({
      name: task.name,
      assignedPersonId: task.assignedPerson?.id || "",
    })
    setIsEditTaskOpen(true)
  }

  const openEditSubTask = (subTask: SubTask) => {
    setSelectedSubTask(subTask)
    setEditSubTaskForm({
      name: subTask.name,
    })
    setIsEditSubTaskOpen(true)
  }

  const openDeleteTask = (task: Task) => {
    setSelectedTask(task)
    setIsDeleteTaskOpen(true)
  }

  const openDeleteSubTask = (subTask: SubTask) => {
    setSelectedSubTask(subTask)
    setIsDeleteSubTaskOpen(true)
  }

  const openAddSubTask = (task: Task) => {
    setSelectedTask(task)
    setIsAddSubTaskOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">ガントチャートを読み込み中...</h2>
            <p className="text-gray-500">しばらくお待ちください</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-blue-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="px-4 py-2 bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-xl transition-all duration-300"
              >
                ← 戻る
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {project.name} - {category}
                </h1>
                {project.openDate && (
                  <div className="flex items-center gap-2 mt-1">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      OPEN予定: {project.openDate.getFullYear()}年{project.openDate.getMonth() + 1}月
                      {project.openDate.getDate()}日
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  className="px-3 py-2 bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-xl transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  更新
                </Button>
              )}

              {onAddTask && (
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300">
                      <Plus className="h-4 w-4 mr-2" />
                      タスク追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-gray-900">新しいタスクを追加</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="taskName">タスク名 *</Label>
                        <Input
                          id="taskName"
                          value={newTaskForm.name}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, name: e.target.value })}
                          placeholder="タスク名を入力"
                          className="h-10"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">開始日 *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newTaskForm.startDate}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, startDate: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">終了日 *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newTaskForm.endDate}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, endDate: e.target.value })}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignedPerson">担当者</Label>
                        <select
                          id="assignedPerson"
                          value={newTaskForm.assignedPersonId}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedPersonId: e.target.value })}
                          className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">担当者を選択</option>
                          {people.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.firstName} {person.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsAddTaskOpen(false)} className="px-4 py-2">
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddTask}
                          disabled={!newTaskForm.name || !newTaskForm.startDate || !newTaskForm.endDate}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          追加
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 p-6">
        <Card className="bg-white/80 backdrop-blur-md border-blue-200/50 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                ガントチャート - {tasks.length}個のタスク
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BarChart3 className="h-4 w-4" />
                <span>期間: {dateRange.totalDays}日間</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">タスクがありません</h3>
                <p className="text-gray-500 mb-6">{category}カテゴリーにはまだタスクが登録されていません。</p>
                {onAddTask && (
                  <Button
                    onClick={() => setIsAddTaskOpen(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    最初のタスクを追加
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  {/* Calendar Header */}
                  <div className="flex border-b border-gray-200">
                    <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
                      <h3 className="font-medium text-gray-700">タスク名</h3>
                    </div>
                    <div className="flex-1 bg-gray-50">
                      <div className="flex">
                        {calendarHeaders.map((header, index) => (
                          <div
                            key={index}
                            className={`flex-1 min-w-[30px] p-2 text-center text-xs border-r border-gray-200 ${
                              header.isWeekend ? "bg-gray-100" : ""
                            } ${header.isToday ? "bg-blue-100 text-blue-700 font-medium" : ""} ${
                              header.isOpenDate ? "bg-red-100 text-red-700 font-bold" : ""
                            }`}
                          >
                            <div className="font-medium">{header.day}</div>
                            <div className="text-gray-500">{header.month}</div>
                            {header.isOpenDate && <div className="text-red-600 text-xs font-bold mt-1">OPEN</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gantt Rows */}
                  <div className="divide-y divide-gray-200">
                    {ganttItems.map((item, index) => (
                      <div key={`${item.task.id}-${item.subTask?.id || "main"}`} className="flex">
                        {/* Task Name Column */}
                        <div className="w-80 border-r border-gray-200 p-4 bg-white">
                          {item.type === "task" ? (
                            <div className="flex items-center gap-2">
                              {/* Expand/Collapse Button */}
                              {item.task.subTasks && item.task.subTasks.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleTaskExpansion(item.task.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  {expandedTasks.has(item.task.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              )}

                              {/* Task Name with Hover */}
                              <div className="relative group flex-1 min-w-0">
                                <h3
                                  className={`${getTaskNameStyle(item.task.progress)} cursor-default`}
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {item.task.name}
                                </h3>

                                {/* ホバー時のフルネーム表示 - メインタスク用 */}
                                {item.task.name.length > 25 && (
                                  <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap max-w-xs">
                                    {item.task.name}
                                  </div>
                                )}
                              </div>

                              {/* Task Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Hide/Show Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleTaskVisibility(item.task.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  {hiddenTasks.has(item.task.id) ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>

                                {/* Add SubTask Button */}
                                {onAddSubTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openAddSubTask(item.task)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                )}

                                {/* Edit Button */}
                                {onUpdateTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditTask(item.task)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                )}

                                {/* Delete Button */}
                                {onDeleteTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteTask(item.task)}
                                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              {/* Assigned Person */}
                              {item.task.assignedPerson && (
                                <div className="flex items-center gap-1 ml-2">
                                  <div
                                    className={`w-4 h-4 rounded-full ${item.task.assignedPerson.bgColor} flex items-center justify-center`}
                                  >
                                    <User className="h-2 w-2 text-white" />
                                  </div>
                                  <span className="text-xs text-gray-600">{item.task.assignedPerson.firstName}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 ml-6 group">
                              {/* SubTask Checkbox */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => item.subTask && handleSubTaskToggle(item.subTask)}
                                className="p-1 h-5 w-5"
                              >
                                {item.subTask?.completed ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <div className="h-3 w-3 border border-gray-400 rounded-sm"></div>
                                )}
                              </Button>

                              {/* SubTask Name with Hover */}
                              <div className="relative group flex-1 min-w-0">
                                <h3
                                  className={`text-sm ${
                                    item.subTask?.completed ? "text-green-600 line-through" : "text-gray-600"
                                  } cursor-default`}
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  └ {item.subTask?.name}
                                </h3>

                                {/* ホバー時のフルネーム表示 - サブタスク用 */}
                                {item.subTask && item.subTask.name.length > 20 && (
                                  <div className="absolute left-0 top-full mt-1 bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap max-w-xs">
                                    └ {item.subTask.name}
                                  </div>
                                )}
                              </div>

                              {/* SubTask Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Edit SubTask Button */}
                                {onUpdateSubTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => item.subTask && openEditSubTask(item.subTask)}
                                    className="p-1 h-5 w-5"
                                  >
                                    <Edit3 className="h-2 w-2" />
                                  </Button>
                                )}

                                {/* Delete SubTask Button */}
                                {onDeleteSubTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => item.subTask && openDeleteSubTask(item.subTask)}
                                    className="p-1 h-5 w-5 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-2 w-2" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Gantt Chart Column */}
                        <div className="flex-1 relative h-12 bg-white">
                          {item.type === "task" ? (
                            <div className="relative h-full">
                              {/* Task Bar */}
                              <div
                                className={`absolute top-2 h-8 ${getProgressColor(
                                  item.task.progress,
                                )} rounded-md shadow-sm flex items-center justify-center text-white text-xs font-medium`}
                                style={calculateTaskPosition(item.task.startDate, item.task.endDate)}
                              >
                                {item.task.progress > 0 && `${item.task.progress}%`}
                              </div>
                            </div>
                          ) : (
                            <div className="relative h-full">
                              {/* SubTask Bar */}
                              <div
                                className={`absolute top-3 h-6 ${
                                  item.subTask?.completed ? "bg-green-400" : "bg-gray-300"
                                } rounded-sm shadow-sm`}
                                style={calculateTaskPosition(item.task.startDate, item.task.endDate)}
                              ></div>
                            </div>
                          )}

                          {/* Today Line */}
                          {(() => {
                            const today = new Date()
                            const todayOffset = Math.floor(
                              (today.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000),
                            )
                            if (todayOffset >= 0 && todayOffset <= dateRange.totalDays) {
                              return (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                  style={{ left: `${(todayOffset / dateRange.totalDays) * 100}%` }}
                                ></div>
                              )
                            }
                            return null
                          })()}

                          {/* OPEN Date Line */}
                          {project.openDate &&
                            (() => {
                              const openOffset = Math.floor(
                                (project.openDate.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000),
                              )
                              if (openOffset >= 0 && openOffset <= dateRange.totalDays) {
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                                    style={{ left: `${(openOffset / dateRange.totalDays) * 100}%` }}
                                  ></div>
                                )
                              }
                              return null
                            })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">タスクを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTaskName">タスク名 *</Label>
              <Input
                id="editTaskName"
                value={editTaskForm.name}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                placeholder="タスク名を入力"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAssignedPerson">担当者</Label>
              <select
                id="editAssignedPerson"
                value={editTaskForm.assignedPersonId}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, assignedPersonId: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">担当者を選択</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstName} {person.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditTaskOpen(false)} className="px-4 py-2">
                キャンセル
              </Button>
              <Button
                onClick={handleEditTask}
                disabled={!editTaskForm.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">タスクを削除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">「{selectedTask?.name}」を削除しますか？この操作は取り消せません。</p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteTaskOpen(false)} className="px-4 py-2">
                キャンセル
              </Button>
              <Button onClick={handleDeleteTask} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white">
                削除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add SubTask Dialog */}
      <Dialog open={isAddSubTaskOpen} onOpenChange={setIsAddSubTaskOpen}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">サブタスクを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subTaskName">サブタスク名 *</Label>
              <Input
                id="subTaskName"
                value={newSubTaskName}
                onChange={(e) => setNewSubTaskName(e.target.value)}
                placeholder="サブタスク名を入力"
                className="h-10"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddSubTaskOpen(false)} className="px-4 py-2">
                キャンセル
              </Button>
              <Button
                onClick={handleAddSubTask}
                disabled={!newSubTaskName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                追加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit SubTask Dialog */}
      <Dialog open={isEditSubTaskOpen} onOpenChange={setIsEditSubTaskOpen}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">サブタスクを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editSubTaskName">サブタスク名 *</Label>
              <Input
                id="editSubTaskName"
                value={editSubTaskForm.name}
                onChange={(e) => setEditSubTaskForm({ ...editSubTaskForm, name: e.target.value })}
                placeholder="サブタスク名を入力"
                className="h-10"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditSubTaskOpen(false)} className="px-4 py-2">
                キャンセル
              </Button>
              <Button
                onClick={handleEditSubTask}
                disabled={!editSubTaskForm.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete SubTask Dialog */}
      <Dialog open={isDeleteSubTaskOpen} onOpenChange={setIsDeleteSubTaskOpen}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">サブタスクを削除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">「{selectedSubTask?.name}」を削除しますか？この操作は取り消せません。</p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteSubTaskOpen(false)} className="px-4 py-2">
                キャンセル
              </Button>
              <Button onClick={handleDeleteSubTask} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white">
                削除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
