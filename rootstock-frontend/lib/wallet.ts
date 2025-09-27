"use client"

import { useEffect, useState } from "react"

const LS_KEY = "wallet:address"

export function setWalletAddress(addr: string | null) {
  if (typeof window === "undefined") return
  if (addr) localStorage.setItem(LS_KEY, addr)
  else localStorage.removeItem(LS_KEY)
  window.dispatchEvent(new CustomEvent("wallet:change", { detail: addr }))
}

export function getWalletAddress(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LS_KEY)
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)

  useEffect(() => {
    setAddress(getWalletAddress())

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | null
      setAddress(detail ?? getWalletAddress())
    }
    const storageHandler = () => setAddress(getWalletAddress())
    window.addEventListener("wallet:change", handler as EventListener)
    window.addEventListener("storage", storageHandler)

    // try to read EIP-1193 chainId
    const eth = (window as any).ethereum
    if (eth?.request) {
      eth
        .request({ method: "eth_chainId" })
        .then((cid: string) => setChainId(cid))
        .catch(() => {})
      eth.on?.("chainChanged", (cid: string) => setChainId(cid))
      eth.on?.("accountsChanged", (accs: string[]) => {
        const next = accs?.[0] || null
        setWalletAddress(next)
      })
    }

    return () => {
      window.removeEventListener("wallet:change", handler as EventListener)
      window.removeEventListener("storage", storageHandler)
      eth?.removeListener?.("chainChanged", (cid: string) => setChainId(cid))
    }
  }, [])

  return { address, chainId }
}
