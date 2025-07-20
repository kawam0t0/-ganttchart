"use client"

import { useState, useEffect, useCallback } from "react"
import type { Person, Task } from "@/lib/types"
import { convertSheetTasksToGanttTasks, type SheetTask } from "@/lib/sheet-utils"

export function useSheetTasks(
  openDate: Date | undefined,
  people: Person[],
  category: string,
  existingTaskNames: Set<string>,
) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!openDate) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`🔄 Fetching sheet tasks for category: ${category}`)

      const response = await fetch("/api/sheets")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch sheet data")
      }

      const data: { tasks: SheetTask[] } = await response.json()
      console.log("📊 Raw sheet data received:", data)

      const allSheetTasks: SheetTask[] = data.tasks
      const categoryTasks = allSheetTasks.filter((task) => task.category === category)

      console.log(`📋 Found ${categoryTasks.length} tasks for category: ${category}`)
      console.log("🔍 Existing task names:", Array.from(existingTaskNames))

      // データベースに既に存在するタスクを名前でフィルタリングして除外
      const newTasks = categoryTasks.filter((task) => {
        const exists = existingTaskNames.has(task.mainTask)
        if (exists) {
          console.log(`⏭️ Skipping existing task: ${task.mainTask}`)
        }
        return !exists
      })

      console.log(`✅ Filtered to ${newTasks.length} new tasks`)

      const ganttTasks = convertSheetTasksToGanttTasks(newTasks, openDate, people)

      // orderIndexでソート
      ganttTasks.sort((a, b) => {
        const orderA = a.orderIndex ?? Number.POSITIVE_INFINITY
        const orderB = b.orderIndex ?? Number.POSITIVE_INFINITY
        return orderA - orderB
      })

      setTasks(ganttTasks)
      console.log(
        `🎉 Successfully loaded ${ganttTasks.length} sheet tasks for category: ${category}`,
        ganttTasks.map((t) => ({ name: t.name, orderIndex: t.orderIndex })),
      )
    } catch (err) {
      console.error(`❌ Error fetching sheet tasks for ${category}:`, err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [openDate, people, category, existingTaskNames])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, refetch: fetchTasks }
}
