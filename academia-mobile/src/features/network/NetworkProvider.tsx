import React, { createContext, useContext, useMemo } from 'react';
import { useNetworkState } from 'expo-network';

interface NetworkValue {
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkValue>({ isOffline: false });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const state = useNetworkState();

  const isOffline =
    state.isConnected === false ||
    (state.isConnected === true && state.isInternetReachable === false);

  const value = useMemo(() => ({ isOffline }), [isOffline]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkValue {
  return useContext(NetworkContext);
}
