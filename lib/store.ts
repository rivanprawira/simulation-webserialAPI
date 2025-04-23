import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SerialState {
  isConnected: boolean;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  lastReceivedData: string;
  commandHistory: string[];
  
  // Actions
  setConnected: (connected: boolean) => void;
  setBaudRate: (baudRate: number) => void;
  setLastReceivedData: (data: string) => void;
  addToCommandHistory: (command: string) => void;
  clearCommandHistory: () => void;
  clearData: () => void;
}

export const useSerialStore = create<SerialState>()(
  persist(
    (set) => ({
      isConnected: false,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      lastReceivedData: '',
      commandHistory: [],
      
      // Actions
      setConnected: (connected) => set(() => ({ isConnected: connected })),
      setBaudRate: (baudRate) => set(() => ({ baudRate })),
      setLastReceivedData: (data) => set((state) => ({ lastReceivedData: data })),
      addToCommandHistory: (command) => set((state) => ({
        commandHistory: [command, ...state.commandHistory].slice(0, 50), // Limit to 50 commands
      })),
      clearCommandHistory: () => set(() => ({ commandHistory: [] })),
      clearData: () => set(() => ({ lastReceivedData: '' })),
    }),
    {
      name: 'serial-storage',
    }
  )
); 