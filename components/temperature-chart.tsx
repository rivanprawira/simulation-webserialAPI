"use client"

import { useState } from 'react'
import { IconThermometer, IconSettings } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'

// Mock temperature data for the chart
const temperatureData = [
  { time: '00:00', temp: 24.1 },
  { time: '00:05', temp: 24.3 },
  { time: '00:10', temp: 24.5 },
  { time: '00:15', temp: 24.7 },
  { time: '00:20', temp: 24.9 },
  { time: '00:25', temp: 25.0 },
  { time: '00:30', temp: 24.8 },
  { time: '00:35', temp: 24.6 },
  { time: '00:40', temp: 24.5 },
  { time: '00:45', temp: 24.3 },
  { time: '00:50', temp: 24.2 },
  { time: '00:55', temp: 24.5 },
]

export function TemperatureChart() {
  const currentTemp = 24.5 // Current temperature in Celsius

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Temperature</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-0.5 hover:bg-muted">
            <IconSettings className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-3 pb-1">
          <div className="flex items-center">
            <IconThermometer className="h-5 w-5 text-red-500" />
            <span className="ml-1 text-lg font-semibold">{currentTemp.toFixed(1)}°C</span>
          </div>
        </div>
        <div className="h-[80px] w-full px-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={temperatureData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#ef4444" 
                strokeWidth={2}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                dot={false}
              />
              <XAxis dataKey="time" hide={true} />
              <YAxis hide={true} domain={['dataMin - 1', 'dataMax + 1']} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 