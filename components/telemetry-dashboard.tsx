"use client"

import { LiveLocation } from '@/components/live-loc-data'
import { TemperatureChart } from '@/components/temperature-chart'
import { GasSensors } from '@/components/gas-sensors'
import { SystemStatus } from '@/components/system-status'

export function TelemetryDashboard() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 px-4 lg:px-6">
      <div className="w-full lg:w-3/4 h-full overflow-hidden">
        <LiveLocation />
      </div>
      <div className="w-full lg:w-1/4 flex flex-col gap-4">
        <TemperatureChart />
        <GasSensors />
        <SystemStatus />
      </div>
    </div>
  )
} 