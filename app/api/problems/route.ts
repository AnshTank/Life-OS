import { NextResponse, type NextRequest } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const problems = await db
      .collection("problems")
      .find({ userId: ANSH_USER_ID })
      .sort({ priority: -1, createdAt: -1 })
      .toArray()

    return NextResponse.json({ problems })
  } catch (error) {
    console.error("[v0] Get problems error:", error)
    return NextResponse.json({ error: "Failed to load problems" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, lifeArea, priority } = body

    const db = await getDb()
    const result = await db.collection("problems").insertOne({
      userId: ANSH_USER_ID,
      title,
      description,
      lifeArea,
      priority: priority || "medium",
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, problemId: result.insertedId })
  } catch (error) {
    console.error("[v0] Create problem error:", error)
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 })
  }
}
