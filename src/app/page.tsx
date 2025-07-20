"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Users,
  Edit3,
  User,
  FolderPlus,
  Trash2,
  Flag,
  Settings,
  Home,
  BarChart3,
  Bell,
  Search,
  Mail,
  Phone,
  Clock,
} from "lucide-react"
import type { Person, Project } from "@/lib/types"
import { useSheetTasks } from "@/hooks/use-sheet-tasks"

// Import category components
import { CommunicationGantt } from "@/components/gantt/categories/communication"
import { PromotionGantt } from "@/components/gantt/categories/promotion"
import { NetworkGantt } from "@/components/gantt/categories/network"
import { MarketingGantt } from "@/components/gantt/categories/marketing"
import { RecruitmentGantt } from "@/components/gantt/categories/recruitment"
import { TrainingGantt } from "@/components/gantt/categories/training"
import { OthersGantt } from "@/components/gantt/categories/others"

// Header Component
function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-md border-b border-blue-500/50 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Spchart</h1>
              <p className="text-sm text-blue-100">洗車場プロジェクト管理</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant="ghost"
              className="text-blue-100 hover:text-white hover:bg-blue-500/50 transition-all duration-200"
            >
              <Home className="h-4 w-4 mr-2" />
              ホーム
            </Button>
            <Button
              variant="ghost"
              className="text-blue-100 hover:text-white hover:bg-blue-500/50 transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              プロジェクト
            </Button>
            <Button
              variant="ghost"
              className="text-blue-100 hover:text-white hover:bg-blue-500/50 transition-all duration-200"
            >
              <Users className="h-4 w-4 mr-2" />
              チーム
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-100 hover:text-white hover:bg-blue-500/50 rounded-xl transition-all duration-200"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-100 hover:text-white hover:bg-blue-500/50 rounded-xl transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="w-full bg-white/80 backdrop-blur-md border-t border-blue-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Spchart
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              洗車場開発プロジェクトを効率的に管理するためのプロジェクト管理システムです。
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">クイックリンク</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                プロジェクト一覧
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                担当者管理
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                ガントチャート
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                レポート
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">サポート</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                ヘルプセンター
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                使い方ガイド
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                お問い合わせ
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                FAQ
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">お問い合わせ</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>support@spchart.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>03-1234-5678</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>平日 9:00-18:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200/50 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2024 Spchart. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                プライバシーポリシー
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                利用規約
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                セキュリティ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Sidebar Navigation Component
function SidebarNav() {
  return (
    <div className="fixed right-0 top-0 h-full w-20 bg-white/80 backdrop-blur-md border-l border-blue-200/50 flex flex-col items-center py-8 z-40 shadow-lg">
      <div className="flex flex-col gap-6">
        <button className="w-12 h-12 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-300 shadow-sm hover:shadow-md">
          <Home className="h-5 w-5" />
        </button>
        <button className="w-12 h-12 bg-gray-100/50 hover:bg-blue-100/50 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md">
          <BarChart3 className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-auto">
        <div className="text-xs text-gray-400 writing-mode-vertical-rl text-orientation-mixed">Manage</div>
      </div>
    </div>
  )
}

interface ProjectDetailViewProps {
  project: Project
  onBack: () => void
  onUpdateProject: (project: Project) => void
  people: Person[]
}

function ProjectDetailView({ project, onBack, onUpdateProject, people }: ProjectDetailViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [openDateInput, setOpenDateInput] = useState(
    project.openDate ? project.openDate.toISOString().split("T")[0] : "",
  )

  const categories = ["連絡系", "販促物備品系", "通信系", "プロモーション系", "求人系", "研修系", "その他"]

  const handleUpdateOpenDate = () => {
    if (openDateInput) {
      const updatedProject = {
        ...project,
        openDate: new Date(openDateInput),
      }
      onUpdateProject(updatedProject)
      setIsSettingsOpen(false)
    }
  }

  // Render appropriate gantt chart based on selected category
  if (selectedCategory) {
    const commonProps = {
      project,
      people,
      onBack: () => setSelectedCategory(null),
    }

    switch (selectedCategory) {
      case "連絡系":
        return <CommunicationGantt {...commonProps} />
      case "販促物備品系":
        return <PromotionGantt {...commonProps} />
      case "通信系":
        return <NetworkGantt {...commonProps} />
      case "プロモーション系":
        return <MarketingGantt {...commonProps} />
      case "求人系":
        return <RecruitmentGantt {...commonProps} />
      case "研修系":
        return <TrainingGantt {...commonProps} />
      case "その他":
        return <OthersGantt {...commonProps} />
      default:
        return <OthersGantt {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <Header />
      <SidebarNav />

      <div className="relative z-10 pr-20 flex-1">
        <div className="w-full max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <Button
              onClick={onBack}
              variant="outline"
              className="px-6 py-3 bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              ← 戻る
            </Button>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="px-6 py-3 bg-green-500/10 backdrop-blur-md border-green-300/50 text-green-700 hover:bg-green-500/20 hover:border-green-400 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  OPEN設定
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Flag className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-semibold text-gray-900">洗車場OPEN日設定</DialogTitle>
                      <p className="text-sm text-gray-500 mt-1">洗車場のオープン予定日を設定してください</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="openDate" className="text-sm font-medium text-gray-700">
                      OPEN予定日 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="openDate"
                      type="date"
                      value={openDateInput}
                      onChange={(e) => setOpenDateInput(e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-green-500 rounded-xl"
                    />
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Flag className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">OPEN日設定について</p>
                        <p className="mt-1">
                          設定したOPEN日から4ヶ月前の日付からガントチャートが表示されます。各カテゴリーのガントチャートにOPEN日マーカーが表示されます。
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => setIsSettingsOpen(false)}
                      className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleUpdateOpenDate}
                      disabled={!openDateInput}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      設定
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Project Title with OPEN Date */}
          <div className="text-center mb-16">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-fade-in">
              {project.name}
            </h1>
            {project.openDate && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Flag className="h-6 w-6 text-red-500" />
                <span className="text-xl font-semibold text-red-600 bg-red-50/80 backdrop-blur-sm px-4 py-2 rounded-full">
                  洗車場OPEN予定: {project.openDate.getFullYear()}年{project.openDate.getMonth() + 1}月
                  {project.openDate.getDate()}日
                </span>
              </div>
            )}
            {!project.openDate && (
              <p className="text-gray-500 mb-4 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full inline-block">
                OPEN日を設定してガントチャートを最適化しましょう
              </p>
            )}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {categories.slice(0, 6).map((category, index) => (
              <Card
                key={category}
                className="h-32 bg-white/70 backdrop-blur-md border-blue-200/50 hover:bg-white/90 hover:border-blue-300/70 transition-all duration-500 hover:scale-105 cursor-pointer animate-fade-in-up shadow-lg hover:shadow-2xl rounded-2xl group"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="flex items-center justify-center h-full p-6">
                  <h3 className="text-lg font-semibold text-blue-700 text-center group-hover:text-blue-800 transition-colors duration-300">
                    {category}
                  </h3>
                </CardContent>
              </Card>
            ))}

            {/* その他 - Full width */}
            <div className="md:col-span-3 flex justify-center">
              <Card
                className="h-32 w-80 bg-white/70 backdrop-blur-md border-blue-200/50 hover:bg-white/90 hover:border-blue-300/70 transition-all duration-500 hover:scale-105 cursor-pointer animate-fade-in-up shadow-lg hover:shadow-2xl rounded-2xl group"
                style={{ animationDelay: `600ms` }}
                onClick={() => setSelectedCategory("その他")}
              >
                <CardContent className="flex items-center justify-center h-full p-6">
                  <h3 className="text-lg font-semibold text-blue-700 text-center group-hover:text-blue-800 transition-colors duration-300">
                    その他
                  </h3>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function ProjectManagementApp() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [people, setPeople] = useState<Person[]>([])
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [newPersonForm, setNewPersonForm] = useState({ firstName: "", lastName: "" })
  const [newProjectName, setNewProjectName] = useState("")

  const {
    tasks: sheetTasks,
    loading: tasksLoading,
    error: tasksError,
    refetch,
  } = useSheetTasks(selectedProject?.openDate, people)

  const handleAddPerson = () => {
    if (newPersonForm.firstName && newPersonForm.lastName) {
      // すべての担当者に青色を統一
      const newPerson: Person = {
        id: Date.now().toString(),
        firstName: newPersonForm.firstName,
        lastName: newPersonForm.lastName,
        color: "bg-blue-100 border-blue-200 text-blue-800", // 後方互換性のため
        bgColor: "bg-blue-600",
        textColor: "text-blue-700",
      }
      setPeople([...people, newPerson])
      setNewPersonForm({ firstName: "", lastName: "" })
      setIsAddPersonOpen(false)
    }
  }

  const handleEditPerson = () => {
    if (editingPerson && newPersonForm.firstName && newPersonForm.lastName) {
      setPeople(
        people.map((person) =>
          person.id === editingPerson.id
            ? { ...person, firstName: newPersonForm.firstName, lastName: newPersonForm.lastName }
            : person,
        ),
      )
      setNewPersonForm({ firstName: "", lastName: "" })
      setEditingPerson(null)
      setIsEditPersonOpen(false)
    }
  }

  const handleAddProject = () => {
    if (newProjectName) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
      }
      setProjects([...projects, newProject])
      setNewProjectName("")
      setIsAddProjectOpen(false)
    }
  }

  const handleDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id))
      setProjectToDelete(null)
      setIsDeleteProjectOpen(false)
    }
  }

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
    setSelectedProject(updatedProject)
    if (updatedProject.openDate) {
      refetch()
    }
  }

  const openEditPerson = (person: Person) => {
    setEditingPerson(person)
    setNewPersonForm({ firstName: person.firstName, lastName: person.lastName })
    setIsEditPersonOpen(true)
  }

  const openDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setIsDeleteProjectOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {selectedProject ? (
          // Project Detail View - Full Width
          <ProjectDetailView
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            onUpdateProject={handleUpdateProject}
            people={people}
          />
        ) : (
          // Main View - Centered
          <>
            <Header />
            <SidebarNav />
            <div className="flex-1 max-w-6xl mx-auto p-8 pr-28">
              {/* Header */}
              <div className="text-center mb-16">
                <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-fade-in">
                  Spchart
                </h1>
                <p className="text-xl text-gray-600 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full inline-block">
                  洗車場開発プロジェクト管理システム
                </p>
              </div>

              {/* Action Buttons and People List */}
              <div className="flex gap-12 mb-16">
                {/* Action Buttons */}
                <div className="flex flex-col gap-6 min-w-[300px]">
                  {/* Add Project Dialog */}
                  <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-16 text-lg bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <Plus className="mr-3 h-5 w-5" />
                        プロジェクトを追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                      <DialogHeader className="pb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FolderPlus className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                              新しい洗車場プロジェクトを追加
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">洗車場の名前を入力してください</p>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">
                            洗車場名 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="projectName"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="例: 太田新田洗車場"
                            className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddProjectOpen(false)}
                            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleAddProject}
                            disabled={!newProjectName.trim()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            追加
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Add Person Dialog */}
                  <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-16 text-lg bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <Users className="mr-3 h-5 w-5" />
                        担当者を追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                      <DialogHeader className="pb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                              新しい担当者を追加
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">担当者の姓名を入力してください</p>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                              姓 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="firstName"
                              value={newPersonForm.firstName}
                              onChange={(e) => setNewPersonForm({ ...newPersonForm, firstName: e.target.value })}
                              placeholder="田中"
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                              名 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="lastName"
                              value={newPersonForm.lastName}
                              onChange={(e) => setNewPersonForm({ ...newPersonForm, lastName: e.target.value })}
                              placeholder="太郎"
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <span>すべての担当者には青色が割り当てられます</span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddPersonOpen(false)}
                            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleAddPerson}
                            disabled={!newPersonForm.firstName.trim() || !newPersonForm.lastName.trim()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                          >
                            <User className="w-4 h-4 mr-2" />
                            追加
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Person Dialog */}
                  <Dialog open={isEditPersonOpen} onOpenChange={setIsEditPersonOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-16 text-lg bg-white/70 backdrop-blur-md border-blue-200/50 text-blue-700 hover:bg-white/90 hover:border-blue-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                        disabled={people.length === 0}
                      >
                        <Edit3 className="mr-3 h-5 w-5" />
                        担当者を編集
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                      <DialogHeader className="pb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Edit3 className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                              担当者を選択して編集
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">編集したい担当者を選択してください</p>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-4">
                        {people.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">担当者がいません</p>
                            <p className="text-sm text-gray-400 mt-1">まず担当者を追加してください</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {people.map((person) => (
                              <Button
                                key={person.id}
                                variant="outline"
                                className="w-full justify-start h-14 bg-white/70 backdrop-blur-sm border-gray-200/50 hover:bg-white/90 hover:border-blue-300 transition-all duration-200 rounded-xl"
                                onClick={() => openEditPerson(person)}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-6 h-6 rounded-full ${person.bgColor} flex items-center justify-center`}
                                  >
                                    <User className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-base font-medium">
                                    {person.firstName} {person.lastName}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Person Form Dialog */}
                  <Dialog open={editingPerson !== null} onOpenChange={(open) => !open && setEditingPerson(null)}>
                    <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                      <DialogHeader className="pb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Edit3 className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900">担当者情報を編集</DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">担当者の姓名を変更できます</p>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editFirstName" className="text-sm font-medium text-gray-700">
                              姓 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="editFirstName"
                              value={newPersonForm.firstName}
                              onChange={(e) => setNewPersonForm({ ...newPersonForm, firstName: e.target.value })}
                              placeholder="田中"
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editLastName" className="text-sm font-medium text-gray-700">
                              名 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="editLastName"
                              value={newPersonForm.lastName}
                              onChange={(e) => setNewPersonForm({ ...newPersonForm, lastName: e.target.value })}
                              placeholder="太郎"
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            />
                          </div>
                        </div>
                        {editingPerson && (
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                <User className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm text-gray-600">担当者の色: 青色で統一</span>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            onClick={() => setEditingPerson(null)}
                            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleEditPerson}
                            disabled={!newPersonForm.firstName.trim() || !newPersonForm.lastName.trim()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            更新
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* People List */}
                <div className="flex-1">
                  {people.length > 0 ? (
                    <div>
                      <h2 className="text-lg font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 inline-block">
                        登録済み担当者
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        {people.map((person, index) => (
                          <div
                            key={person.id}
                            className="flex items-center gap-3 p-2 bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-white/50"
                          >
                            <div className={`w-8 h-8 rounded-full ${person.bgColor} flex items-center justify-center`}>
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span className={`text-sm font-medium ${person.textColor}`}>
                              {person.firstName} {person.lastName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white/30 backdrop-blur-sm rounded-xl">
                      <div className="text-gray-400 mb-3">
                        <Users className="mx-auto h-8 w-8 mb-3" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">担当者がいません</h3>
                      <p className="text-xs text-gray-500">「担当者を追加」ボタンから新しい担当者を登録してください</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              {projects.length === 0 ? (
                <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl">
                  <div className="text-gray-400 mb-4">
                    <Plus className="mx-auto h-16 w-16 mb-4" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">洗車場プロジェクトがありません</h3>
                  <p className="text-gray-500">
                    「プロジェクトを追加」ボタンから新しい洗車場プロジェクトを作成してください
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project, index) => (
                    <Card
                      key={project.id}
                      className="h-40 bg-white/70 backdrop-blur-md border-blue-200/50 hover:bg-white/90 hover:border-blue-300/70 transition-all duration-500 hover:scale-105 cursor-pointer animate-fade-in-up relative group shadow-lg hover:shadow-2xl rounded-2xl"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full p-4 relative">
                        {/* Delete Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteProject(project)
                          }}
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="text-center" onClick={() => setSelectedProject(project)}>
                          <h3 className="text-lg font-semibold text-blue-700 mb-2">{project.name}</h3>
                          {project.openDate && (
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Flag className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600 font-medium bg-red-50/80 px-3 py-1 rounded-full">
                                OPEN: {project.openDate.getMonth() + 1}/{project.openDate.getDate()}
                              </span>
                            </div>
                          )}
                          {project.assignedPerson && (
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${project.assignedPerson.bgColor}`}></div>
                              <p className="text-sm text-gray-600">担当: {project.assignedPerson.firstName}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Delete Project Dialog */}
              <Dialog open={isDeleteProjectOpen} onOpenChange={setIsDeleteProjectOpen}>
                <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                  <DialogHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <Trash2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">プロジェクトを削除</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">この操作は取り消せません</p>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-6">
                    {projectToDelete && (
                      <div className="bg-red-50 p-4 rounded-xl">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">「{projectToDelete.name}」</span>を削除しようとしています。
                          このプロジェクトに関連するすべてのデータが削除されます。
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteProjectOpen(false)}
                        className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={handleDeleteProject}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        削除
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Footer />
          </>
        )}
      </div>
    </div>
  )
}
