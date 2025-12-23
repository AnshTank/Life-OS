import { NextResponse } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { startOfYear, endOfYear } from "date-fns"

export async function GET() {
  try {
    const db = await getDb()
    const year = new Date().getFullYear()
    const yearStart = startOfYear(new Date())
    const yearEnd = endOfYear(new Date())

    const tasks = await db
      .collection("tasks")
      .find({
        userId: ANSH_USER_ID,
        createdAt: {
          $gte: yearStart,
          $lte: yearEnd,
        },
      })
      .toArray()

    const completed = tasks.filter((t) => t.status === "completed")
    const averageImpact =
      completed.length > 0 ? completed.reduce((sum, t) => sum + (t.impact || 0), 0) / completed.length : 0

    const lifeAreaCounts = completed.reduce(
      (acc, task) => {
        acc[task.lifeArea] = (acc[task.lifeArea] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topLifeAreas = Object.entries(lifeAreaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)

    const goalsCompleted = await db.collection("goals").countDocuments({
      userId: ANSH_USER_ID,
      status: "completed",
      updatedAt: {
        $gte: yearStart,
        $lte: yearEnd,
      },
    })

    return NextResponse.json({
      year,
      totalTasks: tasks.length,
      completedTasks: completed.length,
      averageImpact,
      topLifeAreas,
      goalsCompleted,
    })
  } catch (error) {
    console.error("[v0] Yearly progress error:", error)
    return NextResponse.json({ error: "Failed to load yearly progress" }, { status: 500 })
  }
}
