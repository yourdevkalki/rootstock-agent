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
function showToast(message: string, description?: string) {
  if (typeof window !== 'undefined') {
    console.log(description ? `${message}: ${description}` : message)
    // You can replace this with your actual toast implementation
  }
}

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Rootstock Testnet chain ID is 31 (0x1f in hex)
  const isOnRootstockTestnet = useMemo(() => {
    if (!chainId) return false
    return chainId === "0x1f" || parseInt(chainId) === 31
  }, [chainId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const eth = (window as any).ethereum
    if (!eth) return

    // Get initial chain ID
    eth
      .request({ method: "eth_chainId" })
      .then((cid: string) => {
        console.log("Initial chain ID:", cid)
        setChainId(cid)
      })
      .catch((error: any) => {
        console.log("Failed to get chain ID:", error)
      })

    // Get initial accounts
    eth
      .request({ method: "eth_accounts" })
      .then((accs: string[]) => {
        console.log("Initial accounts:", accs)
        setAddress(accs[0] || null)
      })
      .catch((error: any) => {
        console.log("Failed to get accounts:", error)
      })

    // Event handlers
    const handleChain = (cid: string) => {
      console.log("Chain changed to:", cid)
      setChainId(cid)
    }
    
    const handleAccounts = (accs: string[]) => {
      console.log("Accounts changed to:", accs)
      setAddress(accs[0] || null)
    }

    // Add event listeners
    if (eth.on) {
      eth.on("chainChanged", handleChain)
      eth.on("accountsChanged", handleAccounts)
    }

    return () => {
      // Clean up event listeners
      if (eth.removeListener) {
        eth.removeListener("chainChanged", handleChain)
        eth.removeListener("accountsChanged", handleAccounts)
      }
    }
  }, [])

  const disconnect = () => {
    setAddress(null)
    setChainId(null)
    showToast("Wallet disconnected")
    setIsOpen(false)
  }

  const switchToRootstock = async () => {
    const eth = (window as any).ethereum
    if (!eth) {
      showToast("No wallet found", "Please install MetaMask")
      return
    }

    try {
      // Try to switch to Rootstock Testnet
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1f' }], // 31 in hex
      })
      showToast("Switched to Rootstock Testnet")
    } catch (switchError: any) {
      // If the chain is not added, add it
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1f',
              chainName: 'Rootstock Testnet',
              nativeCurrency: {
                name: 'Rootstock Bitcoin',
                symbol: 'tRBTC',
                decimals: 18,
              },
              rpcUrls: ['https://public-node.testnet.rsk.co'],
              blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
            }],
          })
          showToast("Added Rootstock Testnet")
        } catch (addError) {
          console.error("Failed to add chain:", addError)
          showToast("Failed to add Rootstock Testnet")
        }
      } else {
        console.error("Failed to switch chain:", switchError)
        showToast("Failed to switch to Rootstock Testnet")
      }
    }
  }

  const connect = async () => {
    if (typeof window === 'undefined') return

    const eth = (window as any).ethereum
    
    if (!eth) {
      // Fallback demo wallet for testing
      const demo = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
      
      setAddress(demo)
      setChainId("0x1f") // Set to Rootstock Testnet for demo
      showToast("Connected demo wallet", "Install MetaMask to connect a real wallet")
      return
    }

    setIsConnecting(true)
    
    try {
      // Request account access
      const accounts = await eth.request({ method: "eth_requestAccounts" })
      
      if (accounts.length > 0) {
        setAddress(accounts[0])
        
        // Get current chain ID after connection
        const currentChainId = await eth.request({ method: "eth_chainId" })
        setChainId(currentChainId)
        
        showToast("Wallet connected successfully!")
        setIsOpen(false)
      }
    } catch (error: any) {
      console.error("Connection error:", error)
      
      if (error.code === 4001) {
        showToast("Connection canceled", "User rejected the connection request")
      } else {
        showToast("Connection failed", "Please try again")
      }
    } finally {
      setIsConnecting(false)
    }
  }

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
                    onClick={disconnect}
                    variant="outline"
                    size="sm"
                    className="border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                  <Button 
                    onClick={connect} 
                    disabled={isConnecting}
                    className="btn-gradient text-primary-foreground"
                  >
                    {isConnecting ? "Connecting..." : "Reconnect"}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={connect} 
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