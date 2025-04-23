import { useState, useEffect } from 'react';
import { useSerialStore } from '@/lib/store';

export interface SerialData {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  connected: boolean;
  lastData: string;
}

export function useSerialData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    isConnected, 
    baudRate, 
    lastReceivedData, 
    commandHistory,
    setConnected,
    setBaudRate,
    setLastReceivedData,
    addToCommandHistory,
    clearCommandHistory,
    clearData
  } = useSerialStore();

  // Fetch initial data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/serial');
        
        if (!response.ok) {
          throw new Error('Failed to fetch serial data');
        }
        
        const data = await response.json();
        
        if (data.serialConnection) {
          // Only update these if they exist in the response
          if (data.serialConnection.baudRate) {
            setBaudRate(data.serialConnection.baudRate);
          }
          
          if (data.serialConnection.lastData) {
            setLastReceivedData(data.serialConnection.lastData);
          }
          
          if (data.serialConnection.connected !== undefined) {
            setConnected(data.serialConnection.connected);
          }
        }
        
        // Load command history
        if (data.commandHistory && Array.isArray(data.commandHistory)) {
          // Clear the current history and add all commands
          clearCommandHistory();
          data.commandHistory.forEach((cmd: string) => {
            addToCommandHistory(cmd);
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching serial data:', err);
        setError('Failed to load serial data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Function to save the serial connection state to the backend
  const saveSerialState = async (data: Partial<SerialData>) => {
    try {
      const response = await fetch('/api/serial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save serial data');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error saving serial data:', err);
      setError('Failed to save serial data');
      throw err;
    }
  };
  
  // Function to save a command to history
  const saveCommand = async (command: string) => {
    try {
      // Update local state
      addToCommandHistory(command);
      
      // Save to backend
      await fetch('/api/command-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
    } catch (err) {
      console.error('Error saving command:', err);
    }
  };
  
  // Function to clear command history
  const clearHistory = async () => {
    try {
      // Update local state
      clearCommandHistory();
      
      // Clear in backend
      await fetch('/api/command-history', {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error clearing command history:', err);
    }
  };
  
  // Function to disconnect and reset data
  const resetConnection = async () => {
    try {
      // Update local state
      setConnected(false);
      
      // Reset in backend
      await fetch('/api/serial', {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error resetting connection:', err);
    }
  };
  
  return {
    loading,
    error,
    serialData: {
      isConnected,
      baudRate,
      lastReceivedData,
      commandHistory,
    },
    actions: {
      saveSerialState,
      saveCommand,
      clearHistory,
      resetConnection,
      setConnected,
      setBaudRate,
      setLastReceivedData,
      clearData,
    },
  };
} 