"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface VersionNode {
  version: string
  label?: string
  summary: string
  details?: string
  isCurrent?: boolean
}

interface VersionTimelineProps {
  versions: VersionNode[]
}

export function VersionTimeline({ versions }: VersionTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev)
      if (next.has(version)) {
        next.delete(version)
      } else {
        next.add(version)
      }
      return next
    })
  }

  return (
    <div className="relative space-y-0">
      {versions.map((node, index) => {
        const isExpanded = expandedVersions.has(node.version)
        const isLast = index === versions.length - 1

        return (
          <div key={node.version} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "h-3 w-3 rounded-full border-2 shrink-0 z-10",
                  node.isCurrent
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40 bg-background"
                )}
              />
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <Collapsible
                open={isExpanded}
                onOpenChange={() => node.details && toggleVersion(node.version)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-sm font-medium",
                        node.isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {node.version}
                    </span>
                    {node.label && (
                      <Badge
                        variant={node.isCurrent ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {node.label}
                      </Badge>
                    )}
                  </div>
                  {node.details && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mt-0.5">
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{node.summary}</p>
                <CollapsibleContent>
                  {node.details && (
                    <p className="mt-2 text-sm text-muted-foreground/80 bg-muted/50 p-3 rounded-md">
                      {node.details}
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        )
      })}
    </div>
  )
}
