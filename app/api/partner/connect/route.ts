import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const db = await getDb()

    // Find partner by email
    const partner = await db.collection("users").findOne({ email })

    if (!partner) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 })
    }

    if (partner._id.toString() === user._id) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 })
    }

    // Update both users with the partner connection
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(user._id) }, { $set: { accountabilityPartnerId: partner._id.toString() } })

    await db.collection("users").updateOne({ _id: partner._id }, { $set: { accountabilityPartnerId: user._id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Connect partner error:", error)
    return NextResponse.json({ error: "Failed to connect partner" }, { status: 500 })
  }
}
