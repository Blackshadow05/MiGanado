'use client';

import { useState, useEffect, useCallback } from 'react';

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    // Load pending requests from localStorage
    const stored = localStorage.getItem('pendingAppwriteRequests');
    if (stored) {
      setPendingRequests(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending requests when coming back online
  useEffect(() => {
    if (isOnline && pendingRequests.length > 0) {
      syncPendingRequests();
    }
  }, [isOnline, pendingRequests.length]);

  const syncPendingRequests = async () => {
    setSyncStatus('syncing');
    
    const failedRequests: PendingRequest[] = [];
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(request.body),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to sync request:', error);
        failedRequests.push(request);
      }
    }

    if (failedRequests.length > 0) {
      setPendingRequests(failedRequests);
      localStorage.setItem('pendingAppwriteRequests', JSON.stringify(failedRequests));
      setSyncStatus('error');
    } else {
      setPendingRequests([]);
      localStorage.removeItem('pendingAppwriteRequests');
      setSyncStatus('idle');
    }
  };

  const queueRequest = useCallback((request: Omit<PendingRequest, 'id' | 'timestamp'>) => {
    const newRequest: PendingRequest = {
      ...request,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const updatedRequests = [...pendingRequests, newRequest];
    setPendingRequests(updatedRequests);
    localStorage.setItem('pendingAppwriteRequests', JSON.stringify(updatedRequests));
  }, [pendingRequests]);

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit & { body?: any }
  ) => {
    if (isOnline) {
      // Online: make the request directly
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        // If request fails, queue it
        queueRequest({
          url,
          method: options.method || 'GET',
          headers: options.headers as Record<string, string> || {},
          body: options.body,
        });
        throw error;
      }
    } else {
      // Offline: queue the request
      queueRequest({
        url,
        method: options.method || 'GET',
        headers: options.headers as Record<string, string> || {},
        body: options.body,
      });
      
      // Return a mock response for offline mode
      return new Response(JSON.stringify({ 
        message: 'Request queued for sync when online',
        offline: true 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }, [isOnline, queueRequest]);

  return {
    isOnline,
    pendingRequests,
    syncStatus,
    makeRequest,
    syncPendingRequests,
    hasPendingRequests: pendingRequests.length > 0,
  };
}