"use client"

import { useMemo } from "react"
import { GanttChart } from "../gantt-chart"
import { useSheetTasks } from "@/hooks/use-sheet-tasks"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import type { Person } from "@/lib/types"

interface CommunicationGanttProps {
  project: { id: string; name: string; openDate?: Date }
  people: Person[]
  onBack: () => void
}

export function CommunicationGantt({ project, people, onBack }: CommunicationGanttProps) {
  const category = "連絡系"

  const {
    tasks: dbTasks,
    loading: dbLoading,
    addTask,
    updateTask,
    deleteTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    refetch: refetchDbTasks,
  } = useRealtimeTasks(project.id, category, people)

  const dbTaskNames = useMemo(() => new Set(dbTasks.map((t) => t.name)), [dbTasks])

  const {
    tasks: sheetTasks,
    loading: sheetLoading,
    refetch: refetchSheetTasks,
  } = useSheetTasks(project.openDate, people, category, dbTaskNames)

  const allTasks = useMemo(() => {
    console.log(`🔄 ${category}: Combining tasks...`)
    console.log(`📊 Sheet tasks: ${sheetTasks.length}, DB tasks: ${dbTasks.length}`)

    const combined = [...sheetTasks, ...dbTasks]

    // orderIndexでソート（未定義の場合は最後尾）
    const sorted = combined.sort((a, b) => {
      const orderA = a.orderIndex ?? Number.POSITIVE_INFINITY
      const orderB = b.orderIndex ?? Number.POSITIVE_INFINITY
      return orderA - orderB
    })

    console.log(
      `✅ ${category}: Final task order:`,
      sorted.map((t) => ({ name: t.name, orderIndex: t.orderIndex })),
    )

    return sorted
  }, [sheetTasks, dbTasks, category])

  const handleRefresh = async () => {
    console.log(`🔄 ${category}: Refreshing data...`)
    await Promise.all([refetchDbTasks(), refetchSheetTasks()])
  }

  return (
    <GanttChart
      project={project}
      category={category}
      tasks={allTasks}
      people={people}
      onBack={onBack}
      loading={dbLoading || sheetLoading}
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
