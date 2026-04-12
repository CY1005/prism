"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { globalSearch } from "@/actions/search"
import { type SearchResultItem } from "@/services/search"
import { cn } from "@/lib/utils"

const projectColorMap: Record<string, string> = {
  "AI云平台": "border-blue-200 text-blue-700 bg-blue-50",
  "AI云平台竞品分析": "border-blue-200 text-blue-700 bg-blue-50",
  "OpenClaw": "border-green-200 text-green-700 bg-green-50",
  "MappingStudio": "border-purple-200 text-purple-700 bg-purple-50",
  "Prism": "border-orange-200 text-orange-700 bg-orange-50",
}

function getProjectBadgeClass(name: string | null): string {
  if (!name) return ""
  return projectColorMap[name] || "border-gray-200 text-gray-700 bg-gray-50"
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="bg-yellow-100 px-0.5 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function GlobalSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    const result = await globalSearch(q.trim(), { limit: 5 })
    setLoading(false)
    if (result.success) {
      setResults(result.data.results)
      setOpen(result.data.results.length > 0)
    } else {
      setResults([])
      setOpen(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(value), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleResultClick = (item: SearchResultItem) => {
    setOpen(false)
    if (item.project_id && item.node_id) {
      router.push(`/projects/${item.project_id}/features/${item.node_id}`)
    } else if (item.project_id) {
      router.push(`/projects/${item.project_id}`)
    }
  }

  return (
    <div ref={containerRef} className="relative w-80">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        className="pl-9"
        placeholder="搜索功能、模块、问题..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setOpen(true)
        }}
      />

      {open && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 border shadow-lg overflow-hidden">
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">搜索中...</div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border/40 last:border-b-0"
                  onClick={() => handleResultClick(item)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.project_name && (
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", getProjectBadgeClass(item.project_name))}
                      >
                        {item.project_name}
                      </Badge>
                    )}
                    <span className="text-sm font-medium text-primary truncate">
                      {highlightKeyword(item.title, query)}
                    </span>
                  </div>
                  {item.breadcrumb && item.breadcrumb.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.breadcrumb.join(" → ")}
                    </p>
                  )}
                  {item.content_snippet && (
                    <p className="text-xs text-foreground/70 mt-1 line-clamp-1">
                      {highlightKeyword(item.content_snippet, query)}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
          <button
            className="w-full px-4 py-2.5 text-sm text-primary hover:bg-accent transition-colors border-t border-border text-center font-medium"
            onClick={() => {
              setOpen(false)
              router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            }}
          >
            查看全部结果
          </button>
        </Card>
      )}
    </div>
  )
}
