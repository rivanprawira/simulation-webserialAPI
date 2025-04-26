"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { ConnectStatus } from './connect-status';
import { useSerialData } from '@/hooks/useSerialData';
import { useSerialStore, globals } from '@/lib/store';

// TypeScript definitions for Web Serial API
declare global {
  interface Navigator {
    serial: {
      addEventListener(type: string, listener: EventListener): void;
      removeEventListener(type: string, listener: EventListener): void;
      requestPort(options?: any): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }

  interface SerialPort {
    readable: ReadableStream;
    writable: WritableStream;
    open(options: { 
      baudRate: number;
      dataBits?: number;
      stopBits?: number;
      parity?: string;
      flowControl?: string;
    }): Promise<void>;
    close(): Promise<void>;
  }
}

interface SerialContextType {
  isSupported: boolean;
  isConnected: boolean;
  ports: SerialPort[];
  connect: (options?: {baudRate: number}) => Promise<void>;
  disconnect: () => Promise<void>;
  write: (data: string | Uint8Array) => Promise<void>;
  clearData: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const SerialContext = createContext<SerialContextType | undefined>(undefined);

interface SerialProviderProps {
  children?: ReactNode;
  baudRate?: number;
  bufferSize?: number;
}

export const SerialProvider: React.FC<SerialProviderProps> = ({
  children,
  baudRate = 9600,
  bufferSize = 1024,
}) => {
  // Basic state
  const [ports, setPorts] = useState<SerialPort[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  
  // Use the store for state management
  const { 
    isConnected, 
    terminalContent,
    setConnected,
    setTerminalContent,
    addToCommandHistory,
  } = useSerialStore();
  
  // Access our API utilities
  const { actions } = useSerialData();

  // Maintain reference to mounted state
  const isMounted = useRef(true);

  // Set up event handlers for serial port connections
  useEffect(() => {
    // Check if Web Serial API is supported
    if ('serial' in navigator) {
      setIsSupported(true);
      
      // Set up event listeners for port connect/disconnect
      const handleConnect = (event: Event) => {
        console.log('Serial device connected');
        updatePorts();
      };
      
      const handleDisconnect = async (event: Event) => {
        console.log('Serial device disconnected');
        await updatePorts();
        
        // If we have a port and it's been disconnected, force disconnect
        if (globals.port) {
          const availablePorts = await navigator.serial.getPorts();
          const portStillExists = availablePorts.some(p => p === globals.port);
          if (!portStillExists) {
            console.log('Our port was disconnected, cleaning up connection');
            disconnect();
          }
        }
      };
      
      navigator.serial.addEventListener('connect', handleConnect);
      navigator.serial.addEventListener('disconnect', handleDisconnect);
      
      updatePorts();
      
      // Check if a port reference already exists globally and try to reconnect
      if (globals.port && !isConnected) {
        console.log('Found existing port reference, attempting to resume reading');
        readFromPort(globals.port);
        setConnected(true);
      }
      
      return () => {
        if ('serial' in navigator) {
          navigator.serial.removeEventListener('connect', handleConnect);
          navigator.serial.removeEventListener('disconnect', handleDisconnect);
        }
      };
    } else {
      setIsSupported(false);
      setError('Web Serial API is not supported in this browser');
    }
  }, []);

  // Cleanup effect that only runs when component truly unmounts (not just navigating between pages)
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // We intentionally don't call disconnect() here to prevent disconnections during navigation
    };
  }, []);

  const updatePorts = async () => {
    if ('serial' in navigator) {
      try {
        const availablePorts = await navigator.serial.getPorts();
        setPorts(availablePorts);
      } catch (err) {
        console.error('Error getting serial ports:', err);
        setError(`Error getting serial ports: ${err}`);
      }
    }
  };

  const connect = async (options?: {baudRate: number}) => {
    if (!isSupported) {
      setError('Web Serial API is not supported in this browser');
      return;
    }

    // First disconnect if already connected
    if (isConnected) {
      await disconnect();
    }

    try {
      // Request port access
      const selectedPort = await navigator.serial.requestPort();
      
      // Open the port with specified baud rate
      const actualBaudRate = options?.baudRate || baudRate;
      await selectedPort.open({ 
        baudRate: actualBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none"
      });
      
      console.log(`Connected to port at ${actualBaudRate} baud`);
      globals.port = selectedPort;
      setConnected(true);
      setError(null);
      
      // Save connection state to the database
      await actions.saveSerialState({
        connected: true,
        baudRate: actualBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none"
      });
      
      // Start reading from the port
      readFromPort(selectedPort);
      
    } catch (err: any) {
      console.error('Error connecting to serial port:', err);
      setError(`Error connecting: ${err.message || err}`);
      setConnected(false);
      globals.port = null;
      
      // Update connected state in database
      await actions.saveSerialState({ connected: false });
    }
  };

  const readFromPort = async (selectedPort: SerialPort) => {
    try {
      console.log('Starting to read from port');
      
      // Create a buffer for batched updates
      let pendingTextBuffer = "";
      let lastUpdateTime = Date.now();
      let lastDbSaveTime = Date.now();
      const UPDATE_INTERVAL = 100; // ms between updates
      const DB_SAVE_INTERVAL = 5000; // Save to DB every 5 seconds at most
      
      while (selectedPort.readable && isMounted.current) {
        const reader = selectedPort.readable.getReader();
        globals.reader = reader;
      
        try {
          while (isMounted.current) {
            try {
              const { value, done } = await reader.read();
              
              if (done) {
                reader.releaseLock();
                globals.reader = null;
                break;
              }
              
              if (value) {
                // Decode the incoming data
                const decoder = new TextDecoder();
                const text = decoder.decode(value);
                
                // Add to buffer instead of immediately updating UI
                pendingTextBuffer += text;
                
                // Only update the UI periodically to improve performance
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
                  if (pendingTextBuffer) {
                    // Log the received data (only log length for performance)
                    console.log(`Batched received text: ${pendingTextBuffer.length} characters`);
                    
                    // Update terminal content in the store - this persists across page navigation
                    setTerminalContent(prevContent => prevContent + pendingTextBuffer);
                    
                    // Reset buffer and update time
                    pendingTextBuffer = "";
                    lastUpdateTime = currentTime;
                    
                    // Save to database much less frequently to reduce load
                    if (currentTime - lastDbSaveTime > DB_SAVE_INTERVAL) {
                      try {
                        // Save minimal data to database to reduce overhead
                        actions.saveSerialState({ 
                          lastData: "ACTIVE_CONNECTION"
                        }).catch(err => {
                          console.warn('Error saving to database:', err);
                        });
                        lastDbSaveTime = currentTime;
                      } catch (err) {
                        console.warn('Error saving to database:', err);
                      }
                    }
                  }
                }
              }
            } catch (readError) {
              console.error("Error reading from port:", readError);
              reader.releaseLock();
              globals.reader = null;
              break;
            }
          }
          
          // Flush any remaining data in buffer before exiting loop
          if (pendingTextBuffer) {
            setTerminalContent(prevContent => prevContent + pendingTextBuffer);
          }
          
        } catch (error) {
          console.error("Error in read loop:", error);
          if (String(error).includes("disconnected")) {
            if (isMounted.current) {
              setConnected(false);
              globals.port = null;
              setError("Device was disconnected");
            }
            return;
          }
        } finally {
          if (globals.reader) {
            try {
              globals.reader.releaseLock();
              globals.reader = null;
            } catch (releaseError) {
              console.warn("Error releasing reader:", releaseError);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error reading from serial port:', err);
      if (isMounted.current) {
        setError(`Error reading data: ${err.message || err}`);
      }
      disconnect();
    }
  };

  const disconnect = async () => {
    try {
      // First check if we're actually connected
      if (!isConnected) {
        console.log('Not connected, nothing to disconnect');
        return;
      }
      
      console.log('Starting disconnection process...');
      
      // Create a timeout to force disconnect if normal process takes too long
      let forceDisconnectTimeout: NodeJS.Timeout | null = setTimeout(() => {
        console.warn('Disconnect operation timed out, forcing disconnect...');
        // Force update UI regardless of what happens with the port
        setConnected(false);
        globals.reader = null;
        globals.writer = null;
        globals.port = null;
        
        try {
          // Update database with disconnected state
          actions.saveSerialState({ connected: false }).catch(err => {
            console.warn('Error updating database after force disconnect:', err);
          });
        } catch (e) {
          console.warn('Error in force disconnect cleanup:', e);
        }
      }, 5000); // 5 second timeout
      
      // Set UI state to disconnected first to prevent further interactions
      setConnected(false);
      
      // Track if we succeed so we can clear the timeout
      let disconnectSucceeded = false;
      
      try {
        // Cancel any pending read operations and clean up resources in a specific order
        if (globals.reader) {
          try {
            console.log('Cancelling reader...');
            // First try to cancel the read operation
            await Promise.race([
              globals.reader.cancel().catch((err: any) => console.warn('Reader cancel error:', err)),
              new Promise(resolve => setTimeout(resolve, 1000)) // 1s timeout
            ]);
            console.log('Reader cancelled, releasing lock...');
            // Then release the lock
            globals.reader.releaseLock();
            console.log('Reader lock released');
          } catch (err: any) {
            console.warn('Error cleaning up reader:', err);
          } finally {
            globals.reader = null;
          }
        }
        
        // Clean up the writer if it exists
        if (globals.writer) {
          try {
            console.log('Releasing writer lock...');
            globals.writer.releaseLock();
            console.log('Writer lock released');
          } catch (err: any) {
            console.warn('Error releasing writer:', err);
          } finally {
            globals.writer = null;
          }
        }
        
        // Close the port if it exists
        if (globals.port) {
          try {
            console.log('Closing port...');
            // Force a timeout to ensure we don't hang indefinitely
            await Promise.race([
              globals.port.close(),
              new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout
            ]).catch((err: any) => console.warn('Port close error or timeout:', err));
              
            console.log('Port closed successfully');
          } catch (err: any) {
            console.warn('Error closing port:', err);
          } finally {
            // Always nullify the port reference to allow garbage collection
            globals.port = null;
          }
        }
        
        // Update database state as a final step
        await actions.saveSerialState({ connected: false });
        console.log('Connection state updated in database');
        
        // Mark success so we can clear the timeout
        disconnectSucceeded = true;
        
      } finally {
        // Clear the force disconnect timeout if we completed normally
        if (forceDisconnectTimeout && disconnectSucceeded) {
          clearTimeout(forceDisconnectTimeout);
          forceDisconnectTimeout = null;
        }
      }
      
      console.log('Disconnection completed successfully');
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error during disconnection:', err);
      setError(`Disconnect error: ${err.message || err}`);
      
      // Force disconnect state in UI even if we encountered errors
      setConnected(false);
      globals.reader = null;
      globals.writer = null;
      globals.port = null;
    }
  };

  const write = async (data: string | Uint8Array) => {
    try {
      if (!globals.port || !globals.port.writable || !isConnected) {
        throw new Error('Serial port is not connected');
      }
      
      // Get the writer
      const writer = globals.port.writable.getWriter();
      globals.writer = writer;
      
      try {
        // Handle string data
        if (typeof data === 'string') {
          // For AT commands, make sure to use CR-LF
          let commandString = data;
          
          if (data.toUpperCase().trim().startsWith('AT')) {
            // Ensure proper line endings for AT commands (CR-LF)
            if (!commandString.endsWith('\r\n')) {
              commandString = commandString.replace(/[\r\n]+$/, '') + '\r\n';
            }
          } else if (!commandString.endsWith('\n')) {
            // For non-AT commands, add newline if missing
            commandString += '\n';
          }
          
          // Log command being sent
          console.log(`Sending command: ${JSON.stringify(commandString)}`);
          
          // Convert to bytes and send
          const bytes = new TextEncoder().encode(commandString);
          await writer.write(bytes);
          
          // Add command to history
          const cleanCommand = commandString.replace(/[\r\n]+$/, '');
          if (cleanCommand) {
            await actions.saveCommand(cleanCommand);
          }
        } else {
          // Handle raw data
          await writer.write(data);
        }
      } finally {
        // Always release the writer when done
        writer.releaseLock();
        globals.writer = null;
      }
    } catch (err: any) {
      console.error('Error writing to serial port:', err);
      setError(`Error sending data: ${err.message || err}`);
      throw err;
    }
  };

  const clearData = async () => {
    // Use the store's action to clear terminal content - this persists
    setTerminalContent('');
    
    // Update database
    try {
      await actions.clearData();
      await actions.saveSerialState({ lastData: '' });
      console.log('Terminal cleared');
    } catch (err) {
      console.warn('Error clearing data in database:', err);
    }
  };

  return (
    <SerialContext.Provider
      value={{
        isSupported,
        isConnected,
        ports,
        connect,
        disconnect,
        write,
        clearData,
        error,
        setError,
      }}
    >
      {children}
    </SerialContext.Provider>
  );
};

// Hook for using the Serial context
export const useSerial = (): SerialContextType => {
  const context = useContext(SerialContext);
  if (context === undefined) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
};

// UI Component for Serial Connection
export const SerialConnector: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState<string>("");
  const [deviceInfo, setDeviceInfo] = useState({
    baudRate: 9600,
    dataBits: 8,
    status: 'Disconnected',
  });
  
  // Use our custom serial context
  const { 
    isConnected, 
    baudRate, 
    commandHistory,
    terminalContent,
    dataBits, 
    stopBits, 
    parity,
    setConnected,
    setBaudRate,
    setTerminalContent
  } = useSerialStore();
  
  // Get API functions
  const { actions } = useSerialData();
  
  // Get the serial context
  const serialContext = useSerial();
  const { 
    connect, 
    disconnect, 
    write, 
    clearData, 
    error, 
    setError, 
    isSupported
  } = serialContext;
  
  // Optimize terminal rendering with these variables
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousContentLength = useRef(0);
  const MAX_TERMINAL_LENGTH = 100000; // Limit terminal length to prevent memory issues
  
  // Limit terminal content length to prevent performance issues with extremely large content
  useEffect(() => {
    if (terminalContent.length > MAX_TERMINAL_LENGTH) {
      // Keep the last portion of the content, trimming 20% from the beginning
      const trimPoint = Math.floor(MAX_TERMINAL_LENGTH * 0.2);
      const trimmedContent = terminalContent.substring(terminalContent.length - MAX_TERMINAL_LENGTH + trimPoint);
      setTerminalContent(trimmedContent);
    }
  }, [terminalContent, setTerminalContent]);
  
  // Optimized scroll to bottom that uses RAF for better performance
  useEffect(() => {
    if (terminalRef.current && shouldScrollToBottom) {
      // Using requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      });
      
      // Update previous content length
      previousContentLength.current = terminalContent.length;
    }
  }, [terminalContent, shouldScrollToBottom]);
  
  // Add handler for manual scrolling
  const handleTerminalScroll = () => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      // If user scrolls up, stop auto-scrolling
      // If user scrolls to bottom, resume auto-scrolling
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldScrollToBottom(isAtBottom);
    }
  };
  
  // Render terminal content - optimized to handle large text
  const renderTerminalContent = useMemo(() => {
    if (!terminalContent) {
      return (
        <div className="text-gray-500 italic flex h-full items-center justify-center">
          Terminal is empty. Connect to a device and send commands to see output here.
        </div>
      );
    }
    
    return <div>{terminalContent}</div>;
  }, [terminalContent]);
  
  // Quick commands
  const [quickCommands, setQuickCommands] = useState([
    { label: "Version", command: "version" },
    { label: "Help", command: "help" },
    { label: "Status", command: "status" },
    { label: "Reboot", command: "reboot" },
    { label: "Reset", command: "reset" },
    { label: "Clear", command: "clear" },
    { label: "Read Temp", command: "read temp" },
    { label: "Read Humidity", command: "read humidity" },
  ]);
  
  // Update device info when connection status changes
  useEffect(() => {
    setDeviceInfo({
      baudRate: baudRate,
      dataBits: dataBits || 8,
      status: isConnected ? 'Connected' : 'Disconnected',
    });
  }, [isConnected, baudRate, dataBits]);

  // Handlers for connection actions
  const handleConnect = () => {
    try {
      connect({ baudRate });
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  // Add a reference for the disconnection button
  const disconnectBtnRef = useRef<HTMLButtonElement>(null);
  
  // Use an effect to add a marker class to the disconnect button
  useEffect(() => {
    if (isConnected) {
      // Find disconnect button in ConnectStatus component
      const btns = document.querySelectorAll('button');
      btns.forEach(btn => {
        if (btn.textContent?.trim() === 'Disconnect') {
          btn.classList.add('disconnect-btn');
        } else {
          btn.classList.remove('disconnect-btn');
        }
      });
    }
  }, [isConnected]);

  // Update handleDisconnect function to be more robust
  const handleDisconnect = async () => {
    console.log('Disconnect button clicked');
    
    try {
      // Disable the button during disconnection to prevent multiple clicks
      const disconnectBtn = document.querySelector('.disconnect-btn');
      if (disconnectBtn) {
        disconnectBtn.setAttribute('disabled', 'true');
        disconnectBtn.textContent = 'Disconnecting...';
      }
      
      // Wait for disconnect to complete
      await disconnect();
      
      console.log('Disconnect handled successfully');
    } catch (err: any) {
      console.error('Error in handleDisconnect:', err);
      setError(`Failed to disconnect: ${err.message || String(err)}`);
    } finally {
      // Re-enable the button if it's still in the DOM
      const disconnectBtn = document.querySelector('.disconnect-btn');
      if (disconnectBtn) {
        disconnectBtn.removeAttribute('disabled');
        disconnectBtn.textContent = 'Disconnect';
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !isConnected) return;
    
    try {
      const commandToSend = inputText;
      
      // First clear the input (for UI responsiveness)
      setInputText('');
      
      console.log(`Sending command: "${commandToSend}"`);
      
      // Special handling for AT commands
      if (commandToSend.toUpperCase().startsWith('AT')) {
        // Make sure we use CR-LF for AT commands
        await write(commandToSend + '\r\n');
      } else {
        // For other commands, let the write function handle line endings
        await write(commandToSend);
      }
    } catch (err) {
      console.error("Error sending command:", err);
    }
  };

  const handleClear = async () => {
    await clearData();
    console.log("Terminal cleared");
  };

  const handleExport = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([terminalContent], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `serial_data_${new Date().toISOString().replace(/:/g, '-')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data");
    }
  };

  const sendQuickCommand = async (command: string) => {
    if (!isConnected) return;
    
    try {
      console.log(`Sending quick command: "${command}"`);
      
      // Special handling for AT commands
      if (command.toUpperCase().startsWith('AT')) {
        // Make sure we use CR-LF for AT commands
        await write(command + '\r\n');
      } else {
        // For other commands, let the write function handle line endings
        await write(command);
      }
    } catch (err) {
      console.error("Error sending quick command:", err);
    }
  };

  const resendCommand = async (command: string) => {
    if (!isConnected) return;
    
    try {
      console.log(`Resending command: "${command}"`);
      
      // Special handling for AT commands
      if (command.toUpperCase().startsWith('AT')) {
        // Make sure we use CR-LF for AT commands
        await write(command + '\r\n');
      } else {
        // For other commands, let the write function handle line endings
        await write(command);
      }
    } catch (err) {
      console.error("Error resending command:", err);
    }
  };

  const handleClearHistory = async () => {
    await actions.clearHistory();
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-100 text-red-800 rounded-lg shadow-md border border-red-200">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-lg font-bold">Browser Compatibility Issue</h3>
        </div>
        <p>Web Serial API is not supported in this browser. Please use Chrome or Edge for full functionality.</p>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Connection Status Card */}
      <ConnectStatus 
        isConnected={isConnected} 
        onConnectClick={isConnected ? handleDisconnect : handleConnect} 
        error={error}
      />

      {/* Main Content - Two Columns */}
      <div className="flex flex-col md:flex-row gap-4 mt-4" style={{ minHeight: "560px" }}>
        {/* Left Column - Terminal */}
        <div className="w-full md:w-3/5 h-[560px]">
          <div className="h-full p-4 rounded-lg shadow-md flex flex-col" style={{ backgroundColor: "#1E293B" }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <h2 className="text-lg font-bold text-white">Terminal Output</h2>
              </div>
              <div className="flex space-x-2">
                {!isConnected && (
                  <select
                    value={baudRate.toString()}
                    onChange={(e) => setBaudRate(parseInt(e.target.value))}
                    className="px-3 py-1.5 rounded-md bg-gray-700 text-gray-300 text-xs font-semibold mr-2"
                  >
                    {["9600", "19200", "38400", "57600", "115200"].map(rate => (
                      <option key={rate} value={rate}>{rate} baud</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs flex items-center"
                  title="Clear terminal contents"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Terminal
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              </div>
            </div>

            <div className="flex-1 mb-3">
              <div 
                ref={terminalRef}
                className="h-[440px] p-3 rounded-md font-mono text-sm overflow-y-auto" 
                style={{ 
                  backgroundColor: "#0F172A", 
                  color: "#4ADE80", 
                  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                  whiteSpace: "pre-wrap"
                }}
                onScroll={handleTerminalScroll}
              >
                {renderTerminalContent}
              </div>
            </div>

            <div className="h-10 mb-0">
              <div className="flex items-center h-full">
                <div className="text-green-500 mr-2 font-mono">{'>'}</div>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!isConnected}
                  className="flex-1 px-3 py-1.5 border bg-gray-800 text-white border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isConnected ? "Type a command..." : "Connect to start sending commands..."}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!isConnected}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed font-bold flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Additional Cards */}
        <div className="w-full md:w-2/5 h-[560px] flex flex-col">
          {/* All cards in a container with exact same height as left column */}
          <div className="h-full flex flex-col justify-between">
            {/* Top card */}
            <div className="p-4 rounded-lg shadow-md text-white mb-4" style={{ backgroundColor: "#1E293B" }}>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Commands
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {quickCommands.map((cmd, index) => (
                  <button
                    key={index}
                    onClick={() => sendQuickCommand(cmd.command)}
                    disabled={!isConnected}
                    className="p-2 bg-gray-700 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-bold transition-colors flex items-center justify-center"
                  >
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Middle card - Command History */}
            <div className="p-4 rounded-lg shadow-md text-white mb-4 flex flex-col" style={{ backgroundColor: "#1E293B", height: "220px" }}>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Command History
                </div>
                <button
                  onClick={handleClearHistory}
                  className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs flex items-center"
                  title="Clear command history"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </h2>
              <div 
                style={{ 
                  height: "160px", 
                  overflow: "auto",
                  scrollbarWidth: "thin"
                }}
              >
                {commandHistory.length === 0 ? (
                  <div className="text-sm text-gray-400 italic flex items-center justify-center h-full">
                    No commands sent yet
                  </div>
                ) : (
                  <div>
                    {commandHistory.map((cmd, index) => (
                      <div 
                        key={index} 
                        className="flex items-center p-2 hover:bg-gray-700 rounded-md group mb-1"
                        style={{ minHeight: "32px" }}
                      >
                        <div style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}>
                          <div 
                            className="text-sm text-blue-400 font-mono truncate" 
                            title={cmd}
                            style={{ maxWidth: "100%" }}
                          >
                            {cmd}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <button
                            onClick={() => resendCommand(cmd)}
                            disabled={!isConnected}
                            className="ml-2 p-1.5 bg-gray-600 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-xs flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom card - will always be at the bottom */}
            <div className="p-4 rounded-lg shadow-md text-white" style={{ backgroundColor: "#1E293B" }}>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Device Status
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-700 rounded-md flex flex-col">
                  <span className="text-xs text-gray-400">Baud Rate</span>
                  <span className="text-sm text-white font-bold">{deviceInfo.baudRate}</span>
                </div>
                <div className="p-2 bg-gray-700 rounded-md flex flex-col">
                  <span className="text-xs text-gray-400">Data Bits</span>
                  <span className="text-sm text-white font-bold">{deviceInfo.dataBits}</span>
                </div>
                <div className="p-2 bg-gray-700 rounded-md flex flex-col">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className="text-sm text-white font-bold">{deviceInfo.status}</span>
                </div>
                <div className="p-2 bg-gray-700 rounded-md flex flex-col">
                  <span className="text-xs text-gray-400">Connection</span>
                  <span className={`text-sm font-bold flex items-center ${isConnected ? "text-green-500" : "text-red-500"}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
                    {isConnected ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @deprecated This component is being replaced by SerialTerminal.
 * Please use the SerialTerminal component for new implementations.
 * This component is kept for backward compatibility but will be removed in a future version.
 */
export const WebSerialAPI: React.FC<{ baudRate?: number; bufferSize?: number; children?: ReactNode }> = React.memo(({ baudRate, bufferSize, children }) => {
  const { isConnected, setConnected } = useSerialStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Disable automatic connection on page load
  useEffect(() => {
    // Force disconnect state on page load
    if (!isInitialized) {
      setConnected(false);
      globals.port = null;
      globals.reader = null;
      globals.writer = null;
      setIsInitialized(true);
    }
  }, [isConnected, isInitialized, setConnected]);
  
  return (
    <SerialProvider baudRate={baudRate} bufferSize={bufferSize}>
      <SerialConnector />
      {children}
    </SerialProvider>
  );
});

