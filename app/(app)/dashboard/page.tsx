import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <DashboardView user={user} />
}
