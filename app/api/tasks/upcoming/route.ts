import { NextResponse } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()

    const tasks = await db
      .collection("tasks")
      .find({
        userId: ANSH_USER_ID,
        status: { $in: ["todo", "in-progress"] },
      })
      .sort({ priorityScore: -1, dueDate: 1 })
      .limit(10)
      .toArray()

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[v0] Upcoming tasks error:", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}
