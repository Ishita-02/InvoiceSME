"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Web3Service from '../components/services/Web3Service';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setError(null);
    localStorage.setItem('wallet_disconnected', 'true');
    localStorage.removeItem('isWalletConnected'); // ✅ ensure this flag is cleared
    console.log("Wallet disconnected.");
  }, []);

  const connectWallet = useCallback(async () => {
    localStorage.removeItem('wallet_disconnected');
    setIsLoading(true);
    setError(null);
    try {
      const acc = await Web3Service.connectWallet();
      if (acc) {
        setAccount(acc);
        localStorage.setItem("isWalletConnected", "true"); // ✅ store flag for reload persistence
      } else {
        disconnectWallet();
      }
    } catch (err) {
      console.error("Connection Error:", err);
      setError(err.message);
      disconnectWallet();
    } finally {
      setIsLoading(false);
    }
  }, [disconnectWallet]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      const checkExistingConnection = async () => {
        const isDisconnected = localStorage.getItem('wallet_disconnected') === 'true';
        const wasConnected = localStorage.getItem('isWalletConnected') === 'true'; // ✅ new check

        if (isDisconnected) {
          setIsLoading(false);
          return;
        }

        try {
          // ✅ Auto reconnect if previously connected
          if (wasConnected) {
            await connectWallet();
          } else if (await Web3Service.isConnected()) {
            await connectWallet();
          } else {
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Auto reconnect failed:", e);
          setIsLoading(false);
        }
      };

      checkExistingConnection();

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    } else {
      setIsLoading(false);
    }
  }, [connectWallet, disconnectWallet]);

  const value = {
    account,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
