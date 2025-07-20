"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Task, SubTask, Person } from "@/lib/types"

export function useRealtimeTasks(projectId: string | undefined, category: string, people: Person[]) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)

      // is_localフィルタを削除し、カテゴリ内のすべてのSupabaseタスクを取得
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(
          `
          *,
          subtasks (*)
        `,
        )
        .eq("project_id", projectId)
        .eq("category", category)
        .order("order_index", { ascending: true })

      if (tasksError) throw tasksError

      const formattedTasks: Task[] = tasksData.map((task) => {
        const assignedPerson = people.find((p) => p.id === task.assigned_person_id)

        const subTasks: SubTask[] = (task.subtasks || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((subtask: any) => ({
            id: subtask.id,
            name: subtask.name,
            completed: subtask.completed,
          }))

        return {
          id: task.id,
          name: task.name,
          startDate: new Date(task.start_date),
          endDate: new Date(task.end_date),
          progress: task.progress,
          assignedPerson,
          subTasks,
          orderIndex: task.order_index,
        }
      })

      setTasks(formattedTasks)
      console.log(`📊 Fetched ${formattedTasks.length} Supabase tasks for category: ${category}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [projectId, category, people])

  // タスクを追加（またはスプレッドシートから変換）
  const addTask = async (taskData: {
    name: string
    startDate: Date
    endDate: Date
    assignedPersonId?: string
    orderIndex?: number // Optional: for conversion
    progress?: number // Optional: for conversion
    is_local?: boolean // Optional: for conversion
  }) => {
    if (!projectId) return

    try {
      let finalOrderIndex = taskData.orderIndex

      // orderIndexが提供されない場合（純粋な新規追加タスク）のみ、新しい番号を計算
      if (finalOrderIndex === undefined) {
        const { data: existingTasks, error: countError } = await supabase
          .from("tasks")
          .select("order_index")
          .eq("project_id", projectId)
          .eq("category", category)
          .order("order_index", { ascending: false })
          .limit(1)

        if (countError) throw countError

        const maxOrderIndex = existingTasks.length > 0 ? existingTasks[0].order_index || 0 : 0
        finalOrderIndex = Math.max(maxOrderIndex, 9999) + 1 // 10000以降を保証
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            project_id: projectId,
            name: taskData.name,
            start_date: taskData.startDate.toISOString(),
            end_date: taskData.endDate.toISOString(),
            assigned_person_id: taskData.assignedPersonId || null,
            category,
            progress: taskData.progress !== undefined ? taskData.progress : 0,
            is_local: taskData.is_local !== undefined ? taskData.is_local : true,
            order_index: finalOrderIndex,
          },
        ])
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Added/Converted task "${taskData.name}" with order_index: ${finalOrderIndex}`)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task")
      throw err
    }
  }

  // タスクを更新
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name) updateData.name = updates.name
      if (updates.progress !== undefined) updateData.progress = updates.progress
      if (updates.assignedPerson !== undefined) {
        updateData.assigned_person_id = updates.assignedPerson?.id || null
      }

      const { error } = await supabase.from("tasks").update(updateData).eq("id", taskId)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task")
      throw err
    }
  }

  // タスクを削除
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task")
      throw err
    }
  }

  // サブタスクを追加
  const addSubTask = async (taskId: string, name: string) => {
    try {
      const { data: existingSubtasks, error: countError } = await supabase
        .from("subtasks")
        .select("order_index")
        .eq("task_id", taskId)
        .order("order_index", { ascending: false })
        .limit(1)

      if (countError) throw countError

      const nextOrderIndex = existingSubtasks.length > 0 ? existingSubtasks[0].order_index + 1 : 0

      const { data, error } = await supabase
        .from("subtasks")
        .insert([
          {
            task_id: taskId,
            name,
            completed: false,
            order_index: nextOrderIndex,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subtask")
      throw err
    }
  }

  // サブタスクを更新
  const updateSubTask = async (subTaskId: string, updates: { name?: string; completed?: boolean }) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        ...updates,
      }

      const { error } = await supabase.from("subtasks").update(updateData).eq("id", subTaskId)

      if (error) throw error

      if (updates.completed !== undefined) {
        const { data: subtaskData, error: subtaskError } = await supabase
          .from("subtasks")
          .select("task_id")
          .eq("id", subTaskId)
          .single()

        if (subtaskError) throw subtaskError
        if (!subtaskData) return

        const { data: allSubtasks, error: allSubtasksError } = await supabase
          .from("subtasks")
          .select("completed")
          .eq("task_id", subtaskData.task_id)

        if (allSubtasksError) throw allSubtasksError

        const completedCount = allSubtasks.filter((st) => st.completed).length
        const progress = allSubtasks.length > 0 ? Math.round((completedCount / allSubtasks.length) * 100) : 0

        const { error: taskUpdateError } = await supabase
          .from("tasks")
          .update({ progress, updated_at: new Date().toISOString() })
          .eq("id", subtaskData.task_id)

        if (taskUpdateError) throw taskUpdateError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subtask")
      throw err
    }
  }

  // サブタスクを削除
  const deleteSubTask = async (subTaskId: string) => {
    try {
      const { error } = await supabase.from("subtasks").delete().eq("id", subTaskId)
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subtask")
      throw err
    }
  }

  useEffect(() => {
    if (!projectId) return

    fetchTasks()

    const tasksChannel = supabase
      .channel(`tasks-${projectId}-${category}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log("Task change received:", payload)
          fetchTasks()
        },
      )
      .subscribe()

    const subtasksChannel = supabase
      .channel(`subtasks-${projectId}-${category}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subtasks",
        },
        (payload) => {
          console.log("Subtask change received:", payload)
          fetchTasks()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(subtasksChannel)
    }
  }, [projectId, category, fetchTasks])

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    refetch: fetchTasks,
  }
}
