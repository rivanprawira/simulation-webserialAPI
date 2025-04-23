"use client"

import { IconClock, IconPlane, IconSettings } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

export function SystemStatus() {
  // Mock system status data
  const statusData = {
    lastUpdate: new Date(), // Current time
    flightTime: '00:45:12', // HH:MM:SS format
    uptime: '2 min ago', // Last connection time
  }

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-0.5 hover:bg-muted">
            <IconSettings className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-3 py-1">
        <div className="grid gap-1.5">
          <div className="flex flex-col gap-0">
            <div className="text-xs text-muted-foreground">Last Update</div>
            <div className="flex items-center gap-1 text-xs font-medium">
              <IconClock className="h-3 w-3 text-muted-foreground" />
              {statusData.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex flex-col gap-0">
            <div className="text-xs text-muted-foreground">Flight Time</div>
            <div className="flex items-center gap-1 text-xs font-medium">
              <IconPlane className="h-3 w-3 text-muted-foreground" />
              {statusData.flightTime}
            </div>
          </div>
          
          <div className="flex flex-col gap-0">
            <div className="text-xs text-muted-foreground">Last Connection</div>
            <div className="text-xs font-medium">{statusData.uptime}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 