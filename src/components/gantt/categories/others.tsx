"use client"

import { useEffect, useState } from "react"
import { GanttChart } from "../gantt-chart"
import type { Person, Task } from "@/lib/types"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { useSheetTasks } from "@/hooks/use-sheet-tasks"

interface OthersGanttProps {
  project: { id: string; name: string; openDate?: Date }
  people: Person[]
  onBack: () => void
}

export function OthersGantt({ project, people, onBack }: OthersGanttProps) {
  const [combinedTasks, setCombinedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Supabaseリアルタイムフック
  const {
    tasks: supabaseTasks,
    loading: supabaseLoading,
    addTask,
    updateTask,
    deleteTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    refetch: refetchSupabase,
  } = useRealtimeTasks(project.id, "その他", people)

  // スプレッドシートデータフック
  const {
    tasks: sheetTasks,
    loading: sheetLoading,
    error: sheetError,
    refetch: refetchSheet,
  } = useSheetTasks(project.openDate, people)

  // データを統合
  useEffect(() => {
    const categorySheetTasks = sheetTasks["その他"] || []

    // スプレッドシートタスクとSupabaseタスクを統合
    const combined = [...categorySheetTasks, ...supabaseTasks]

    // 重複を除去（同じ名前のタスクがある場合はSupabaseを優先）
    const uniqueTasks = combined.reduce((acc: Task[], current) => {
      const existingIndex = acc.findIndex((task) => task.name === current.name)
      if (existingIndex >= 0) {
        // Supabaseタスク（IDがsheet-で始まらない）を優先
        if (!current.id.startsWith("sheet-")) {
          acc[existingIndex] = current
        }
      } else {
        acc.push(current)
      }
      return acc
    }, [])

    setCombinedTasks(uniqueTasks)
    setIsLoading(supabaseLoading || sheetLoading)
  }, [supabaseTasks, sheetTasks, supabaseLoading, sheetLoading])

  const handleRefresh = async () => {
    await Promise.all([refetchSupabase(), refetchSheet()])
  }

  return (
    <GanttChart
      project={project}
      category="その他"
      tasks={combinedTasks}
      people={people}
      onBack={onBack}
      loading={isLoading}
      onRefresh={handleRefresh}
      onAddTask={addTask}
      onUpdateTask={updateTask}
      onDeleteTask={deleteTask}
      onAddSubTask={addSubTask}
      onUpdateSubTask={updateSubTask}
      onDeleteSubTask={deleteSubTask}
    />
  )
}
