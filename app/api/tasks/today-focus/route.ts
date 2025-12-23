import { NextResponse } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()

    // Get top 3 tasks with highest priority score
    // Prioritize: high impact + moderate-high urgency + reasonable effort
    const tasks = await db
      .collection("tasks")
      .find({
        userId: ANSH_USER_ID,
        status: { $in: ["todo", "in-progress"] },
      })
      .sort({ priorityScore: -1 })
      .limit(3)
      .toArray()

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[v0] Today focus error:", error)
    return NextResponse.json({ error: "Failed to load focus tasks" }, { status: 500 })
  }
}
