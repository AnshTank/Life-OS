import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PartnerView } from "@/components/partner/partner-view"

export default async function PartnerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <PartnerView user={user} />
}
