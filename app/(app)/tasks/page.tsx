import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TasksView } from "@/components/tasks/tasks-view"

export default async function TasksPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <TasksView user={user} />
}
