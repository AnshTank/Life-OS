"use client"

import type { User } from "@/lib/auth"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Calendar, Target, CheckSquare, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  user: User
  currentDate: Date
}

export function DashboardHeader({ user, currentDate }: DashboardHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const greeting = format(currentDate, "EEEE, MMMM d")
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-balance">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">{greeting}</p>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/goals">
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tasks
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/progress">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Progress
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner">
                  <Users className="h-4 w-4 mr-2" />
                  Partner
                </Link>
              </Button>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
