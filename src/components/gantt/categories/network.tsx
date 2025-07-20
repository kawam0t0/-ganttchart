"use client"

import { useEffect, useState } from "react"
import { GanttChart } from "../gantt-chart"
import type { Person, Task } from "@/lib/types"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { useSheetTasks } from "@/hooks/use-sheet-tasks"

interface NetworkGanttProps {
  project: { id: string; name: string; openDate?: Date }
  people: Person[]
  onBack: () => void
}

export function NetworkGantt({ project, people, onBack }: NetworkGanttProps) {
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
  } = useRealtimeTasks(project.id, "通信系", people)

  // スプレッドシートデータフック
  const {
    tasks: sheetTasks,
    loading: sheetLoading,
    error: sheetError,
    refetch: refetchSheet,
  } = useSheetTasks(project.openDate, people)

  // データを統合
  useEffect(() => {
    console.log("🔄 NetworkGantt: Combining tasks...")
    console.log("📊 Supabase tasks:", supabaseTasks)
    console.log("📊 Sheet tasks for 通信系:", sheetTasks["通信系"])

    const categorySheetTasks = sheetTasks["通信系"] || []

    // 重複チェック: 同じ名前のタスクがある場合はSupabaseを優先
    const supabaseTaskNames = new Set(supabaseTasks.map((task) => task.name))
    const filteredSheetTasks = categorySheetTasks.filter((task) => !supabaseTaskNames.has(task.name))

    // スプレッドシートタスクを先に、Supabaseタスクを後に配置
    const combined = [...filteredSheetTasks, ...supabaseTasks]

    console.log(`✅ NetworkGantt: Combined ${combined.length} tasks`)
    console.log(
      "📋 Final task list:",
      combined.map((t) => ({ name: t.name, id: t.id, subTaskCount: t.subTasks?.length || 0 })),
    )

    setCombinedTasks(combined)
    setIsLoading(supabaseLoading || sheetLoading)
  }, [supabaseTasks, sheetTasks, supabaseLoading, sheetLoading])

  const handleRefresh = async () => {
    console.log("🔄 NetworkGantt: Refreshing data...")
    await Promise.all([refetchSupabase(), refetchSheet()])
  }

  // エラー表示
  if (sheetError) {
    console.error("❌ NetworkGantt: Sheet error:", sheetError)
  }

  return (
    <GanttChart
      project={project}
      category="通信系"
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
