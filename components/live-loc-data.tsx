"use client"

import { useState } from 'react'
import { IconMapPin, IconSettings, IconMaximize } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

// Mock waypoints data
const waypoints = [
  { id: 1, x: '30%', y: '35%' },
  { id: 2, x: '35%', y: '40%' },
  { id: 3, x: '40%', y: '38%' },
  { id: 4, x: '45%', y: '42%' },
  { id: 5, x: '50%', y: '45%' }
]

export function LiveLocation() {
  // Mock coordinates data
  const [coordinates] = useState({
    lat: "37.4219",
    lng: "-122.0841"
  })

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-md font-medium">Live Location</CardTitle>
        </div>
        <div className="flex gap-1">
          <button className="rounded-md p-1 hover:bg-muted">
            <IconSettings className="h-5 w-5" />
          </button>
          <button className="rounded-md p-1 hover:bg-muted">
            <IconMaximize className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0 pb-2 pl-2 pr-2 relative overflow-hidden">
        <div className="w-full h-[350px] lg:h-[450px] rounded-md bg-gray-900 overflow-hidden relative">
          {/* Use a CSS background pattern instead of external image */}
          <div className="absolute inset-0 bg-[#1a1a1a]">
            {/* Grid pattern overlay */}
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            ></div>
          </div>
          
          {/* Waypoints */}
          {waypoints.map(point => (
            <div 
              key={point.id}
              className="absolute" 
              style={{ 
                left: point.x, 
                top: point.y 
              }}
            >
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
            </div>
          ))}
          
          {/* Current position marker */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <IconMapPin className="h-8 w-8 text-amber-500" />
              {/* Drone icon would be placed here in a real implementation */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="h-6 w-6 rounded-full border-2 border-amber-500 bg-white/20"></div>
              </div>
            </div>
          </div>
          
          {/* Path line */}
          <div className="absolute inset-0">
            <svg className="h-full w-full">
              <path 
                d="M 230,180 L 280,200 L 320,190 L 360,210 L 400,225"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
          
          {/* Coordinates display */}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs p-2 rounded">
            <div>Lat: {coordinates.lat}</div>
            <div>Lng: {coordinates.lng}</div>
            <div>Alt: 127m</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
