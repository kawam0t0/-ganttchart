"use client"

import { GanttChart } from "../gantt-chart"
import type { Person } from "@/lib/types"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"

interface RecruitmentGanttProps {
  project: { id: string; name: string; openDate?: Date }
  people: Person[]
  onBack: () => void
}

export function RecruitmentGantt({ project, people, onBack }: RecruitmentGanttProps) {
  // Supabaseリアルタイムフックを使用
  const { tasks, loading, error, addTask, updateTask, deleteTask, addSubTask, updateSubTask, deleteSubTask, refetch } =
    useRealtimeTasks(project.id, "求人系", people)

  return (
    <GanttChart
      project={project}
      category="求人系"
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
