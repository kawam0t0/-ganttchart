"use client"

import { useState, useEffect } from "react"
import type { Task } from "@/lib/types"
import type { SheetTask } from "@/lib/sheet-utils"

export function useSheetTasks(openDate: Date | undefined, people: any[]) {
  const [tasks, setTasks] = useState<{ [category: string]: Task[] }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    if (!openDate) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/sheets")
      if (!response.ok) {
        throw new Error("Failed to fetch sheet data")
      }

      const data = await response.json()
      const sheetTasks: SheetTask[] = data.tasks

      // カテゴリー別にタスクを分類
      const categorizedTasks: { [category: string]: Task[] } = {
        連絡系: [],
        販促物備品系: [],
        通信系: [],
        プロモーション系: [],
        求人系: [],
        研修系: [],
        その他: [],
      }

      // スプレッドシートのデータをカテゴリー別に分類
      sheetTasks.forEach((sheetTask, index) => {
        const category = sheetTask.category
        if (categorizedTasks[category]) {
          // OPEN日から逆算して開始日を計算
          const startDate = new Date(openDate)
          startDate.setDate(startDate.getDate() - sheetTask.fromOpen)

          // 期間を加えて終了日を計算
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + sheetTask.period - 1)

          const task: Task = {
            id: `sheet-${category}-${index}`,
            name: sheetTask.mainTask,
            startDate,
            endDate,
            progress: 0, // デフォルトで0%に設定
            assignedPerson: undefined, // デフォルトでは担当者を割り当てない
            subTasks: sheetTask.subTasks.map((st) => ({
              ...st,
              // assignedPersonは設定しない
            })),
          }

          categorizedTasks[category].push(task)
        }
      })

      setTasks(categorizedTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [openDate, people])

  return { tasks, loading, error, refetch: fetchTasks }
}
