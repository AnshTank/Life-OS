import { NextResponse, type NextRequest } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const goals = await db.collection("goals").find({ userId: ANSH_USER_ID }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ goals })
  } catch (error) {
    console.error("[v0] Get goals error:", error)
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, lifeArea, targetDate, impact, sharedWithPartner } = body

    const db = await getDb()
    const result = await db.collection("goals").insertOne({
      userId: ANSH_USER_ID,
      title,
      description,
      lifeArea,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status: "active",
      impact: impact || 5,
      sharedWithPartner: sharedWithPartner || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, goalId: result.insertedId })
  } catch (error) {
    console.error("[v0] Create goal error:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}
