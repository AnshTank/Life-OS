import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.accountabilityPartnerId) {
      return NextResponse.json({ error: "No partner connected" }, { status: 400 })
    }

    const db = await getDb()

    // Remove partner connection from both users
    await db.collection("users").updateOne({ _id: new ObjectId(user._id) }, { $unset: { accountabilityPartnerId: "" } })

    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(user.accountabilityPartnerId) }, { $unset: { accountabilityPartnerId: "" } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Disconnect partner error:", error)
    return NextResponse.json({ error: "Failed to disconnect partner" }, { status: 500 })
  }
}
