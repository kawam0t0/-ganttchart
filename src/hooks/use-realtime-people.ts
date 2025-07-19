"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Person } from "@/lib/types"

export function useRealtimePeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 担当者を取得
  const fetchPeople = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("people").select("*").order("created_at", { ascending: true })

      if (error) throw error

      const formattedPeople: Person[] = (data as any[]).map((person: any) => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        color: `${person.bg_color.replace("bg-", "bg-").replace("-600", "-100")} border-${person.bg_color.replace("bg-", "").replace("-600", "-200")} text-${person.bg_color.replace("bg-", "").replace("-600", "-800")}`,
        bgColor: person.bg_color,
        textColor: person.text_color,
      }))

      setPeople(formattedPeople)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // 担当者を追加
  const addPerson = async (firstName: string, lastName: string) => {
    try {
      const { data, error } = await supabase
        .from("people")
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            bg_color: "bg-blue-600",
            text_color: "text-blue-700",
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add person")
      throw err
    }
  }

  // 担当者を更新
  const updatePerson = async (id: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase
        .from("people")
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update person")
      throw err
    }
  }

  // 担当者を削除
  const deletePerson = async (id: string) => {
    try {
      const { error } = await supabase.from("people").delete().eq("id", id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete person")
      throw err
    }
  }

  useEffect(() => {
    // 初期データ取得
    fetchPeople()

    // リアルタイム購読設定
    const channel = supabase
      .channel("people-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "people",
        },
        (payload: any) => {
          console.log("Person change received:", payload)

          if (payload.eventType === "INSERT") {
            const newPerson: Person = {
              id: (payload.new as any).id,
              firstName: (payload.new as any).first_name,
              lastName: (payload.new as any).last_name,
              color: `${(payload.new as any).bg_color.replace("bg-", "bg-").replace("-600", "-100")} border-${(payload.new as any).bg_color.replace("bg-", "").replace("-600", "-200")} text-${(payload.new as any).bg_color.replace("bg-", "").replace("-600", "-800")}`,
              bgColor: (payload.new as any).bg_color,
              textColor: (payload.new as any).text_color,
            }
            setPeople((prev) => [...prev, newPerson])
          } else if (payload.eventType === "UPDATE") {
            const updatedPerson: Person = {
              id: (payload.new as any).id,
              firstName: (payload.new as any).first_name,
              lastName: (payload.new as any).last_name,
              color: `${(payload.new as any).bg_color.replace("bg-", "bg-").replace("-600", "-100")} border-${(payload.new as any).bg_color.replace("bg-", "").replace("-600", "-200")} text-${(payload.new as any).bg_color.replace("bg-", "").replace("-600", "-800")}`,
              bgColor: (payload.new as any).bg_color,
              textColor: (payload.new as any).text_color,
            }
            setPeople((prev) => prev.map((person) => (person.id === (payload.new as any).id ? updatedPerson : person)))
          } else if (payload.eventType === "DELETE") {
            setPeople((prev) => prev.filter((person) => person.id !== (payload.old as any).id))
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
    people,
    loading,
    error,
    addPerson,
    updatePerson,
    deletePerson,
    refetch: fetchPeople,
  }
}
