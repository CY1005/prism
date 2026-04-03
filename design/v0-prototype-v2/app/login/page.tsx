"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const loginStrings = {
  welcome: "\u6b22\u8fce\u56de\u6765",
  email: "\u90ae\u7bb1",
  password: "\u5bc6\u7801",
  login: "\u767b\u5f55",
  noAccount: "\u6ca1\u6709\u8d26\u53f7\uff1f",
  register: "\u6ce8\u518c",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <h1 className="text-2xl font-bold text-foreground">Prism</h1>
            <p className="text-sm text-muted-foreground">{loginStrings.welcome}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {loginStrings.email}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {loginStrings.password}
              </Label>
              <Input
                id="password"
                type="password"
                className="w-full"
              />
            </div>
            <Button className="w-full" variant="default" asChild>
              <Link href="/projects">{loginStrings.login}</Link>
            </Button>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {loginStrings.noAccount}{" "}
          <a href="#" className="text-primary hover:underline">
            {loginStrings.register}
          </a>
        </p>
      </div>
    </div>
  )
}
