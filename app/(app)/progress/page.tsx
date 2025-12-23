import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProgressView } from "@/components/progress/progress-view"

export default async function ProgressPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <ProgressView user={user} />
}
