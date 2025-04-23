"use client"

import { IconGasStation, IconSettings } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

// Gas sensor mock data
const gasData = [
  { id: 'co', name: 'CO', value: 1.7, max: 5, color: '#3b82f6' },  // Blue
  { id: 'no2', name: 'NO₂', value: 0.8, max: 2, color: '#ef4444' }, // Red
  { id: 'so2', name: 'SO₂', value: 0.4, max: 1, color: '#f59e0b' }  // Amber
]

export function GasSensors() {
  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Gas Sensors</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-0.5 hover:bg-muted">
            <IconSettings className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-3 py-1">
        <div className="grid gap-1.5">
          {gasData.map(sensor => (
            <div key={sensor.id} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium">{sensor.name}</div>
                <div className="text-xs font-mono">{sensor.value.toFixed(1)} PPM</div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${(sensor.value / sensor.max) * 100}%`, 
                    backgroundColor: sensor.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 