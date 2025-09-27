"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";

interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToRootstock: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleChainChanged = (cid: string) => setChainId(cid);
    const handleAccountsChanged = (accs: string[]) => setAddress(accs[0] || null);

    eth.on("chainChanged", handleChainChanged);
    eth.on("accountsChanged", handleAccountsChanged);

    eth.request({ method: "eth_accounts" }).then(handleAccountsChanged);
    eth.request({ method: "eth_chainId" }).then(handleChainChanged);

    return () => {
      eth.removeListener("chainChanged", handleChainChanged);
      eth.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined') return;
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("Please install MetaMask!");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0] || null);
    } catch (error) {
      console.error("Failed to connect wallet", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  const switchToRootstock = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1f' }], // 31
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1f',
              chainName: 'Rootstock Testnet',
              nativeCurrency: { name: 'tRBTC', symbol: 'tRBTC', decimals: 18 },
              rpcUrls: ['https://public-node.testnet.rsk.co'],
              blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
            }],
          });
        } catch (addError) {
          console.error("Failed to add Rootstock Testnet", addError);
        }
      }
    }
  };

  const value = useMemo(() => ({
    address,
    chainId,
    isConnecting,
    connect,
    disconnect,
    switchToRootstock,
  }), [address, chainId, isConnecting]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
