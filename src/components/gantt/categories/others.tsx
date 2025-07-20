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
    console.log("🔄 OthersGantt: Combining tasks...")
    console.log("📊 Supabase tasks:", supabaseTasks)
    console.log("📊 Sheet tasks for その他:", sheetTasks["その他"])

    const categorySheetTasks = sheetTasks["その他"] || []

    // 空のタスクを除外（その他カテゴリーには空のタスクが多い）
    const filteredSheetTasks = categorySheetTasks.filter((task) => task.name && task.name.trim() !== "")

    // 重複チェック: 同じ名前のタスクがある場合はSupabaseを優先
    const supabaseTaskNames = new Set(supabaseTasks.map((task) => task.name))
    const finalFilteredSheetTasks = filteredSheetTasks.filter((task) => !supabaseTaskNames.has(task.name))

    // スプレッドシートタスクをdisplayOrder（orderIndex）でソート
    const sortedSheetTasks = finalFilteredSheetTasks.sort((a, b) => {
      const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999
      const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999
      return orderA - orderB
    })

    // SupabaseタスクもorderIndexでソート
    const sortedSupabaseTasks = supabaseTasks.sort((a, b) => {
      const orderA = a.orderIndex !== undefined ? a.orderIndex : 10000
      const orderB = b.orderIndex !== undefined ? b.orderIndex : 10000
      return orderA - orderB
    })

    const combined = [...sortedSheetTasks, ...sortedSupabaseTasks]

    console.log(`✅ OthersGantt: Combined ${combined.length} tasks`)
    console.log(
      "📋 Final task list:",
      combined.map((t) => ({
        name: t.name,
        id: t.id,
        orderIndex: t.orderIndex,
        subTaskCount: t.subTasks?.length || 0,
      })),
    )

    setCombinedTasks(combined)
    setIsLoading(supabaseLoading || sheetLoading)
  }, [supabaseTasks, sheetTasks, supabaseLoading, sheetLoading])

  const handleRefresh = async () => {
    console.log("🔄 OthersGantt: Refreshing data...")
    await Promise.all([refetchSupabase(), refetchSheet()])
  }

  // エラー表示
  if (sheetError) {
    console.error("❌ OthersGantt: Sheet error:", sheetError)
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
