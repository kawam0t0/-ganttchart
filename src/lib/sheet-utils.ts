import type { Task, SubTask } from "./types"

export interface SheetTask {
  category: string
  displayOrder: number // 新規追加：表示順番号
  mainTask: string
  subTasks: { id: string; name: string; completed: boolean }[]
  period: number
  fromOpen: number
}

export function convertSheetTasksToGanttTasks(sheetTasks: SheetTask[], openDate: Date, people: any[]): Task[] {
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
      id: `sheet-task-${index}`,
      name: sheetTask.mainTask,
      startDate,
      endDate,
      progress,
      assignedPerson: people.length > 0 ? people[index % people.length] : undefined,
      subTasks,
      orderIndex: sheetTask.displayOrder, // スプレッドシートのB列番号を使用
    }
  })
}

export function filterTasksByCategory(tasks: Task[], category: string): Task[] {
  // カテゴリー名のマッピング
  const categoryMap: { [key: string]: string } = {
    連絡系: "連絡系",
    販促物・備品系: "販促物・備品系",
    通信系: "通信系",
    プロモーション系: "プロモーション系",
    求人系: "求人系",
    研修系: "研修系",
    その他: "その他",
  }

  return tasks.filter((task) => {
    // ここでは簡単な実装として、タスク名やIDからカテゴリーを判定
    // 実際の実装では、sheetTasksのcategoryフィールドを使用
    return categoryMap[category] === category
  })
}
