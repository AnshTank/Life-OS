import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { startOfWeek, endOfWeek, subDays, startOfDay } from "date-fns"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Check if user has a partner
    if (!user.accountabilityPartnerId) {
      return NextResponse.json({ connected: false, sharedGoals: [] })
    }

    // Get partner details
    const partner = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.accountabilityPartnerId) }, { projection: { password: 0 } })

    if (!partner) {
      return NextResponse.json({ connected: false, sharedGoals: [] })
    }

    // Get partner's stats
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())

    const partnerTasks = await db
      .collection("tasks")
      .find({
        userId: partner._id.toString(),
        createdAt: { $gte: weekStart, $lte: weekEnd },
      })
      .toArray()

    const partnerCompleted = partnerTasks.filter((t) => t.status === "completed")
    const weeklyCompletion =
      partnerTasks.length > 0 ? Math.round((partnerCompleted.length / partnerTasks.length) * 100) : 0

    // Calculate streak
    let streak = 0
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i)
      const dayTasks = await db
        .collection("tasks")
        .find({
          userId: partner._id.toString(),
          completedAt: {
            $gte: startOfDay(date),
            $lte: new Date(startOfDay(date).getTime() + 86400000),
          },
        })
        .toArray()

      if (dayTasks.length > 0) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    // Get shared goals from both users
    const mySharedGoals = await db
      .collection("goals")
      .find({
        userId: user._id,
        sharedWithPartner: true,
        status: "active",
      })
      .toArray()

    const partnerSharedGoals = await db
      .collection("goals")
      .find({
        userId: partner._id.toString(),
        sharedWithPartner: true,
        status: "active",
      })
      .toArray()

    // Calculate progress for each goal
    const calculateProgress = async (goalId: string, userId: string) => {
      const tasks = await db.collection("tasks").find({ goalId, userId }).toArray()
      const completed = tasks.filter((t) => t.status === "completed").length
      return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    }

    const sharedGoals = [
      ...(await Promise.all(
        mySharedGoals.map(async (g) => ({
          ...g,
          _id: g._id.toString(),
          isOwn: true,
          progress: await calculateProgress(g._id.toString(), user._id),
        })),
      )),
      ...(await Promise.all(
        partnerSharedGoals.map(async (g) => ({
          ...g,
          _id: g._id.toString(),
          isOwn: false,
          progress: await calculateProgress(g._id.toString(), partner._id.toString()),
        })),
      )),
    ]

    return NextResponse.json({
      connected: true,
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        email: partner.email,
      },
      sharedGoals,
      partnerStats: {
        weeklyTasks: partnerCompleted.length,
        weeklyCompletion,
        streak,
      },
    })
  } catch (error) {
    console.error("[v0] Partner data error:", error)
    return NextResponse.json({ error: "Failed to load partner data" }, { status: 500 })
  }
}
