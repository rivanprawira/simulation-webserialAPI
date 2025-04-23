"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { WebSerialAPI } from "@/components/webserialapi"
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
          padding: "1.5rem",
          flex: "1 1 auto",
          overflow: "auto",
          backgroundColor: "#0F172A"
        }}>
          <div className="flex flex-col gap-4">
            <div className="px-4 lg:px-6">
              <WebSerialAPI/>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </FullPageContent>
  )
}
