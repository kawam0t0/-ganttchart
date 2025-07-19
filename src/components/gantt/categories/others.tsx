"use client"

import { GanttChart } from "../gantt-chart"
import type { Person } from "@/lib/types"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"

interface OthersGanttProps {
  project: { id: string; name: string; openDate?: Date }
  people: Person[]
  onBack: () => void
}

export function OthersGantt({ project, people, onBack }: OthersGanttProps) {
  // Supabaseリアルタイムフックを使用
  const { tasks, loading, error, addTask, updateTask, deleteTask, addSubTask, updateSubTask, deleteSubTask, refetch } =
    useRealtimeTasks(project.id, "その他", people)

  return (
    <GanttChart
      project={project}
      category="その他"
      tasks={tasks}
      people={people}
      onBack={onBack}
      loading={loading}
      onRefresh={refetch}
      onAddTask={addTask}
      onUpdateTask={updateTask}
      onDeleteTask={deleteTask}
      onAddSubTask={addSubTask}
      onUpdateSubTask={updateSubTask}
      onDeleteSubTask={deleteSubTask}
    />
  )
}
