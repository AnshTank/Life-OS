import type React from "react"
import { UniverseNavigator } from "@/components/universe-navigator"
import { PageTransition } from "@/components/ui/page-transition"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <UniverseNavigator />
      <main className="w-full pt-16">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}