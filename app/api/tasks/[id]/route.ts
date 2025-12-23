import { NextResponse, type NextRequest } from "next/server"
import { ANSH_USER_ID } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const db = await getDb()
    await db.collection("tasks").updateOne(
      { _id: new ObjectId(id), userId: ANSH_USER_ID },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update task error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
