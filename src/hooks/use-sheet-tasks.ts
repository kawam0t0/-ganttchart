"use client"

import { useState, useEffect } from "react"
import type { Task } from "@/lib/types"
import type { SheetTask } from "@/lib/sheet-utils"

export function useSheetTasks(openDate: Date | undefined, people: any[]) {
  const [tasks, setTasks] = useState<{ [category: string]: Task[] }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    if (!openDate) {
      // OPEN日が設定されていない場合は空のデータを返す
      setTasks({
        連絡系: [],
        販促物備品系: [],
        通信系: [],
        プロモーション系: [],
        求人系: [],
        研修系: [],
        その他: [],
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("🔄 Fetching sheet tasks for OPEN date:", openDate)

      const response = await fetch("/api/sheets")
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Raw sheet data received:", data)

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
        // 空のタスクをスキップ
        if (!sheetTask.mainTask || sheetTask.mainTask.trim() === "") {
          console.log(`⏭️ Skipping empty task at index ${index}`)
          return
        }

        const category = sheetTask.category
        console.log(
          `📝 Processing task: "${sheetTask.mainTask}" in category: "${category}", displayOrder: ${sheetTask.displayOrder}`,
        )

        // カテゴリーが存在するかチェック
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
            orderIndex: sheetTask.displayOrder, // スプレッドシートのB列番号を使用
            subTasks: sheetTask.subTasks.map((st) => ({
              ...st,
              // assignedPersonは設定しない
            })),
          }

          categorizedTasks[category].push(task)
          console.log(
            `✅ Added task "${task.name}" to category "${category}" with displayOrder ${sheetTask.displayOrder}`,
          )
        } else {
          console.warn(`⚠️ Unknown category: "${category}" for task: "${sheetTask.mainTask}"`)
        }
      })

      // 各カテゴリーのタスクをdisplayOrder（orderIndex）でソート
      Object.keys(categorizedTasks).forEach((category) => {
        categorizedTasks[category].sort((a, b) => {
          const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999
          const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999
          return orderA - orderB
        })
        console.log(
          `🔢 Sorted category "${category}" by displayOrder:`,
          categorizedTasks[category].map((t) => ({ name: t.name, order: t.orderIndex })),
        )
      })

      // 各カテゴリーのタスク数をログ出力
      Object.entries(categorizedTasks).forEach(([category, tasks]) => {
        console.log(`📊 Category "${category}": ${tasks.length} tasks`)
      })

      setTasks(categorizedTasks)
      console.log("🎉 Sheet tasks successfully categorized:", categorizedTasks)
    } catch (err) {
      console.error("❌ Error fetching sheet tasks:", err)
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
