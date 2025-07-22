"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, PlusIcon, EditIcon, TrashIcon, RefreshCwIcon, EyeOffIcon, EyeIcon } from "lucide-react"
import { format, addDays, differenceInDays, startOfDay, endOfDay } from "date-fns"
import { ja } from "date-fns/locale"
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
  id: string
  type: "task" | "subtask"
  task: Task
  subTask?: SubTask
  level: number
  isVisible: boolean
}

interface DragState {
  isDragging: boolean
  taskId: string | null
  dragType: "start" | "end" | "move" | null
  startX: number
  originalStartDate: Date | null
  originalEndDate: Date | null
  containerRect: DOMRect | null
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [isAddSubTaskOpen, setIsAddSubTaskOpen] = useState(false)
  const [isEditSubTaskOpen, setIsEditSubTaskOpen] = useState(false)
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null)
  const [hiddenTasks, setHiddenTasks] = useState<Set<string>>(new Set())
  const [isHiddenTasksOpen, setIsHiddenTasksOpen] = useState(false)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // 新しいタスクフォーム用の状態
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskStartDate, setNewTaskStartDate] = useState("")
  const [newTaskEndDate, setNewTaskEndDate] = useState("")
  const [newTaskAssignedPerson, setNewTaskAssignedPerson] = useState("")

  // 編集用の状態
  const [editTaskName, setEditTaskName] = useState("")
  const [editTaskAssignedPerson, setEditTaskAssignedPerson] = useState("")

  // サブタスク用の状態
  const [newSubTaskName, setNewSubTaskName] = useState("")
  const [editSubTaskName, setEditSubTaskName] = useState("")

  // バーのドラッグ機能のための状態管理
  const [dragState, setDragState] = useState<DragState | null>(null)

  // 手動更新機能
  const handleManualRefresh = useCallback(async () => {
    if (onRefresh) {
      console.log(`🔄 Manual refresh triggered for ${category}`)
      await onRefresh()
      setLastRefresh(new Date())
    }
  }, [onRefresh, category])

  // 自動更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) {
        console.log(`🔄 Auto-refresh triggered for ${category}`)
        onRefresh()
        setLastRefresh(new Date())
      }
    }, 30 * 1000) // 30秒

    return () => clearInterval(interval)
  }, [onRefresh, category])

  // ガントチャートのアイテムを生成
  const ganttItems = useMemo(() => {
    const items: GanttItem[] = []

    tasks.forEach((task) => {
      const isTaskHidden = hiddenTasks.has(task.id)

      // メインタスクを追加
      items.push({
        id: task.id,
        type: "task",
        task,
        level: 0,
        isVisible: !isTaskHidden,
      })

      // サブタスクを追加（メインタスクが表示されている場合のみ）
      if (!isTaskHidden && task.subTasks) {
        task.subTasks.forEach((subTask) => {
          items.push({
            id: `${task.id}-${subTask.id}`,
            type: "subtask",
            task,
            subTask,
            level: 1,
            isVisible: true,
          })
        })
      }
    })

    return items
  }, [tasks, hiddenTasks])

  // 表示されているアイテムのみをフィルタ
  const visibleItems = ganttItems.filter((item) => item.isVisible)

  // 日付範囲を計算
  const dateRange = useMemo(() => {
    if (tasks.length === 0) return { start: new Date(), end: addDays(new Date(), 30) }

    const allDates = tasks.flatMap((task) => [task.startDate, task.endDate])
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    return {
      start: startOfDay(addDays(minDate, -7)),
      end: endOfDay(addDays(maxDate, 7)),
    }
  }, [tasks])

  // 日付の配列を生成
  const dates = useMemo(() => {
    const days = []
    let currentDate = new Date(dateRange.start)

    while (currentDate <= dateRange.end) {
      days.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return days
  }, [dateRange])

  // タスクバーの位置とサイズを計算
  const getTaskBarStyle = (startDate: Date, endDate: Date) => {
    const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1
    const startOffset = differenceInDays(startDate, dateRange.start)
    const duration = differenceInDays(endDate, startDate) + 1

    const left = (startOffset / totalDays) * 100
    const width = (duration / totalDays) * 100

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`,
    }
  }

  // タスクを非表示にする
  const hideTask = (taskId: string) => {
    setHiddenTasks((prev) => new Set([...prev, taskId]))
  }

  // タスクを表示する
  const showTask = (taskId: string) => {
    setHiddenTasks((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  // 非表示タスクの一覧
  const hiddenTasksList = tasks.filter((task) => hiddenTasks.has(task.id))

  // 新しいタスクを追加
  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskStartDate || !newTaskEndDate) return

    try {
      await onAddTask?.({
        name: newTaskName.trim(),
        startDate: new Date(newTaskStartDate),
        endDate: new Date(newTaskEndDate),
        assignedPersonId: newTaskAssignedPerson || undefined,
      })

      // フォームをリセット
      setNewTaskName("")
      setNewTaskStartDate("")
      setNewTaskEndDate("")
      setNewTaskAssignedPerson("")
      setIsAddTaskOpen(false)
    } catch (error) {
      console.error("Failed to add task:", error)
    }
  }

  // タスクを編集
  const handleEditTask = async () => {
    if (!selectedTask || !editTaskName.trim()) return

    try {
      const assignedPerson = editTaskAssignedPerson ? people.find((p) => p.id === editTaskAssignedPerson) : undefined

      await onUpdateTask?.(selectedTask.id, {
        name: editTaskName.trim(),
        assignedPerson,
      })

      setIsEditTaskOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  // タスクを削除
  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(`タスク「${task.name}」を削除しますか？`)) {
      try {
        await onDeleteTask?.(task.id)
      } catch (error) {
        console.error("Failed to delete task:", error)
      }
    }
  }

  // サブタスクを追加
  const handleAddSubTask = async () => {
    if (!selectedTask || !newSubTaskName.trim()) return

    try {
      await onAddSubTask?.(selectedTask.id, newSubTaskName.trim())
      setNewSubTaskName("")
      setIsAddSubTaskOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error("Failed to add subtask:", error)
    }
  }

  // サブタスクを編集
  const handleEditSubTask = async () => {
    if (!selectedSubTask || !editSubTaskName.trim()) return

    try {
      await onUpdateSubTask?.(selectedSubTask.id, {
        name: editSubTaskName.trim(),
      })

      setIsEditSubTaskOpen(false)
      setSelectedSubTask(null)
    } catch (error) {
      console.error("Failed to update subtask:", error)
    }
  }

  // サブタスクの完了状態を切り替え
  const handleToggleSubTask = async (subTask: SubTask) => {
    try {
      await onUpdateSubTask?.(subTask.id, {
        completed: !subTask.completed,
      })
    } catch (error) {
      console.error("Failed to toggle subtask:", error)
    }
  }

  // サブタスクを削除
  const handleDeleteSubTask = async (subTask: SubTask) => {
    if (window.confirm(`サブタスク「${subTask.name}」を削除しますか？`)) {
      try {
        await onDeleteSubTask?.(subTask.id)
      } catch (error) {
        console.error("Failed to delete subtask:", error)
      }
    }
  }

  // 編集ダイアログを開く
  const openEditDialog = (task: Task) => {
    setSelectedTask(task)
    setEditTaskName(task.name)
    setEditTaskAssignedPerson(task.assignedPerson?.id || "")
    setIsEditTaskOpen(true)
  }

  // サブタスク追加ダイアログを開く
  const openAddSubTaskDialog = (task: Task) => {
    setSelectedTask(task)
    setIsAddSubTaskOpen(true)
  }

  // サブタスク編集ダイアログを開く
  const openEditSubTaskDialog = (subTask: SubTask) => {
    setSelectedSubTask(subTask)
    setEditSubTaskName(subTask.name)
    setIsEditSubTaskOpen(true)
  }

  // ドラッグ機能のマウスイベントハンドラー
  const handleMouseDown = (e: React.MouseEvent, task: Task, dragType: "start" | "end" | "move") => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).closest(".col-span-8")?.getBoundingClientRect()

    setDragState({
      isDragging: true,
      taskId: task.id,
      dragType,
      startX: e.clientX,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate,
      containerRect: rect || null,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState?.isDragging || !dragState.containerRect) return

      const deltaX = e.clientX - dragState.startX
      const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1
      const containerWidth = dragState.containerRect.width
      const dayWidth = containerWidth / totalDays
      const daysDelta = Math.round(deltaX / dayWidth)

      const task = tasks.find((t) => t.id === dragState.taskId)
      if (!task || !dragState.originalStartDate || !dragState.originalEndDate) return

      let newStartDate = new Date(dragState.originalStartDate)
      let newEndDate = new Date(dragState.originalEndDate)

      switch (dragState.dragType) {
        case "start":
          newStartDate = addDays(dragState.originalStartDate, daysDelta)
          // 開始日が終了日を超えないように制限
          if (newStartDate >= dragState.originalEndDate) {
            newStartDate = addDays(dragState.originalEndDate, -1)
          }
          break
        case "end":
          newEndDate = addDays(dragState.originalEndDate, daysDelta)
          // 終了日が開始日より前にならないように制限
          if (newEndDate <= dragState.originalStartDate) {
            newEndDate = addDays(dragState.originalStartDate, 1)
          }
          break
        case "move":
          newStartDate = addDays(dragState.originalStartDate, daysDelta)
          newEndDate = addDays(dragState.originalEndDate, daysDelta)
          break
      }

      // タスクの日付を一時的に更新（視覚的フィードバック用）
      const updatedTasks = tasks.map((t) =>
        t.id === dragState.taskId ? { ...t, startDate: newStartDate, endDate: newEndDate } : t,
      )
      // ここでは実際の状態更新は行わず、ドラッグ終了時に更新
    },
    [dragState, dateRange, tasks],
  )

  const handleMouseUp = useCallback(async () => {
    if (!dragState?.isDragging || !dragState.taskId || !dragState.containerRect) return

    const task = tasks.find((t) => t.id === dragState.taskId)
    if (!task || !dragState.originalStartDate || !dragState.originalEndDate) {
      setDragState(null)
      return
    }

    // 最終的な日付を計算
    const deltaX = 0 // マウス位置から計算する必要があるが、簡略化
    const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1
    const containerWidth = dragState.containerRect.width
    const dayWidth = containerWidth / totalDays
    const daysDelta = Math.round(deltaX / dayWidth)

    const newStartDate = new Date(dragState.originalStartDate)
    const newEndDate = new Date(dragState.originalEndDate)

    try {
      await onUpdateTask?.(task.id, {
        startDate: newStartDate,
        endDate: newEndDate,
      })
      console.log(`✅ Task "${task.name}" dates updated successfully`)
    } catch (error) {
      console.error("Failed to update task dates:", error)
    }

    setDragState(null)
  }, [dragState, tasks, dateRange, onUpdateTask])

  useEffect(() => {
    if (dragState?.isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = dragState.dragType === "move" ? "grabbing" : "ew-resize"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = "default"
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            ← 戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category}</h1>
            <p className="text-sm text-gray-600">最終更新: {format(lastRefresh, "HH:mm:ss", { locale: ja })}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hiddenTasksList.length > 0 && (
            <Dialog open={isHiddenTasksOpen} onOpenChange={setIsHiddenTasksOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <EyeOffIcon className="h-4 w-4 mr-2" />
                  非表示タスク ({hiddenTasksList.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>非表示タスク</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {hiddenTasksList.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{task.name}</span>
                      <Button size="sm" variant="outline" onClick={() => showTask(task.id)}>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        表示
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                メインタスクを追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいメインタスクを追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskName">タスク名</Label>
                  <Input
                    id="taskName"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="タスク名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">開始日</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">終了日</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newTaskEndDate}
                    onChange={(e) => setNewTaskEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedPerson">担当者</Label>
                  <Select value={newTaskAssignedPerson || "none"} onValueChange={setNewTaskAssignedPerson}>
                    <SelectTrigger>
                      <SelectValue placeholder="担当者を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未割り当て</SelectItem>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.firstName} {person.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddTask}>追加</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ガントチャート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>ガントチャート - バーをドラッグして期間調整可能</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* ヘッダー行 */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-4 font-semibold text-gray-700">タスク名</div>
                <div className="col-span-8">
                  <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
                    {dates.slice(0, 7).map((date, index) => (
                      <div key={index} className="text-center p-1">
                        {format(date, "M/d", { locale: ja })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* タスク行 */}
              <div className="space-y-2">
                {visibleItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center min-h-[60px]">
                    {/* タスク名列 */}
                    <div className={`col-span-4 ${item.level === 1 ? "pl-6" : ""}`}>
                      {item.type === "task" ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div
                                className="relative"
                                onMouseEnter={() => setHoveredTask(item.task.id)}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
                                  {item.task.name.length > 25 ? `${item.task.name.slice(0, 25)}...` : item.task.name}
                                </h3>
                                {/* ホバー時のツールチップ */}
                                {hoveredTask === item.task.id && item.task.name.length > 25 && (
                                  <div className="absolute top-full left-0 z-50 bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg max-w-xs break-words">
                                    {item.task.name}
                                  </div>
                                )}
                              </div>
                              {/* 担当者名または未割り当て表示 */}
                              {item.task.assignedPerson ? (
                                <div className="text-xs text-gray-600">{item.task.assignedPerson.firstName}</div>
                              ) : (
                                <div className="text-xs text-gray-400">未割り当て</div>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditDialog(item.task)}>
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openAddSubTaskDialog(item.task)}>
                                <PlusIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => hideTask(item.task.id)}>
                                <EyeOffIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(item.task)}>
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={item.task.progress} className="flex-1 h-2" />
                            <span className="text-xs text-gray-600">{item.task.progress}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={item.subTask?.completed || false}
                              onCheckedChange={() => item.subTask && handleToggleSubTask(item.subTask)}
                            />
                            <span
                              className={`text-sm ${item.subTask?.completed ? "line-through text-gray-500" : "text-gray-700"} truncate max-w-[150px]`}
                            >
                              {item.subTask?.name && item.subTask.name.length > 20
                                ? `${item.subTask.name.slice(0, 20)}...`
                                : item.subTask?.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => item.subTask && openEditSubTaskDialog(item.subTask)}
                            >
                              <EditIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => item.subTask && handleDeleteSubTask(item.subTask)}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ガントバー列 */}
                    <div className="col-span-8 relative h-8">
                      {item.type === "task" && (
                        <div className="relative h-full bg-gray-100 rounded">
                          <div
                            className={`absolute top-1 bottom-1 rounded shadow-sm group ${
                              dragState?.taskId === item.task.id ? "opacity-70" : ""
                            }`}
                            style={getTaskBarStyle(item.task.startDate, item.task.endDate)}
                          >
                            {/* 左端のリサイズハンドル */}
                            <div
                              className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-l"
                              onMouseDown={(e) => handleMouseDown(e, item.task, "start")}
                              title="開始日を調整"
                            />

                            {/* メインバー */}
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded cursor-move"
                              onMouseDown={(e) => handleMouseDown(e, item.task, "move")}
                              title="期間を移動"
                            />

                            {/* 右端のリサイズハンドル */}
                            <div
                              className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-r"
                              onMouseDown={(e) => handleMouseDown(e, item.task, "end")}
                              title="終了日を調整"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {visibleItems.length === 0 && <div className="text-center py-8 text-gray-500">タスクがありません</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTaskName">タスク名</Label>
              <Input id="editTaskName" value={editTaskName} onChange={(e) => setEditTaskName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="editAssignedPerson">担当者</Label>
              <Select value={editTaskAssignedPerson || "none"} onValueChange={setEditTaskAssignedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未割り当て</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleEditTask}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* サブタスク追加ダイアログ */}
      <Dialog open={isAddSubTaskOpen} onOpenChange={setIsAddSubTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>サブタスクを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newSubTaskName">サブタスク名</Label>
              <Input
                id="newSubTaskName"
                value={newSubTaskName}
                onChange={(e) => setNewSubTaskName(e.target.value)}
                placeholder="サブタスク名を入力"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddSubTaskOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddSubTask}>追加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* サブタスク編集ダイアログ */}
      <Dialog open={isEditSubTaskOpen} onOpenChange={setIsEditSubTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>サブタスクを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSubTaskName">サブタスク名</Label>
              <Input
                id="editSubTaskName"
                value={editSubTaskName}
                onChange={(e) => setEditSubTaskName(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditSubTaskOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleEditSubTask}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
