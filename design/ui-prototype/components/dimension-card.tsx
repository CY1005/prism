"use client"

import { useState } from "react"
import { ChevronDown, Plus, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface DimensionCardProps {
  title: string
  icon: LucideIcon
  entryCount: number
  collapsedSummary?: string
  defaultExpanded?: boolean
  onAdd?: () => void
  children: React.ReactNode
}

export function DimensionCard({
  title,
  icon: Icon,
  entryCount,
  collapsedSummary,
  defaultExpanded = false,
  onAdd,
  children,
}: DimensionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded)

  return (
    <Card className="border-border/60 shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">{title}</h3>
              <Badge variant="secondary" className="text-xs">
                {entryCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onAdd && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={onAdd}
                >
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {!isOpen && collapsedSummary && (
            <p className="mt-2 text-sm text-muted-foreground pl-11">
              {collapsedSummary}
            </p>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
