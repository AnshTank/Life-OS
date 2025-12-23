import { NextResponse, type NextRequest } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const lifeArea = searchParams.get("lifeArea")
    const sortBy = searchParams.get("sortBy") || "priority"

    const db = await getDb()

    // Build query
    const query: any = { userId: ANSH_USER_ID }
    if (status && status !== "all") {
      query.status = status
    }
    if (lifeArea && lifeArea !== "all") {
      query.lifeArea = lifeArea
    }

    // Build sort
    let sort: any = {}
    switch (sortBy) {
      case "impact":
        sort = { impact: -1 }
        break
      case "urgency":
        sort = { urgency: -1 }
        break
      case "effort":
        sort = { effort: 1 } // Low effort first
        break
      case "dueDate":
        sort = { dueDate: 1 }
        break
      default:
        sort = { priorityScore: -1 } // Default to priority
    }

    const tasks = await db.collection("tasks").find(query).sort(sort).toArray()

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[v0] Get tasks error:", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, lifeArea, goalId, impact, urgency, effort, priorityScore, dueDate, scheduledFor } = body

    const db = await getDb()
    const result = await db.collection("tasks").insertOne({
      userId: ANSH_USER_ID,
      title,
      description,
      lifeArea,
      goalId,
      impact: impact || 5,
      urgency: urgency || 5,
      effort: effort || 5,
      priorityScore: priorityScore || 0,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      status: "todo",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, taskId: result.insertedId })
  } catch (error) {
    console.error("[v0] Create task error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
