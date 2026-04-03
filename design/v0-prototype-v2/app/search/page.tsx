"use client"

import Link from "next/link"
import { Search, Bell, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { searchStrings, searchResults } from "@/lib/search-data"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            defaultValue={"\u62fc\u5361"}
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">{searchStrings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{searchStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex gap-6 p-6">
        <div className="w-[220px] space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">{searchStrings.productLine}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="private-cloud" defaultChecked />
                <label htmlFor="private-cloud" className="text-sm">{searchStrings.privateCloud}</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="smart-computing" />
                <label htmlFor="smart-computing" className="text-sm">{searchStrings.smartComputing}</label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">{searchStrings.moduleLabel}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="inference" defaultChecked />
                <label htmlFor="inference" className="text-sm">{searchStrings.inferenceService}</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="training" />
                <label htmlFor="training" className="text-sm">{searchStrings.trainingService}</label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">{searchStrings.dimensionType}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="experience" defaultChecked />
                <label htmlFor="experience" className="text-sm">{searchStrings.engineeringExp}</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="tech" defaultChecked />
                <label htmlFor="tech" className="text-sm">{searchStrings.techImpl}</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="decision" />
                <label htmlFor="decision" className="text-sm">{searchStrings.designDecision}</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">{searchStrings.resultsFound}</p>

          {searchResults.map((result, index) => (
            <Card key={index} className="border-border/60 p-4 shadow-sm">
              <Link href="/" className="text-sm font-medium text-primary cursor-pointer hover:underline">{result.title}</Link>
              <p className="text-xs text-muted-foreground">{result.path}</p>
              <p className="text-sm mt-2">
                {result.textBefore}<mark className="bg-yellow-100 px-0.5 rounded">{result.highlight}</mark>{result.textAfter}
              </p>
              <Badge variant="secondary" className="mt-2">{result.badge}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
