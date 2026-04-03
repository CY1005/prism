"use client"

import Link from "next/link"
import { Users, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminUsers, adminStrings } from "@/lib/admin-data"

export default function AdminPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-[220px] bg-sidebar border-r border-sidebar-border">
        <div className="p-4">
          <Link href="/projects" className="text-lg font-semibold text-sidebar-foreground hover:text-primary transition-colors">
            {adminStrings.title}
          </Link>
        </div>
        <Separator />
        <nav className="p-2 space-y-1">
          <Button variant="ghost" className="w-full justify-start bg-sidebar-accent">
            <Users className="h-4 w-4 mr-2" />
            {adminStrings.userManagement}
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            {adminStrings.platformStats}
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            {adminStrings.globalConfig}
          </Button>
        </nav>
      </div>

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">{adminStrings.userManagement}</h1>
          <Badge variant="secondary">{adminStrings.totalUsers}</Badge>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12">{adminStrings.avatar}</TableHead>
                <TableHead>{adminStrings.username}</TableHead>
                <TableHead>{adminStrings.email}</TableHead>
                <TableHead>{adminStrings.registerTime}</TableHead>
                <TableHead>{adminStrings.status}</TableHead>
                <TableHead className="w-20">{adminStrings.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-sm">{user.initials}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.date}</TableCell>
                  <TableCell>
                    {user.statusColor === "green" ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{user.status}</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{user.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {user.status === adminStrings.normal ? adminStrings.disable : adminStrings.enable}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
