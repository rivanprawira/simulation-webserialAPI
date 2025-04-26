"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCw } from "lucide-react";
import { useTelemetry } from "@/context/TelemetryContext";

// Helper component for input fields
interface SimulationInputProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
}

function SimulationInput({ label, id, type = "text", value, onChange, placeholder, step, min, max, required = false, disabled = false }: SimulationInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-300">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500 transition duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function TelemetryPage() {
  // Use the telemetry context
  const {
    simulationSettings,
    setSimulationSettings,
    isSimulating,
    startSimulation,
    stopSimulation,
    resetSimulation,
    telemetryData
  } = useTelemetry();

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSimulationSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-5">
      {/* Left Column: Controls Card */}
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg lg:col-span-3">
        <h1 className="mb-6 text-xl font-semibold text-white">Simulation Controls</h1>

        {/* GPS Simulation Group */}
        <section className="mb-8">
          <h2 className="mb-4 border-b border-gray-700 pb-2 text-lg font-medium text-white">GPS Simulation</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <SimulationInput 
              label="Latitude" 
              id="latitude" 
              type="number" 
              step="any" 
              value={simulationSettings.latitude} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="Longitude" 
              id="longitude" 
              type="number" 
              step="any" 
              value={simulationSettings.longitude} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="Altitude (m)" 
              id="altitude" 
              type="number" 
              value={simulationSettings.altitude} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="Speed (m/s)" 
              id="speed" 
              type="number" 
              step="any" 
              value={simulationSettings.speed} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
          </div>
        </section>

        {/* Sensor Data Group */}
        <section className="mb-8">
          <h2 className="mb-4 border-b border-gray-700 pb-2 text-lg font-medium text-white">Sensor Data</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <SimulationInput 
              label="Temperature (°C)" 
              id="temperature" 
              type="number" 
              step="any" 
              value={simulationSettings.temperature} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="CO Level (PPM)" 
              id="coLevel" 
              type="number" 
              step="any" 
              value={simulationSettings.coLevel} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="NO₂ Level (PPM)" 
              id="no2Level" 
              type="number" 
              step="any" 
              value={simulationSettings.no2Level} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="SO₂ Level (PPM)" 
              id="so2Level" 
              type="number" 
              step="any" 
              value={simulationSettings.so2Level} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
          </div>
        </section>

        {/* Battery Status Group */}
        <section className="mb-8">
          <h2 className="mb-4 border-b border-gray-700 pb-2 text-lg font-medium text-white">Battery Status</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <SimulationInput 
              label="Voltage (V)" 
              id="voltage" 
              type="number" 
              step="any" 
              value={simulationSettings.voltage} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <SimulationInput 
              label="Current (A)" 
              id="current" 
              type="number" 
              step="any" 
              value={simulationSettings.current} 
              onChange={handleInputChange} 
              disabled={isSimulating} 
            />
            <div className="md:col-span-2">
              <SimulationInput 
                label="Battery Percentage" 
                id="batteryPercentage" 
                type="number" 
                min="0" 
                max="100" 
                value={simulationSettings.batteryPercentage} 
                onChange={handleInputChange} 
                disabled={isSimulating} 
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-700 pt-6">
          <Button
            onClick={startSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start Simulation
          </Button>
          <Button
            onClick={stopSimulation}
            disabled={!isSimulating}
            variant="secondary"
            className="flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
          <Button
            onClick={resetSimulation}
            disabled={isSimulating}
            variant="outline"
            className="flex items-center gap-2 rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
          >
            <RotateCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Right Column: Previews */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Map Preview Card */}
        <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-medium text-white">Map Preview</h2>
          {/* Placeholder for Map */}
          <div className="flex aspect-video items-center justify-center rounded bg-gray-700 text-gray-400">
            <div className="text-center">
              <p>Map View</p>
              <p className="mt-2 text-sm">
                Lat: {telemetryData.latitude.toFixed(6)}<br />
                Long: {telemetryData.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Sensor Data Preview Card */}
        <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-medium text-white">Sensor Data Preview</h2>
          {/* Live Sensor Data */}
          <div className="space-y-4 rounded bg-gray-700 p-4 text-sm text-gray-200">
            <div className="flex justify-between">
              <span>Temperature:</span>
              <span className="font-semibold">{telemetryData.temperature.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span>CO Level:</span>
              <span className="font-semibold">{telemetryData.coLevel.toFixed(2)} PPM</span>
            </div>
            <div className="flex justify-between">
              <span>NO₂ Level:</span>
              <span className="font-semibold">{telemetryData.no2Level.toFixed(1)} PPB</span>
            </div>
            <div className="flex justify-between">
              <span>SO₂ Level:</span>
              <span className="font-semibold">{telemetryData.so2Level.toFixed(1)} PPB</span>
            </div>
            <div className="flex justify-between">
              <span>Battery:</span>
              <span className="font-semibold">{telemetryData.batteryPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Voltage:</span>
              <span className="font-semibold">{telemetryData.voltage.toFixed(1)} V</span>
            </div>
            <div className="flex justify-between">
              <span>Current:</span>
              <span className="font-semibold">{telemetryData.current.toFixed(2)} A</span>
            </div>
          </div>
        </div>

        {/* Simulation Status */}
        <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-medium text-white">Simulation Status</h2>
          <div className={`mb-4 flex items-center gap-2 rounded-full px-4 py-2 ${
            isSimulating 
              ? "bg-green-900/30 text-green-400" 
              : "bg-gray-700 text-gray-400"
          }`}>
            <span className={`h-3 w-3 rounded-full ${isSimulating ? "bg-green-500" : "bg-gray-500"}`}></span>
            <span>{isSimulating ? "Simulation Running" : "Simulation Stopped"}</span>
          </div>
          <p className="text-sm text-gray-400">
            {isSimulating 
              ? "Telemetry data is being simulated in real-time. You can view the results on the dashboard."
              : "Configure the parameters and start the simulation to generate telemetry data."
            }
          </p>
        </div>
      </div>
    </div>
  );
} 