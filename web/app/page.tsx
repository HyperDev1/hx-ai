"use client"

import dynamic from "next/dynamic"

const HXAppShell = dynamic(
  () => import("@/components/hx/app-shell").then((mod) => mod.HXAppShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace…
      </div>
    ),
  },
)

export default function Page() {
  return <HXAppShell />
}
