import { NextResponse } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import type { LifeArea } from "@/lib/db-types"

export async function GET() {
  try {
    const db = await getDb()

    // Aggregate tasks by life area
    const pipeline = [
      { $match: { userId: ANSH_USER_ID } },
      {
        $group: {
          _id: "$lifeArea",
          activeTasks: {
            $sum: {
              $cond: [{ $in: ["$status", ["todo", "in-progress"]] }, 1, 0],
            },
          },
          completedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          totalTasks: { $sum: 1 },
        },
      },
    ]

    const results = await db.collection("tasks").aggregate(pipeline).toArray()

    const areas = results
      .filter((r) => r.activeTasks > 0)
      .map((r) => ({
        area: r._id as LifeArea,
        activeTasks: r.activeTasks,
        completionRate: r.totalTasks > 0 ? (r.completedTasks / r.totalTasks) * 100 : 0,
      }))
      .sort((a, b) => b.activeTasks - a.activeTasks)

    return NextResponse.json({ areas })
  } catch (error) {
    console.error("[v0] Life areas error:", error)
    return NextResponse.json({ error: "Failed to load life areas" }, { status: 500 })
  }
}
