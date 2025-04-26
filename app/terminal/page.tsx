"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { EnhancedTerminal } from "@/components/enhanced-terminal"
import {
  FullPageContent,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <FullPageContent>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 48)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SiteHeader />
        <AppSidebar variant="inset" />
        <div style={{ 
          marginLeft: 0, 
          marginTop: "var(--header-height)",
          flex: "1 1 auto",
          overflow: "auto",
          backgroundColor: "#0F172A",
          display: "flex",
          flexDirection: "column",
          width: "100%"
        }}>
          <div className="flex flex-1 w-full h-full">
            <EnhancedTerminal />
          </div>
        </div>
      </SidebarProvider>
    </FullPageContent>
  )
}
