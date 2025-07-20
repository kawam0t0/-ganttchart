"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Task, SubTask, Person } from "@/lib/types"

export function useRealtimeTasks(projectId: string | undefined, category: string, people: Person[]) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // タスクを取得
  const fetchTasks = async () => {
    if (!projectId) return

    try {
      setLoading(true)

      // タスクとサブタスクを同時に取得
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          subtasks (*)
        `)
        .eq("project_id", projectId)
        .eq("category", category)
        .order("created_at", { ascending: true })

      if (tasksError) throw tasksError

      const formattedTasks: Task[] = tasksData.map((task) => {
        const assignedPerson = people.find((p) => p.id === task.assigned_person_id)

        const subTasks: SubTask[] = task.subtasks
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
        }
      })

      setTasks(formattedTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // タスクを追加
  const addTask = async (taskData: {
    name: string
    startDate: Date
    endDate: Date
    assignedPersonId?: string
  }) => {
    if (!projectId) return

    try {
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
            progress: 0,
            is_local: true,
          },
        ])
        .select()
        .single()

      if (error) throw error
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
      // 現在のサブタスク数を取得してorder_indexを決定
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

      // 完了状態が変更された場合、親タスクの進捗率を更新
      if (updates.completed !== undefined) {
        // サブタスクの親タスクを特定
        const { data: subtaskData, error: subtaskError } = await supabase
          .from("subtasks")
          .select("task_id")
          .eq("id", subTaskId)
          .single()

        if (subtaskError) throw subtaskError

        // 親タスクのすべてのサブタスクを取得
        const { data: allSubtasks, error: allSubtasksError } = await supabase
          .from("subtasks")
          .select("completed")
          .eq("task_id", subtaskData.task_id)

        if (allSubtasksError) throw allSubtasksError

        // 進捗率を計算
        const completedCount = allSubtasks.filter((st) => st.completed).length
        const progress = allSubtasks.length > 0 ? Math.round((completedCount / allSubtasks.length) * 100) : 0

        // 親タスクの進捗率を更新
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

    // 初期データ取得
    fetchTasks()

    // タスクのリアルタイム購読
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
          // タスクが変更されたら再取得（シンプルな実装）
          fetchTasks()
        },
      )
      .subscribe()

    // サブタスクのリアルタイム購読
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
          // サブタスクが変更されたら再取得（シンプルな実装）
          fetchTasks()
        },
      )
      .subscribe()

    // クリーンアップ
    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(subtasksChannel)
    }
  }, [projectId, category, people])

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
