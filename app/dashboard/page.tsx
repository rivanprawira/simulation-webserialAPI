"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { TelemetryDashboard } from "@/components/telemetry-dashboard"
import {
  FullPageContent,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <FullPageContent>
      <SidebarProvider
        variant="app"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 48)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SiteHeader />
        <AppSidebar variant="inset"/>
        <div style={{ 
          marginLeft: 0, 
          marginTop: "var(--header-height)",
          padding: "1.5rem",
          flex: "1 1 auto",
          overflow: "auto",
          backgroundColor: "#0F172A"
        }}>
          <div className="flex flex-col gap-4">
            <SectionCards />
            <TelemetryDashboard />
          </div>
        </div>
      </SidebarProvider>
    </FullPageContent>
  )
}
