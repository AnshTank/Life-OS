import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GoalsView } from "@/components/goals/goals-view"

export default async function GoalsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <GoalsView user={user} />
}
