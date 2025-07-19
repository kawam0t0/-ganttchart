// プロジェクトで使用する型定義
export interface Person {
  id: string
  firstName: string
  lastName: string
  color: string
  bgColor: string // 背景色を追加
  textColor: string // テキスト色を追加
}

export interface Project {
  id: string
  name: string
  assignedPerson?: Person
  openDate?: Date // 洗車場OPEN日を追加
}

export interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  assignedPerson?: Person
  subTasks?: SubTask[]
}

export interface SubTask {
  id: string
  name: string
  completed: boolean
  // assignedPerson?: Person を削除
}

// 担当者用のカラーパレット（背景色、テキスト色、境界色のセット）
export const personColors = [
  {
    bgColor: "bg-blue-600",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    lightBg: "bg-blue-100",
  },
  {
    bgColor: "bg-indigo-600",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-300",
    lightBg: "bg-indigo-100",
  },
  {
    bgColor: "bg-purple-600",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
    lightBg: "bg-purple-100",
  },
  {
    bgColor: "bg-pink-600",
    textColor: "text-pink-700",
    borderColor: "border-pink-300",
    lightBg: "bg-pink-100",
  },
  {
    bgColor: "bg-red-600",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    lightBg: "bg-red-100",
  },
  {
    bgColor: "bg-orange-600",
    textColor: "text-orange-700",
    borderColor: "border-orange-300",
    lightBg: "bg-orange-100",
  },
  {
    bgColor: "bg-amber-600",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    lightBg: "bg-amber-100",
  },
  {
    bgColor: "bg-yellow-600",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    lightBg: "bg-yellow-100",
  },
  {
    bgColor: "bg-lime-600",
    textColor: "text-lime-700",
    borderColor: "border-lime-300",
    lightBg: "bg-lime-100",
  },
  {
    bgColor: "bg-green-600",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    lightBg: "bg-green-100",
  },
  {
    bgColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
    lightBg: "bg-emerald-100",
  },
  {
    bgColor: "bg-teal-600",
    textColor: "text-teal-700",
    borderColor: "border-teal-300",
    lightBg: "bg-teal-100",
  },
  {
    bgColor: "bg-cyan-600",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-300",
    lightBg: "bg-cyan-100",
  },
  {
    bgColor: "bg-sky-600",
    textColor: "text-sky-700",
    borderColor: "border-sky-300",
    lightBg: "bg-sky-100",
  },
]

// パステルカラーの定義（後方互換性のため残す）
export const pastelColors = [
  "bg-pink-100 border-pink-200 text-pink-800",
  "bg-blue-100 border-blue-200 text-blue-800",
  "bg-green-100 border-green-200 text-green-800",
  "bg-yellow-100 border-yellow-200 text-yellow-800",
  "bg-purple-100 border-purple-200 text-purple-800",
  "bg-indigo-100 border-indigo-200 text-indigo-800",
  "bg-red-100 border-red-200 text-red-800",
  "bg-orange-100 border-orange-200 text-orange-800",
  "bg-teal-100 border-teal-200 text-teal-800",
  "bg-cyan-100 border-cyan-200 text-cyan-800",
  "bg-lime-100 border-lime-200 text-lime-800",
  "bg-emerald-100 border-emerald-200 text-emerald-800",
]
