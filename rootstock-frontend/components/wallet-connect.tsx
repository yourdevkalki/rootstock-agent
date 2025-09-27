"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Wallet, ExternalLink, LogOut } from "lucide-react"

function formatAddress(addr?: string) {
  if (!addr) return ""
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Simple toast replacement since sonner might not be available

import { useWallet } from "@/lib/wallet"

export function WalletConnect() {
  const { address, chainId, isConnecting, connect, disconnect, switchToRootstock } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const isOnRootstockTestnet = useMemo(() => {
    if (!chainId) return false;
    return chainId === "0x1f" || parseInt(chainId) === 31;
  }, [chainId]);

  const handleConnect = async () => {
    await connect();
    setIsOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  const chainLabel = useMemo(() => {
    if (!chainId) return "Unknown Network"
    
    const chainIdNum = chainId.startsWith('0x') 
      ? parseInt(chainId, 16) 
      : parseInt(chainId)
    
    switch (chainIdNum) {
      case 1: return "Ethereum Mainnet"
      case 31: return "Rootstock Testnet"
      case 137: return "Polygon Mainnet"
      case 80001: return "Polygon Mumbai"
      default: return `Chain ${chainIdNum}`
    }
  }, [chainId])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-border/60 bg-transparent hover:bg-accent/50 transition-colors"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {address ? formatAddress(address) : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Network Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
            <div>
              <div className="text-sm text-foreground/60 mb-1">Network</div>
              <div className="font-medium text-foreground">{chainLabel}</div>
            </div>
            
            <div className="flex gap-2">
              {isOnRootstockTestnet ? (
                <Badge style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}>
                  ✓ Ready
                </Badge>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToRootstock}
                    className="text-xs border-border/60 hover:bg-accent/50"
                  >
                    Switch Network
                  </Button>
                  <Badge style={{ backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)" }}>
                    Switch Required
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Address Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
            <div>
              <div className="text-sm text-foreground/60 mb-1">Address</div>
              <div className="font-medium font-mono text-foreground">
                {address ? formatAddress(address) : "Not connected"}
              </div>
            </div>
            
            <div className="flex gap-2">
              {address ? (
                <>
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="btn-gradient text-primary-foreground"
                  >
                    {isConnecting ? "Connecting..." : "Reconnect"}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting}
                  className="btn-gradient text-primary-foreground"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {!address && (
            <div className="text-sm text-foreground/60 text-center p-4 border border-border/50 rounded-lg bg-accent/20">
              <div className="mb-2">No wallet detected?</div>
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-accent-foreground hover:text-foreground transition-colors"
              >
                Install MetaMask <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}