"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

interface ToastNotificationProps {
  message: string
  linkText?: string
  linkHref?: string
}

export function ToastNotification({ message, linkText, linkHref }: ToastNotificationProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-6 py-3 text-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{message}</span>
        {linkText && linkHref && (
          <Link href={linkHref} className="text-primary hover:underline text-sm font-medium">
            {linkText}
          </Link>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
