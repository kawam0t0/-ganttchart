"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Flag,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  User,
  Check,
  X,
  MoreVertical,
  CalendarDays,
  BarChart3,
  UserPlus,
  Users,
  EyeOff,
  Eye,
  Settings,
} from "lucide-react"
import type { Person, Task } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Header Component for Gantt Chart
function GanttHeader() {
  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-md border-b border-blue-500/50 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Spchart</h1>
              <p className="text-sm text-blue-100">洗車場プロジェクト管理</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// Footer Component for Gantt Chart
function GanttFooter() {}

interface GanttChartProps {
  project: { id: string; name: string; openDate?: Date }
  category: string
  tasks: Task[]
  people: Person[]
  onBack: () => void
  loading?: boolean
  onRefresh?: () => void
  // Supabase操作用の関数
  onAddTask?: (taskData: { name: string; startDate: Date; endDate: Date; assignedPersonId?: string }) => Promise<any>
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDeleteTask?: (taskId: string) => Promise<void>
  onAddSubTask?: (taskId: string, name: string) => Promise<any>
  onUpdateSubTask?: (subTaskId: string, updates: { name?: string; completed?: boolean }) => Promise<void>
  onDeleteSubTask?: (subTaskId: string) => Promise<void>
}

export function GanttChart({
  project,
  category,
  tasks: initialTasks,
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [hiddenTasks, setHiddenTasks] = useState<Task[]>([]) // 非表示タスクの管理
  const [isAddingMainTask, setIsAddingMainTask] = useState(false)
  const [isHiddenTasksDialogOpen, setIsHiddenTasksDialogOpen] = useState(false)
  const [newMainTask, setNewMainTask] = useState({
    name: "",
    startDate: "",
    endDate: "",
    assignedPersonId: "",
  })

  // 担当者割り当て用の状態
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  // initialTasksが変更されたときにローカルのtasks状態を更新
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [editingSubTask, setEditingSubTask] = useState<{ taskId: string; subTaskId: string } | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [newSubTaskName, setNewSubTaskName] = useState("")
  const [editSubTaskName, setEditSubTaskName] = useState("")
  const [showContextMenu, setShowContextMenu] = useState<{
    x: number
    y: number
    taskId: string
    subTaskId?: string
  } | null>(null)

  const monthHeaderScrollRef = useRef<HTMLDivElement>(null)
  const dateHeaderScrollRef = useRef<HTMLDivElement>(null)
  const contentScrollRef = useRef<HTMLDivElement>(null)
  const taskNameScrollRef = useRef<HTMLDivElement>(null) // タスク名エリアのスクロール参照を追加

  // スクロール位置を保存するための参照
  const scrollPositionRef = useRef({
    horizontal: 0,
    vertical: 0,
  })

  // OPEN日から4ヶ月前を開始日として設定
  const openDate = project.openDate || new Date(2024, 3, 1)
  const startDate = new Date(openDate)
  startDate.setMonth(startDate.getMonth() - 4)
  startDate.setDate(1)

  const endDate = new Date(openDate)
  endDate.setDate(endDate.getDate() + 30)

  const dateRange: Date[] = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d))
  }

  // スクロール位置を保存する関数
  const saveScrollPosition = () => {
    if (contentScrollRef.current && taskNameScrollRef.current) {
      scrollPositionRef.current = {
        horizontal: contentScrollRef.current.scrollLeft,
        vertical: taskNameScrollRef.current.scrollTop,
      }
    }
  }

  // スクロール位置を復元する関数
  const restoreScrollPosition = () => {
    requestAnimationFrame(() => {
      if (contentScrollRef.current && taskNameScrollRef.current) {
        contentScrollRef.current.scrollLeft = scrollPositionRef.current.horizontal
        taskNameScrollRef.current.scrollTop = scrollPositionRef.current.vertical

        // 他のスクロール要素も同期
        syncScrolls(scrollPositionRef.current.horizontal)
      }
    })
  }

  // タスクバーのクリックハンドラー
  const handleTaskBarClick = (taskId: string) => {
    saveScrollPosition() // スクロール位置を保存

    const newExpandedTasks = new Set(expandedTasks)
    if (expandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId)
    } else {
      newExpandedTasks.add(taskId)
    }
    setExpandedTasks(newExpandedTasks)

    // 状態更新後にスクロール位置を復元
    setTimeout(() => {
      restoreScrollPosition()
    }, 50)
  }

  // 担当者を割り当てる関数
  const assignPersonToTask = async (taskId: string, personId: string) => {
    try {
      saveScrollPosition() // スクロール位置を保存

      const selectedPerson = people.find((p) => p.id === personId)

      // スプレッドシートタスクの場合は、まずSupabaseに保存してから更新
      if (taskId.startsWith("sheet-")) {
        const originalTask = tasks.find((t) => t.id === taskId)
        if (originalTask && onAddTask) {
          // 進捗率を計算
          const completedCount = originalTask.subTasks?.filter((st) => st.completed).length || 0
          const progress = originalTask.subTasks?.length
            ? Math.round((completedCount / originalTask.subTasks.length) * 100)
            : 0

          // スプレッドシートタスクをSupabaseタスクとして新規作成
          const newTask = await onAddTask({
            name: originalTask.name,
            startDate: originalTask.startDate,
            endDate: originalTask.endDate,
            assignedPersonId: personId,
          })

          // サブタスクを移行
          if (newTask && originalTask.subTasks && onAddSubTask) {
            for (const subTask of originalTask.subTasks) {
              const createdSubTask = await onAddSubTask(newTask.id, subTask.name)
              if (createdSubTask && subTask.completed && onUpdateSubTask) {
                await onUpdateSubTask(createdSubTask.id, { completed: true })
              }
            }
          }

          // 進捗率を更新
          if (newTask && onUpdateTask) {
            await onUpdateTask(newTask.id, { progress })
          }
        }
      } else if (onUpdateTask && selectedPerson) {
        await onUpdateTask(taskId, { assignedPerson: selectedPerson })
      }

      setIsAssignDialogOpen(false)
      setAssigningTaskId(null)

      // 更新後にスクロール位置を復元
      setTimeout(() => {
        restoreScrollPosition()
      }, 100)
    } catch (error) {
      console.error("Failed to assign person to task:", error)
    }
  }

  // 担当者を削除する関数
  const removePersonFromTask = async (taskId: string) => {
    try {
      if (onUpdateTask) {
        await onUpdateTask(taskId, { assignedPerson: undefined })
      }
    } catch (error) {
      console.error("Failed to remove person from task:", error)
    }
  }

  // 担当者割り当てダイアログを開く
  const openAssignDialog = (taskId: string) => {
    setAssigningTaskId(taskId)
    setIsAssignDialogOpen(true)
  }

  // メインタスクの追加
  const addMainTask = async () => {
    if (!newMainTask.name.trim() || !newMainTask.startDate || !newMainTask.endDate || !onAddTask) return

    try {
      saveScrollPosition() // スクロール位置を保存

      await onAddTask({
        name: newMainTask.name.trim(),
        startDate: new Date(newMainTask.startDate),
        endDate: new Date(newMainTask.endDate),
        assignedPersonId: newMainTask.assignedPersonId || undefined,
      })

      setNewMainTask({
        name: "",
        startDate: "",
        endDate: "",
        assignedPersonId: "",
      })
      setIsAddingMainTask(false)

      // 更新後にスクロール位置を復元
      setTimeout(() => {
        restoreScrollPosition()
      }, 100)
    } catch (error) {
      console.error("Failed to add main task:", error)
    }
  }

  // メインタスクの削除
  const deleteMainTask = async (taskId: string) => {
    try {
      if (onDeleteTask) {
        await onDeleteTask(taskId)
      }

      // 展開状態もクリア
      const newExpandedTasks = new Set(expandedTasks)
      newExpandedTasks.delete(taskId)
      setExpandedTasks(newExpandedTasks)
    } catch (error) {
      console.error("Failed to delete main task:", error)
    }
  }

  // サブタスクの完了状態切り替え
  const toggleSubTaskCompletion = async (taskId: string, subTaskId: string) => {
    try {
      saveScrollPosition() // スクロール位置を保存

      // スプレッドシートタスクの場合は、まずSupabaseに保存してからサブタスクを更新
      if (taskId.startsWith("sheet-")) {
        const originalTask = tasks.find((t) => t.id === taskId)
        if (originalTask && onAddTask) {
          // サブタスクの状態を更新
          const updatedSubTasks =
            originalTask.subTasks?.map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st)) || []

          // 進捗率を計算
          const completedCount = updatedSubTasks.filter((st) => st.completed).length
          const progress = updatedSubTasks.length > 0 ? Math.round((completedCount / updatedSubTasks.length) * 100) : 0

          // 新しいSupabaseタスクを作成
          const newTask = await onAddTask({
            name: originalTask.name,
            startDate: originalTask.startDate,
            endDate: originalTask.endDate,
            assignedPersonId: originalTask.assignedPerson?.id,
          })

          // 新しく作成されたタスクにサブタスクを追加
          if (newTask && onAddSubTask) {
            for (const subTask of updatedSubTasks) {
              const createdSubTask = await onAddSubTask(newTask.id, subTask.name)
              if (createdSubTask && subTask.completed && onUpdateSubTask) {
                await onUpdateSubTask(createdSubTask.id, { completed: true })
              }
            }
          }

          // 進捗率を更新
          if (newTask && onUpdateTask) {
            await onUpdateTask(newTask.id, { progress })
          }
        }
      } else {
        // 通常のSupabaseタスクの場合
        const task = tasks.find((t) => t.id === taskId)
        const subTask = task?.subTasks?.find((st) => st.id === subTaskId)

        if (subTask && onUpdateSubTask) {
          await onUpdateSubTask(subTaskId, { completed: !subTask.completed })

          // 進捗率を再計算して更新
          if (task && onUpdateTask) {
            const updatedSubTasks =
              task.subTasks?.map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st)) || []

            const completedCount = updatedSubTasks.filter((st) => st.completed).length
            const progress =
              updatedSubTasks.length > 0 ? Math.round((completedCount / updatedSubTasks.length) * 100) : 0

            await onUpdateTask(taskId, { progress })
          }
        }
      }

      // 更新後にスクロール位置を復元
      setTimeout(() => {
        restoreScrollPosition()
      }, 150)
    } catch (error) {
      console.error("Failed to toggle subtask completion:", error)
    }
  }

  // サブタスクの追加
  const addSubTask = async (taskId: string) => {
    if (!newSubTaskName.trim() || !onAddSubTask) return

    try {
      saveScrollPosition() // スクロール位置を保存

      await onAddSubTask(taskId, newSubTaskName.trim())
      setNewSubTaskName("")

      // 更新後にスクロール位置を復元
      setTimeout(() => {
        restoreScrollPosition()
      }, 100)
    } catch (error) {
      console.error("Failed to add subtask:", error)
    }
  }

  // サブタスクの削除
  const deleteSubTask = async (taskId: string, subTaskId: string) => {
    try {
      saveScrollPosition() // スクロール位置を保存

      if (onDeleteSubTask) {
        await onDeleteSubTask(subTaskId)
      }

      // 更新後にスクロール位置を復元
      setTimeout(() => {
        restoreScrollPosition()
      }, 100)
    } catch (error) {
      console.error("Failed to delete subtask:", error)
    }
  }

  // サブタスクの名前編集
  const updateSubTaskName = async (taskId: string, subTaskId: string, newName: string) => {
    if (!newName.trim() || !onUpdateSubTask) return

    try {
      saveScrollPosition() // スクロール位置を保存

      await onUpdateSubTask(subTaskId, { name: newName.trim() })
      setEditingSubTask(null)
      setEditSubTaskName("")

      // 更新後にスクロール位置を復元
      setTimeout(() => {
        restoreScrollPosition()
      }, 100)
    } catch (error) {
      console.error("Failed to update subtask name:", error)
    }
  }

  // 右クリックメニューの処理
  const handleContextMenu = (e: React.MouseEvent, taskId: string, subTaskId?: string) => {
    e.preventDefault()
    setShowContextMenu({
      x: e.clientX,
      y: e.clientY,
      taskId,
      subTaskId,
    })
  }

  // 編集モードの開始
  const startEditingSubTask = (taskId: string, subTaskId: string, currentName: string) => {
    setEditingSubTask({ taskId, subTaskId })
    setEditSubTaskName(currentName)
    setShowContextMenu(null)
  }

  // 月ヘッダーを生成する関数
  const generateMonthHeaders = () => {
    const monthHeaders: { month: string; span: number; startIndex: number }[] = []
    let currentMonth = ""
    let currentSpan = 0
    let startIndex = 0

    dateRange.forEach((date, index) => {
      const monthKey = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月`

      if (currentMonth !== monthKey) {
        if (currentMonth !== "") {
          monthHeaders.push({ month: currentMonth, span: currentSpan, startIndex })
        }
        currentMonth = monthKey
        currentSpan = 1
        startIndex = index
      } else {
        currentSpan++
      }
    })

    if (currentMonth !== "") {
      monthHeaders.push({ month: currentMonth, span: currentSpan, startIndex })
    }

    return monthHeaders
  }

  const monthHeaders = generateMonthHeaders()

  // スクロール同期関数
  const syncScrolls = (sourceScrollLeft: number) => {
    requestAnimationFrame(() => {
      if (monthHeaderScrollRef.current && monthHeaderScrollRef.current.scrollLeft !== sourceScrollLeft) {
        monthHeaderScrollRef.current.scrollLeft = sourceScrollLeft
      }
      if (dateHeaderScrollRef.current && dateHeaderScrollRef.current.scrollLeft !== sourceScrollLeft) {
        dateHeaderScrollRef.current.scrollLeft = sourceScrollLeft
      }
      if (contentScrollRef.current && contentScrollRef.current.scrollLeft !== sourceScrollLeft) {
        contentScrollRef.current.scrollLeft = sourceScrollLeft
      }
    })
  }

  const handleMonthHeaderScroll = () => {
    if (monthHeaderScrollRef.current) {
      syncScrolls(monthHeaderScrollRef.current.scrollLeft)
    }
  }

  const handleDateHeaderScroll = () => {
    if (dateHeaderScrollRef.current) {
      syncScrolls(dateHeaderScrollRef.current.scrollLeft)
    }
  }

  const handleContentScroll = () => {
    if (contentScrollRef.current) {
      syncScrolls(contentScrollRef.current.scrollLeft)
    }
  }

  // 六曜を計算する関数
  const getRokuyo = (date: Date): string => {
    const rokuyoList = ["大安", "赤口", "先勝", "友引", "先負", "仏滅"]
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const totalDays = Math.floor((year - 1900) * 365.25) + Math.floor((month - 1) * 30.44) + day
    return rokuyoList[totalDays % 6]
  }

  const getTaskPosition = (task: Task) => {
    const totalDays = dateRange.length
    const taskStartIndex = dateRange.findIndex((date) => date.toDateString() === task.startDate.toDateString())
    const taskEndIndex = dateRange.findIndex((date) => date.toDateString() === task.endDate.toDateString())

    if (taskStartIndex === -1 || taskEndIndex === -1) {
      return { left: "0%", width: "0%" }
    }

    const left = (taskStartIndex / totalDays) * 100
    const width = ((taskEndIndex - taskStartIndex + 1) / totalDays) * 100

    return {
      left: `${left}%`,
      width: `${width}%`,
    }
  }

  // サブタスク用のバー位置計算（完了状態に基づく）
  const getSubTaskPosition = (parentTask: Task, subTaskIndex: number, isCompleted: boolean) => {
    const parentPosition = getTaskPosition(parentTask)
    const parentLeft = Number.parseFloat(parentPosition.left.replace("%", ""))
    const parentWidth = Number.parseFloat(parentPosition.width.replace("%", ""))

    // サブタスクは親タスクの期間内で均等に配置
    const subTaskWidth = parentWidth * 0.8 // 親タスクの80%の幅
    const subTaskLeft = parentLeft + parentWidth * 0.1 // 親タスクの10%オフセット

    return {
      left: `${subTaskLeft}%`,
      width: `${subTaskWidth}%`,
    }
  }

  // 進捗率に基づいてバーの色とグラデーションを決定
  const getProgressBarStyle = (progress: number) => {
    let darkColor = ""
    let lightColor = ""

    if (progress === 100) {
      // 100%: ティール
      darkColor = "#14b8a6" // teal-500
      lightColor = "#5eead4" // teal-300
    } else if (progress >= 80) {
      // 80%以上: 青
      darkColor = "#3b82f6" // blue-500
      lightColor = "#93c5fd" // blue-300
    } else if (progress >= 50) {
      // 50%以上: 黄色
      darkColor = "#eab308" // yellow-500
      lightColor = "#fde047" // yellow-300
    } else if (progress >= 20) {
      // 20%以上: オレンジ
      darkColor = "#f97316" // orange-500
      lightColor = "#fdba74" // orange-300
    } else {
      // 20%未満: 赤
      darkColor = "#ef4444" // red-500
      lightColor = "#fca5a5" // red-300
    }

    // 進捗率に基づいてグラデーションを作成
    const progressPercent = Math.max(0, Math.min(100, progress))

    return {
      background: `linear-gradient(to right, ${darkColor} 0%, ${darkColor} ${progressPercent}%, ${lightColor} ${progressPercent}%, ${lightColor} 100%)`,
      transition: "all 0.3s ease",
    }
  }

  // サブタスク用のスタイル（完了/未完了）
  const getSubTaskStyle = (isCompleted: boolean) => {
    if (isCompleted) {
      return {
        background: "#10b981", // green-500
        transition: "all 0.3s ease",
      }
    } else {
      return {
        background: "#e5e7eb", // gray-200
        transition: "all 0.3s ease",
      }
    }
  }

  // タスク名のスタイルを進捗率に応じて決定
  const getTaskNameStyle = (progress: number) => {
    if (progress === 100) {
      return "font-semibold text-teal-600 text-xs truncate" // 100%完了時はティール色
    }
    return "font-semibold text-gray-800 text-xs truncate" // 通常時はグレー
  }

  const getDayOfWeek = (date: Date) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"]
    return days[date.getDay()]
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const isOpenDate = (date: Date) => {
    return date.toDateString() === openDate.toDateString()
  }

  const dateColumnWidth = 40
  const totalTimelineWidth = dateRange.length * dateColumnWidth
  const taskNameColumnWidth = 320 // 統一された幅を定義

  // 表示用のタスクリストを生成（サブタスクを含む）
  const getDisplayTasks = () => {
    const displayTasks: Array<{
      type: "main" | "sub" | "add-sub"
      task: Task
      subTask?: any
      subTaskIndex?: number
    }> = []

    // タスクを追加
    tasks.forEach((task) => {
      displayTasks.push({ type: "main", task })

      if (expandedTasks.has(task.id)) {
        if (task.subTasks) {
          task.subTasks.forEach((subTask, index) => {
            displayTasks.push({
              type: "sub",
              task,
              subTask,
              subTaskIndex: index,
            })
          })
        }
        displayTasks.push({ type: "add-sub", task })
      }
    })

    return displayTasks
  }

  const displayTasks = getDisplayTasks()

  // メインタスクの非表示（削除の代わり）
  const hideMainTask = async (taskId: string) => {
    try {
      const taskToHide = tasks.find((task) => task.id === taskId)
      if (!taskToHide) return

      // 非表示タスクリストに追加
      setHiddenTasks((prev) => [...prev, taskToHide])

      // 表示中のタスクから削除
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))

      // 展開状態もクリア
      const newExpandedTasks = new Set(expandedTasks)
      newExpandedTasks.delete(taskId)
      setExpandedTasks(newExpandedTasks)

      console.log(`Task ${taskId} hidden locally`)
    } catch (error) {
      console.error("Failed to hide main task:", error)
    }
  }

  // タスクを再表示する関数
  const showTask = (taskId: string) => {
    try {
      const taskToShow = hiddenTasks.find((task) => task.id === taskId)
      if (!taskToShow) return

      // 表示中のタスクに追加
      setTasks((prevTasks) => [...prevTasks, taskToShow])

      // 非表示タスクリストから削除
      setHiddenTasks((prev) => prev.filter((task) => task.id !== taskId))

      console.log(`Task ${taskId} restored`)
    } catch (error) {
      console.error("Failed to show task:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <GanttHeader />

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="w-full flex items-center justify-between p-6 bg-white/70 backdrop-blur-md border-b border-blue-200/50 flex-shrink-0">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-6 py-3 bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            ← 戻る
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <p className="text-lg text-gray-600 mt-1">{category}</p>
            {project.openDate && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Flag className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-600 bg-yellow-50/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  洗車場OPEN予定: {project.openDate.getFullYear()}年{project.openDate.getMonth() + 1}月
                  {project.openDate.getDate()}日
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 非表示タスク管理ボタンを追加 */}
            {hiddenTasks.length > 0 && (
              <Dialog open={isHiddenTasksDialogOpen} onOpenChange={setIsHiddenTasksDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/70 backdrop-blur-md border-orange-300/50 text-orange-600 hover:bg-orange-50/50 rounded-xl"
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    非表示 ({hiddenTasks.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                  <DialogHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Settings className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">非表示タスク管理</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">非表示にしたタスクを再表示できます</p>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {hiddenTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50/70 backdrop-blur-sm border border-gray-200/50 rounded-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate">{task.name}</h3>
                            {task.assignedPerson && (
                              <p className="text-xs text-gray-500">
                                担当: {task.assignedPerson.firstName} {task.assignedPerson.lastName}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => showTask(task.id)}
                            className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            再表示
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-white/70 backdrop-blur-md border-green-300/50 text-green-600 hover:bg-green-50/50 rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Chart Header */}
        <div className="w-full flex items-center gap-4 p-6 bg-white/50 backdrop-blur-md border-b border-blue-200/50">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-800">ガントチャート</h2>

          {/* メインタスク追加ボタンをヘッダーに配置 */}
          <Dialog open={isAddingMainTask} onOpenChange={setIsAddingMainTask}>
            <DialogTrigger asChild>
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200 flex items-center gap-1 bg-blue-50/50 px-3 py-1 rounded-xl">
                <Plus className="h-4 w-4" />
                メインタスクを追加
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-md border-0 shadow-2xl">
              <DialogHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CalendarDays className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-gray-900">新しいメインタスクを追加</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">タスクの詳細情報を入力してください</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    タスク名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="例: 要件定義、設計書作成など..."
                    value={newMainTask.name}
                    onChange={(e) => setNewMainTask((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      開始日 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={newMainTask.startDate}
                      onChange={(e) => setNewMainTask((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      終了日 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={newMainTask.endDate}
                      onChange={(e) => setNewMainTask((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                {people.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">担当者</label>
                    <select
                      value={newMainTask.assignedPersonId}
                      onChange={(e) => setNewMainTask((prev) => ({ ...prev, assignedPersonId: e.target.value }))}
                      className="w-full h-12 p-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">担当者を選択してください...</option>
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.firstName} {person.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CalendarDays className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">タスク追加について</p>
                      <p className="mt-1">
                        追加されたタスクはリアルタイムで他のユーザーにも共有されます。サブタスクの追加や編集も可能です。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingMainTask(false)
                      setNewMainTask({ name: "", startDate: "", endDate: "", assignedPersonId: "" })
                    }}
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={addMainTask}
                    disabled={!newMainTask.name.trim() || !newMainTask.startDate || !newMainTask.endDate}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    タスクを追加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>データを読み込み中...</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Flag className="h-3 w-3 text-yellow-500" />
              <span>OPEN日</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-teal-600">完了タスク</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">未割り当てタスク</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>バーをクリックで展開・右クリックで編集</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">データを読み込んでいます...</p>
            </div>
          </div>
        )}

        {/* No Tasks State */}
        {!loading && tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">このカテゴリーにはタスクがありません</p>
              <p className="text-sm text-gray-500">「メインタスクを追加」ボタンからタスクを作成してください</p>
              {hiddenTasks.length > 0 && (
                <p className="text-sm text-orange-600 mt-2">{hiddenTasks.length}個の非表示タスクがあります</p>
              )}
            </div>
          </div>
        )}

        {/* Gantt Chart - Fixed Layout */}
        {!loading && tasks.length > 0 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Month Header Row */}
            <div className="flex border-b border-gray-300 flex-shrink-0">
              {/* Fixed Task Name Header */}
              <div
                className="bg-white/70 backdrop-blur-md border-r border-gray-300 p-2 font-semibold text-gray-700 flex items-center text-sm flex-shrink-0"
                style={{ width: `${taskNameColumnWidth}px` }}
              >
                期間
              </div>
              {/* Scrollable Month Header */}
              <div
                ref={monthHeaderScrollRef}
                className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide"
                onScroll={handleMonthHeaderScroll}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="bg-white/70 backdrop-blur-md flex" style={{ width: `${totalTimelineWidth}px` }}>
                  {monthHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="bg-blue-100/70 backdrop-blur-sm border-r border-gray-300 p-2 text-center text-sm font-bold text-blue-800 flex-shrink-0"
                      style={{ width: `${header.span * dateColumnWidth}px` }}
                    >
                      {header.month}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Header Row */}
            <div className="flex border-b border-gray-300 flex-shrink-0">
              {/* Fixed Task Name Header */}
              <div
                className="bg-white/70 backdrop-blur-md border-r border-gray-300 p-3 font-semibold text-gray-700 flex items-center flex-shrink-0"
                style={{ width: `${taskNameColumnWidth}px` }}
              >
                タスク名
              </div>
              {/* Scrollable Date Header */}
              <div
                ref={dateHeaderScrollRef}
                className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide"
                onScroll={handleDateHeaderScroll}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="bg-white/70 backdrop-blur-md flex" style={{ width: `${totalTimelineWidth}px` }}>
                  {dateRange.map((date, index) => (
                    <div
                      key={index}
                      className={`p-2 text-center text-xs font-medium border-r border-gray-300 flex-shrink-0 ${
                        isOpenDate(date)
                          ? "bg-yellow-100/80 backdrop-blur-sm text-yellow-700 font-bold"
                          : isWeekend(date)
                            ? "bg-red-50/80 backdrop-blur-sm text-red-600"
                            : "text-gray-600"
                      }`}
                      style={{ width: `${dateColumnWidth}px` }}
                    >
                      <div className="mb-1 font-bold">{date.getDate()}</div>
                      <div
                        className={`text-xs mb-1 ${
                          isOpenDate(date) ? "text-yellow-600" : isWeekend(date) ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        {getDayOfWeek(date)}
                      </div>
                      <div className="text-xs text-gray-400">{getRokuyo(date)}</div>
                      {isOpenDate(date) && (
                        <div className="flex justify-center mt-1">
                          <Flag className="h-3 w-3 text-yellow-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Fixed Task Names Column */}
              <div
                ref={taskNameScrollRef}
                className="bg-white/70 backdrop-blur-md border-r border-gray-300 flex-shrink-0 overflow-y-auto"
                style={{ width: `${taskNameColumnWidth}px` }}
              >
                {displayTasks.map((item, index) => (
                  <div
                    key={`${item.type}-${item.task.id}-${item.subTaskIndex || 0}`}
                    className={`border-b border-gray-200 h-12 flex items-center group ${
                      item.type === "sub"
                        ? "bg-gray-50/70 backdrop-blur-sm"
                        : item.type === "add-sub"
                          ? "bg-blue-50/70 backdrop-blur-sm"
                          : ""
                    }`}
                  >
                    {item.type === "main" && (
                      <div className="p-3 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 展開/折りたたみアイコン */}
                          {item.task.subTasks && item.task.subTasks.length > 0 && (
                            <button
                              onClick={() => handleTaskBarClick(item.task.id)}
                              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {expandedTasks.has(item.task.id) ? (
                                <ChevronDown className="h-3 w-3 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-600" />
                              )}
                            </button>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className={getTaskNameStyle(item.task.progress)}>{item.task.name}</h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 担当者名または未割り当て表示 */}
                          {item.task.assignedPerson ? (
                            <div className="text-xs text-gray-600">
                              {item.task.assignedPerson.firstName} {item.task.assignedPerson.lastName}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">未割り当て</div>
                          )}

                          {/* 担当者割り当て/変更ボタン */}
                          <button
                            onClick={() => openAssignDialog(item.task.id)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100"
                            title={item.task.assignedPerson ? "担当者を変更" : "担当者を割り当て"}
                          >
                            <UserPlus className="h-3 w-3" />
                          </button>

                          {/* タスク非表示ボタン - アイコンをEyeOffに変更 */}
                          {!item.task.id.startsWith("sheet-") && (
                            <button
                              onClick={() => hideMainTask(item.task.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100"
                              title="メインタスクを非表示"
                            >
                              <EyeOff className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {item.type === "sub" && (
                      <div className="p-3 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-6"></div> {/* インデント */}
                          {/* 完了チェックボックス */}
                          <button
                            onClick={() => toggleSubTaskCompletion(item.task.id, item.subTask.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                              item.subTask.completed
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 hover:border-green-400"
                            }`}
                          >
                            {item.subTask.completed && <Check className="h-2 w-2" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            {editingSubTask?.taskId === item.task.id &&
                            editingSubTask?.subTaskId === item.subTask.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editSubTaskName}
                                  onChange={(e) => setEditSubTaskName(e.target.value)}
                                  className="h-6 text-xs"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      updateSubTaskName(item.task.id, item.subTask.id, editSubTaskName)
                                    } else if (e.key === "Escape") {
                                      setEditingSubTask(null)
                                      setEditSubTaskName("")
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateSubTaskName(item.task.id, item.subTask.id, editSubTaskName)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSubTask(null)
                                    setEditSubTaskName("")
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="relative group">
                                <h3
                                  className={`text-xs cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${
                                    item.subTask.completed ? "line-through text-gray-500" : "text-gray-600"
                                  }`}
                                  onContextMenu={(e) => handleContextMenu(e, item.task.id, item.subTask.id)}
                                  onDoubleClick={() =>
                                    startEditingSubTask(item.task.id, item.subTask.id, item.subTask.name)
                                  }
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "280px",
                                  }}
                                  title={`└ ${item.subTask.name}`}
                                >
                                  └ {item.subTask.name}
                                </h3>

                                {/* 長いテキストの場合のツールチップ */}
                                {item.subTask.name.length > 25 && (
                                  <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 max-w-xs break-words pointer-events-none">
                                    └ {item.subTask.name}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* メニューボタンのみ */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => handleContextMenu(e, item.task.id, item.subTask.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          >
                            <MoreVertical className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    )}

                    {item.type === "add-sub" && (
                      <div className="p-3 flex items-center gap-3 w-full">
                        <div className="w-6"></div> {/* インデント */}
                        <Plus className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <Input
                          placeholder="新しいサブタスクを追加..."
                          value={newSubTaskName}
                          onChange={(e) => setNewSubTaskName(e.target.value)}
                          className="h-6 text-xs flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addSubTask(item.task.id)
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => addSubTask(item.task.id)}
                          disabled={!newSubTaskName.trim()}
                          className="h-6 px-2 text-xs"
                        >
                          追加
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Scrollable Timeline Column */}
              <div ref={contentScrollRef} className="flex-1 overflow-auto" onScroll={handleContentScroll}>
                <div style={{ width: `${totalTimelineWidth}px` }}>
                  {displayTasks.map((item, index) => (
                    <div
                      key={`timeline-${item.type}-${item.task.id}-${item.subTaskIndex || 0}`}
                      className={`border-b border-gray-200 h-12 relative ${
                        item.type === "sub"
                          ? "bg-gray-50/70 backdrop-blur-sm"
                          : item.type === "add-sub"
                            ? "bg-blue-50/70 backdrop-blur-sm"
                            : ""
                      }`}
                    >
                      {/* Vertical Grid Lines */}
                      <div className="absolute inset-0 flex">
                        {dateRange.map((date, dateIndex) => (
                          <div
                            key={dateIndex}
                            className="border-r border-gray-200 flex-shrink-0 h-full"
                            style={{ width: `${dateColumnWidth}px` }}
                          />
                        ))}
                      </div>

                      {/* Task Bar Container */}
                      <div className="relative w-full h-full flex items-center">
                        {item.type === "main" && (
                          /* Main Task Bar */
                          <div
                            className="absolute cursor-pointer transition-all duration-200 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
                            style={{
                              ...getTaskPosition(item.task),
                              ...getProgressBarStyle(item.task.progress),
                              top: "2px",
                              bottom: "2px",
                              height: "auto",
                            }}
                            onClick={() => handleTaskBarClick(item.task.id)}
                            title={`${item.task.name} (${item.task.progress}%完了) - クリックでサブタスク表示`}
                          >
                            {/* Progress Percentage Label */}
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
                              {item.task.progress}%
                            </div>
                          </div>
                        )}

                        {item.type === "sub" && (
                          /* Sub Task Bar */
                          <div
                            className="absolute transition-all duration-200 rounded-full border border-gray-300 cursor-pointer hover:shadow-sm"
                            style={{
                              ...getSubTaskPosition(item.task, item.subTaskIndex!, item.subTask?.completed),
                              ...getSubTaskStyle(item.subTask?.completed),
                              top: "4px",
                              bottom: "4px",
                              height: "auto",
                            }}
                            onClick={() => toggleSubTaskCompletion(item.task.id, item.subTask.id)}
                            onContextMenu={(e) => handleContextMenu(e, item.task.id, item.subTask.id)}
                            title={`${item.subTask?.name} - ${item.subTask?.completed ? "完了" : "未完了"} (クリックで切り替え)`}
                          >
                            {/* Completion Status */}
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                              {item.subTask?.completed ? "✓" : "○"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 担当者割り当てダイアログ */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
            <DialogHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">担当者を選択</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">このタスクの担当者を選択してください</p>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {people.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">担当者がいません</p>
                  <p className="text-sm text-gray-400 mt-1">まず担当者を追加してください</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {people.map((person) => (
                    <Button
                      key={person.id}
                      variant="outline"
                      className="w-full justify-start h-14 bg-white/70 backdrop-blur-sm border-gray-200/50 hover:bg-white/90 hover:border-blue-300 transition-all duration-200 rounded-xl"
                      onClick={() => assignPersonToTask(assigningTaskId!, person.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${person.bgColor} flex items-center justify-center`}>
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-base font-medium">
                          {person.firstName} {person.lastName}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Context Menu */}
        {showContextMenu && (
          <div
            className="fixed bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl py-2 z-50"
            style={{
              left: showContextMenu.x,
              top: showContextMenu.y,
            }}
            onMouseLeave={() => setShowContextMenu(null)}
          >
            {showContextMenu.subTaskId ? (
              // サブタスク用メニュー
              <>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    const task = tasks.find((t) => t.id === showContextMenu.taskId)
                    const subTask = task?.subTasks?.find((st) => st.id === showContextMenu.subTaskId)
                    if (subTask && showContextMenu.subTaskId) {
                      startEditingSubTask(showContextMenu.taskId, showContextMenu.subTaskId, subTask.name)
                    }
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                  名前を編集
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    if (showContextMenu.subTaskId) {
                      deleteSubTask(showContextMenu.taskId, showContextMenu.subTaskId)
                    }
                    setShowContextMenu(null)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  削除
                </button>
              </>
            ) : (
              // メインタスク用メニュー
              <>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    setEditingTaskId(showContextMenu.taskId)
                    setShowContextMenu(null)
                  }}
                >
                  <Plus className="h-3 w-3" />
                  サブタスクを追加
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    openAssignDialog(showContextMenu.taskId)
                    setShowContextMenu(null)
                  }}
                >
                  <UserPlus className="h-3 w-3" />
                  担当者を割り当て
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-600 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    hideMainTask(showContextMenu.taskId)
                    setShowContextMenu(null)
                  }}
                >
                  <EyeOff className="h-3 w-3" />
                  メインタスクを非表示
                </button>
              </>
            )}
          </div>
        )}

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .group:hover .group-hover\\:opacity-100 {
            opacity: 1;
          }
        `}</style>
      </div>
    </div>
  )
}
