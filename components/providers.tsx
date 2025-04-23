"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { SerialProvider } from './webserialapi';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Wrap the app with all providers needed
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SerialProvider>
        {children}
      </SerialProvider>
    </ThemeProvider>
  );
} 