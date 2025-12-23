import { NextResponse } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { startOfDay, endOfDay, subDays } from "date-fns"

export async function GET() {
  try {
    const db = await getDb()
    const today = new Date()

    // Today's tasks
    const todayTasks = await db
      .collection("tasks")
      .find({
        userId: ANSH_USER_ID,
        createdAt: {
          $gte: startOfDay(today),
          $lte: endOfDay(today),
        },
      })
      .toArray()

    const todayCompleted = todayTasks.filter((t) => t.status === "completed").length
    const todayTotal = todayTasks.length

    // Week streak - days with at least 1 completed task in last 7 days
    const weekAgo = subDays(today, 7)
    const weekTasks = await db
      .collection("tasks")
      .find({
        userId: ANSH_USER_ID,
        status: "completed",
        completedAt: { $gte: weekAgo },
      })
      .toArray()

    const uniqueDays = new Set(weekTasks.map((t) => startOfDay(new Date(t.completedAt || t.updatedAt)).toISOString()))
    const weekStreak = uniqueDays.size

    // Average impact score from completed tasks this week
    const impactScores = weekTasks.map((t) => t.impact || 0)
    const impactScore = impactScores.length > 0 ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length : 0

    return NextResponse.json({
      todayCompleted,
      todayTotal,
      weekStreak,
      impactScore,
    })
  } catch (error) {
    console.error("[v0] Quick stats error:", error)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
