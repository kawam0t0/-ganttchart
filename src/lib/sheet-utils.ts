import type { Task, SubTask, Person } from "./types"

export interface SheetTask {
  category: string
  displayOrder: number
  mainTask: string
  subTasks: { id: string; name: string; completed: boolean }[]
  period: number
  fromOpen: number
}

export function convertSheetTasksToGanttTasks(sheetTasks: SheetTask[], openDate: Date, people: Person[]): Task[] {
  return sheetTasks.map((sheetTask, index) => {
    // OPEN日から逆算して開始日を計算
    const startDate = new Date(openDate)
    startDate.setDate(startDate.getDate() - sheetTask.fromOpen)

    // 期間を加えて終了日を計算
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + sheetTask.period - 1)

    // サブタスクを変換
    const subTasks: SubTask[] = sheetTask.subTasks.map((subTask) => ({
      ...subTask,
    }))

    // 進捗率を計算（完了したサブタスクの割合）
    const completedSubTasks = subTasks.filter((st) => st.completed).length
    const progress = subTasks.length > 0 ? Math.round((completedSubTasks / subTasks.length) * 100) : 0

    return {
      id: `sheet-${sheetTask.category}-${sheetTask.displayOrder}`,
      name: sheetTask.mainTask,
      startDate,
      endDate,
      progress,
      assignedPerson: undefined, // デフォルトでは担当者を割り当てない
      subTasks,
      orderIndex: sheetTask.displayOrder, // スプレッドシートのB列番号を使用
    }
  })
}
