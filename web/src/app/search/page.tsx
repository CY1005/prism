"use client"

import Link from "next/link"
import { useState } from "react"
import { Search, Bell, LogOut, AlertTriangle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { searchUnified, type SearchResultItem } from "@/services/search"

const typeColorMap: Record<string, string> = {
  node: "border-blue-200 text-blue-700 bg-blue-50",
  dimension: "border-green-200 text-green-700 bg-green-50",
  knowledge: "border-purple-200 text-purple-700 bg-purple-50",
}

const typeLabel: Record<string, string> = {
  node: "功能模块",
  dimension: "维度记录",
  knowledge: "知识条目",
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [total, setTotal] = useState(0)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    const result = await searchUnified(query.trim())

    setLoading(false)
    if (result.ok) {
      setResults(result.data.results)
      setTotal(result.data.total)
      setSearched(true)
    } else {
      setError(result.error)
      setSearched(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索功能模块、维度记录、知识条目..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">陈</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">陈琦</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Search button */}
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={!query.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            搜索
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive/60 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          </Card>
        )}

        {/* Results */}
        {searched && !error && (
          <>
            <p className="text-sm text-muted-foreground">
              找到 {total} 条结果
            </p>

            {results.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>未找到相关内容，试试其他关键词</p>
              </div>
            ) : (
              results.map((result) => (
                <Card key={result.id} className="border-border/60 p-4 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {result.project_name && (
                      <Badge variant="outline" className="text-xs">
                        {result.project_name}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-xs ${typeColorMap[result.type] || ""}`}>
                      {typeLabel[result.type] || result.type}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {result.title}
                    </span>
                  </div>
                  {result.node_path && (
                    <p className="text-xs text-muted-foreground">{result.node_path}</p>
                  )}
                  <p className="text-sm mt-2 text-foreground/80">{result.content_snippet}</p>
                  {result.dimension_type && (
                    <Badge variant="secondary" className="mt-2 text-xs">{result.dimension_type}</Badge>
                  )}
                </Card>
              ))
            )}
          </>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>输入关键词搜索跨项目的功能模块、维度记录和知识条目</p>
          </div>
        )}
      </div>
    </div>
  )
}
