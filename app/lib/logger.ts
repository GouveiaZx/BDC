/**
 * Conditional Logger Utility
 * Only logs in development environment to improve production performance
 */

const isDev = process.env.NODE_ENV === 'development';

interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export const logger: Logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

// Helper function for component debugging
export const debugComponent = (componentName: string, data?: any) => {
  if (isDev) {
    console.log(`[${componentName}]`, data || 'rendered');
  }
};

// Helper function for API debugging
export const debugAPI = (endpoint: string, method: string, data?: any) => {
  if (isDev) {
    console.log(`[API ${method}] ${endpoint}`, data || '');
  }
};

// Helper function for performance debugging
export const debugPerformance = (label: string, fn: () => void) => {
  if (isDev) {
    console.time(label);
    fn();
    console.timeEnd(label);
  } else {
    fn();
  }
};