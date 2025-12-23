import { NextResponse } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET() {
  try {
    const db = await getDb()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const tasks = await db
        .collection("tasks")
        .find({
          userId: ANSH_USER_ID,
          createdAt: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        })
        .toArray()

      const completed = tasks.filter((t) => t.status === "completed")
      const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0
      const averageImpact =
        completed.length > 0 ? completed.reduce((sum, t) => sum + (t.impact || 0), 0) / completed.length : 0

      const lifeAreaBreakdown = Object.entries(
        completed.reduce(
          (acc, task) => {
            acc[task.lifeArea] = (acc[task.lifeArea] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      ).map(([area, count]) => ({ area, count }))

      months.push({
        month: format(date, "MMM yyyy"),
        tasksCompleted: completed.length,
        completionRate,
        averageImpact,
        lifeAreaBreakdown,
      })
    }

    return NextResponse.json({ months })
  } catch (error) {
    console.error("[v0] Monthly progress error:", error)
    return NextResponse.json({ error: "Failed to load monthly progress" }, { status: 500 })
  }
}
