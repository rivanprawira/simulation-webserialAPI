"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the telemetry data structure
export interface TelemetryData {
  // GPS Data
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  
  // Sensor Data
  temperature: number;
  coLevel: number;
  no2Level: number;
  so2Level: number;
  
  // Battery Data
  voltage: number;
  current: number;
  batteryPercentage: number;
  
  // System Data
  timestamp: number;
  signalStrength: number;
  flightTime: number; // in seconds
}

// Define the context interface
interface TelemetryContextType {
  telemetryData: TelemetryData;
  setTelemetryData: React.Dispatch<React.SetStateAction<TelemetryData>>;
  isSimulating: boolean;
  setIsSimulating: React.Dispatch<React.SetStateAction<boolean>>;
  simulationSettings: {
    latitude: string;
    longitude: string;
    altitude: string;
    speed: string;
    temperature: string;
    coLevel: string;
    no2Level: string;
    so2Level: string;
    voltage: string;
    current: string;
    batteryPercentage: string;
  };
  setSimulationSettings: React.Dispatch<React.SetStateAction<{
    latitude: string;
    longitude: string;
    altitude: string;
    speed: string;
    temperature: string;
    coLevel: string;
    no2Level: string;
    so2Level: string;
    voltage: string;
    current: string;
    batteryPercentage: string;
  }>>;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
}

// Default values
const defaultTelemetryData: TelemetryData = {
  latitude: -33.8688,
  longitude: 151.2093,
  altitude: 100,
  speed: 10,
  temperature: 25,
  coLevel: 1.2,
  no2Level: 100,
  so2Level: 10,
  voltage: 25,
  current: 1.5,
  batteryPercentage: 100,
  timestamp: Date.now(),
  signalStrength: -65,
  flightTime: 0
};

const defaultSimulationSettings = {
  latitude: '-33.8688',
  longitude: '151.2093',
  altitude: '100',
  speed: '10',
  temperature: '25',
  coLevel: '1.2',
  no2Level: '100',
  so2Level: '10',
  voltage: '25',
  current: '1.5',
  batteryPercentage: '100',
};

// Create the context
const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

// Create a provider component
export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [telemetryData, setTelemetryData] = useState<TelemetryData>(defaultTelemetryData);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSettings, setSimulationSettings] = useState(defaultSimulationSettings);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // Function to generate random fluctuations
  const addNoise = (value: number, magnitude: number = 0.05): number => {
    const noise = (Math.random() - 0.5) * 2 * magnitude * value;
    return value + noise;
  };

  // Function to update telemetry data with realistic variations
  const updateTelemetryData = () => {
    setTelemetryData(prev => {
      // Calculate flight time
      const flightTime = (Date.now() - startTime) / 1000;
      
      // Create small random movements in latitude and longitude
      const latDelta = (Math.random() - 0.5) * 0.0001 * parseFloat(simulationSettings.speed);
      const lngDelta = (Math.random() - 0.5) * 0.0001 * parseFloat(simulationSettings.speed);
      
      // Battery decreases over time
      const batteryDrain = Math.random() * 0.05; // 0-0.05% drain per update
      const newBatteryPercentage = Math.max(0, prev.batteryPercentage - batteryDrain);
      
      // Signal strength fluctuates
      const newSignalStrength = Math.max(-90, Math.min(-50, prev.signalStrength + (Math.random() - 0.5) * 2));
      
      return {
        ...prev,
        latitude: prev.latitude + latDelta,
        longitude: prev.longitude + lngDelta,
        altitude: addNoise(parseFloat(simulationSettings.altitude)),
        speed: addNoise(parseFloat(simulationSettings.speed)),
        temperature: addNoise(parseFloat(simulationSettings.temperature), 0.02),
        coLevel: addNoise(parseFloat(simulationSettings.coLevel), 0.1),
        no2Level: addNoise(parseFloat(simulationSettings.no2Level), 0.1),
        so2Level: addNoise(parseFloat(simulationSettings.so2Level), 0.1),
        voltage: addNoise(parseFloat(simulationSettings.voltage), 0.01),
        current: addNoise(parseFloat(simulationSettings.current), 0.05),
        batteryPercentage: newBatteryPercentage,
        timestamp: Date.now(),
        signalStrength: newSignalStrength,
        flightTime: flightTime
      };
    });
  };

  // Start simulation
  const startSimulation = () => {
    if (isSimulating) return;
    
    // Initialize telemetry data with simulation settings
    setTelemetryData({
      latitude: parseFloat(simulationSettings.latitude),
      longitude: parseFloat(simulationSettings.longitude),
      altitude: parseFloat(simulationSettings.altitude),
      speed: parseFloat(simulationSettings.speed),
      temperature: parseFloat(simulationSettings.temperature),
      coLevel: parseFloat(simulationSettings.coLevel),
      no2Level: parseFloat(simulationSettings.no2Level),
      so2Level: parseFloat(simulationSettings.so2Level),
      voltage: parseFloat(simulationSettings.voltage),
      current: parseFloat(simulationSettings.current),
      batteryPercentage: parseFloat(simulationSettings.batteryPercentage),
      timestamp: Date.now(),
      signalStrength: -65,
      flightTime: 0
    });
    
    setStartTime(Date.now());
    setIsSimulating(true);
    
    // Start interval to update data
    const interval = setInterval(updateTelemetryData, 1000);
    setSimulationInterval(interval);
  };

  // Stop simulation
  const stopSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setIsSimulating(false);
  };

  // Reset simulation
  const resetSimulation = () => {
    stopSimulation();
    setSimulationSettings(defaultSimulationSettings);
    setTelemetryData(defaultTelemetryData);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetryData,
        setTelemetryData,
        isSimulating,
        setIsSimulating,
        simulationSettings,
        setSimulationSettings,
        startSimulation,
        stopSimulation,
        resetSimulation
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

// Custom hook to use the telemetry context
export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
} 