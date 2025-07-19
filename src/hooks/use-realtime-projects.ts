"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Project } from "@/lib/types"

export function useRealtimeProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // プロジェクトを取得
  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) throw error

      const formattedProjects: Project[] = (data as any[]).map((project: any) => ({
        id: project.id,
        name: project.name,
        openDate: project.open_date ? new Date(project.open_date) : undefined,
      }))

      setProjects(formattedProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // プロジェクトを追加
  const addProject = async (name: string) => {
    try {
      const { data, error } = await supabase.from("projects").insert([{ name }]).select().single()

      if (error) throw error

      // 楽観的更新は不要（リアルタイム購読で自動更新される）
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project")
      throw err
    }
  }

  // プロジェクトを更新
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name) updateData.name = updates.name
      if (updates.openDate) updateData.open_date = updates.openDate.toISOString()

      const { error } = await supabase.from("projects").update(updateData).eq("id", id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project")
      throw err
    }
  }

  // プロジェクトを削除
  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project")
      throw err
    }
  }

  useEffect(() => {
    // 初期データ取得
    fetchProjects()

    // リアルタイム購読設定
    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        (payload: any) => {
          console.log("Project change received:", payload)

          if (payload.eventType === "INSERT") {
            const newProject: Project = {
              id: (payload.new as any).id,
              name: (payload.new as any).name,
              openDate: (payload.new as any).open_date ? new Date((payload.new as any).open_date) : undefined,
            }
            setProjects((prev) => [newProject, ...prev])
          } else if (payload.eventType === "UPDATE") {
            const updatedProject: Project = {
              id: (payload.new as any).id,
              name: (payload.new as any).name,
              openDate: (payload.new as any).open_date ? new Date((payload.new as any).open_date) : undefined,
            }
            setProjects((prev) =>
              prev.map((project) => (project.id === (payload.new as any).id ? updatedProject : project)),
            )
          } else if (payload.eventType === "DELETE") {
            setProjects((prev) => prev.filter((project) => project.id !== (payload.old as any).id))
          }
        },
      )
      .subscribe()

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  }
}
