import { NextResponse, type NextRequest } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { startOfDay, endOfDay, format, subDays } from "date-fns"

export async function GET() {
  try {
    const db = await getDb()
    const today = new Date()

    // Get last 7 days of logs
    const logs = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStr = format(date, "yyyy-MM-dd")

      const tasks = await db
        .collection("tasks")
        .find({
          userId: ANSH_USER_ID,
          createdAt: {
            $gte: startOfDay(date),
            $lte: endOfDay(date),
          },
        })
        .toArray()

      logs.push({
        date: dateStr,
        tasksCompleted: tasks.filter((t) => t.status === "completed").length,
        tasksTotal: tasks.length,
      })
    }

    // Get today's log entry
    const todayLog = await db.collection("daily_logs").findOne({
      userId: ANSH_USER_ID,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
    })

    return NextResponse.json({ logs, today: todayLog })
  } catch (error) {
    console.error("[v0] Daily progress error:", error)
    return NextResponse.json({ error: "Failed to load daily progress" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mood, productivity, notes } = body

    const db = await getDb()
    const today = new Date()

    await db.collection("daily_logs").updateOne(
      {
        userId: ANSH_USER_ID,
        date: {
          $gte: startOfDay(today),
          $lte: endOfDay(today),
        },
      },
      {
        $set: {
          mood,
          productivity,
          notes,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: ANSH_USER_ID,
          date: today,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Save daily log error:", error)
    return NextResponse.json({ error: "Failed to save daily log" }, { status: 500 })
  }
}
