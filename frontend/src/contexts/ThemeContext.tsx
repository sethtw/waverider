/**
 * Theme context for Waverider
 * @module contexts/ThemeContext
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { getFromStorage, setToStorage } from '../utils';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to get theme from localStorage, fallback to default
    return getFromStorage<Theme>('waverider_theme', defaultTheme);
  });

  const setTheme = (newTheme: Theme) => {
    logger.info(`Theme changed to: ${newTheme}`);
    setThemeState(newTheme);
    setToStorage('waverider_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(theme);
    
    // Update CSS custom properties for One Dark Pro colors
    if (theme === 'dark') {
      root.style.setProperty('--color-bg', '#282c34');
      root.style.setProperty('--color-bg-alt', '#21252b');
      root.style.setProperty('--color-fg', '#abb2bf');
      root.style.setProperty('--color-fg-alt', '#5c6370');
      root.style.setProperty('--color-red', '#e06c75');
      root.style.setProperty('--color-orange', '#d19a66');
      root.style.setProperty('--color-yellow', '#e5c07b');
      root.style.setProperty('--color-green', '#98c379');
      root.style.setProperty('--color-cyan', '#56b6c2');
      root.style.setProperty('--color-blue', '#61afef');
      root.style.setProperty('--color-purple', '#c678dd');
      root.style.setProperty('--color-purple-alt', '#be5046');
    } else {
      root.style.setProperty('--color-bg', '#ffffff');
      root.style.setProperty('--color-bg-alt', '#f8f9fa');
      root.style.setProperty('--color-fg', '#2c3e50');
      root.style.setProperty('--color-fg-alt', '#6c757d');
      root.style.setProperty('--color-red', '#e74c3c');
      root.style.setProperty('--color-orange', '#f39c12');
      root.style.setProperty('--color-yellow', '#f1c40f');
      root.style.setProperty('--color-green', '#27ae60');
      root.style.setProperty('--color-cyan', '#17a2b8');
      root.style.setProperty('--color-blue', '#3498db');
      root.style.setProperty('--color-purple', '#9b59b6');
      root.style.setProperty('--color-purple-alt', '#e74c3c');
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get theme-aware class names
 */
export function useThemeClasses() {
  const { theme } = useTheme();
  
  return {
    // Background classes
    bg: theme === 'dark' ? 'bg-one-dark-bg' : 'bg-white',
    bgAlt: theme === 'dark' ? 'bg-one-dark-bg-alt' : 'bg-gray-50',
    
    // Text classes
    text: theme === 'dark' ? 'text-one-dark-fg' : 'text-gray-900',
    textAlt: theme === 'dark' ? 'text-one-dark-fg-alt' : 'text-gray-600',
    
    // Border classes
    border: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    borderAlt: theme === 'dark' ? 'border-gray-600' : 'border-gray-300',
    
    // Interactive classes
    hover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    focus: theme === 'dark' ? 'focus:ring-blue-500' : 'focus:ring-blue-500',
    
    // Component-specific classes
    card: theme === 'dark' 
      ? 'bg-one-dark-bg-alt border border-gray-700' 
      : 'bg-white border border-gray-200 shadow-sm',
    
    input: theme === 'dark'
      ? 'bg-one-dark-bg border border-gray-600 text-one-dark-fg placeholder-gray-500'
      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500',
    
    button: theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
    
    buttonPrimary: theme === 'dark'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
  };
} 