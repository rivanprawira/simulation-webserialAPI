"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  FullPageContent,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SerialConfiguration } from "@/components/serial-configuration"
import { SerialProvider, useSerial } from "@/components/webserialapi"
import { ConnectStatus } from "@/components/connect-status"

function ConnectStatusWrapper() {
  const { isConnected, connect, disconnect, error } = useSerial();
  
  return (
    <ConnectStatus 
      isConnected={isConnected}
      onConnectClick={isConnected ? disconnect : connect}
      error={error}
    />
  );
}

export default function ConfigurationPage() {
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
            <div className="px-4 lg:px-6">
              <SerialProvider>
                <ConnectStatusWrapper />
                <SerialConfiguration />
              </SerialProvider>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </FullPageContent>
  )
}
