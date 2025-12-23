import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { subDays, format, startOfDay, endOfDay } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID required" }, { status: 400 })
    }

    const db = await getDb()

    // Get last 7 days of data for both users
    const data = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayStr = format(date, "EEE")

      // User's tasks
      const userTasks = await db
        .collection("tasks")
        .find({
          userId: user._id,
          createdAt: {
            $gte: startOfDay(date),
            $lte: endOfDay(date),
          },
        })
        .toArray()

      // Partner's tasks
      const partnerTasks = await db
        .collection("tasks")
        .find({
          userId: partnerId,
          createdAt: {
            $gte: startOfDay(date),
            $lte: endOfDay(date),
          },
        })
        .toArray()

      const userCompleted = userTasks.filter((t) => t.status === "completed").length
      const partnerCompleted = partnerTasks.filter((t) => t.status === "completed").length

      data.push({
        day: dayStr,
        you: userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0,
        partner: partnerTasks.length > 0 ? Math.round((partnerCompleted / partnerTasks.length) * 100) : 0,
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Partner progress error:", error)
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 })
  }
}
