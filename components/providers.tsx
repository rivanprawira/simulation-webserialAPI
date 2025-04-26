"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { SerialProvider } from './webserialapi';
import { TelemetryProvider } from '@/context/TelemetryContext';
import SessionProviderWrapper from './SessionProviderWrapper';

interface ProvidersProps {
  children: React.ReactNode;
}

// Create a singleton via React.memo
const PersistentSerialProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <SerialProvider baudRate={9600} bufferSize={1024}>
      {children}
    </SerialProvider>
  );
});

PersistentSerialProvider.displayName = 'PersistentSerialProvider';

// Use a React component to ensure we have a singleton provider
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SessionProviderWrapper>
        <TelemetryProvider>
          <PersistentSerialProvider>
            {children}
          </PersistentSerialProvider>
        </TelemetryProvider>
      </SessionProviderWrapper>
    </ThemeProvider>
  );
} 