'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineSyncContextType {
  isOnline: boolean;
  hasPendingRequests: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  makeRequest: (url: string, options: RequestInit & { body?: any }) => Promise<Response>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function useOfflineSyncContext() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSyncContext must be used within OfflineSyncProvider');
  }
  return context;
}

interface OfflineSyncProviderProps {
  children: ReactNode;
}

export function OfflineSyncProvider({ children }: OfflineSyncProviderProps) {
  const { isOnline, hasPendingRequests, syncStatus, makeRequest } = useOfflineSync();

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        hasPendingRequests,
        syncStatus,
        makeRequest,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

// Component to show sync status
export function SyncStatusIndicator() {
  const { isOnline, hasPendingRequests, syncStatus } = useOfflineSyncContext();

  if (!hasPendingRequests && syncStatus === 'idle') return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
        {syncStatus === 'syncing' && (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm text-gray-700">Sincronizando...</span>
          </>
        )}
        {syncStatus === 'error' && (
          <>
            <div className="h-4 w-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Error de sincronización</span>
          </>
        )}
        {!isOnline && hasPendingRequests && (
          <>
            <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Cambios pendientes</span>
          </>
        )}
      </div>
    </div>
  );
}