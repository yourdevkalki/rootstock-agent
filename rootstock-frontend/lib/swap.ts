// API integration for swaps

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  if (!res.ok) {
    const errorBody = await res.text()
    console.error("API Error:", errorBody)
    throw new Error(`API request failed: ${res.statusText}`)
  }
  return res.json()
}

export async function getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string, fee?: number) {
  return apiFetch("/swap/quote/exact-input", {
    method: "POST",
    body: JSON.stringify({ tokenIn, tokenOut, amountIn, fee }),
  })
}

export async function executeSwap(tokenIn: string, tokenOut: string, amountIn: string, amountOutMinimum: string, recipient: string, fee?: number) {
  return apiFetch("/swap/execute/exact-input", {
    method: "POST",
    body: JSON.stringify({ tokenIn, tokenOut, amountIn, amountOutMinimum, recipient, fee }),
  })
}

export async function getAvailableTokens(): Promise<any> {
  // As requested, returning a hardcoded list of tokens for now.
  // These addresses are for demonstration purposes and are not real.
  return Promise.resolve({
    tokens: [
      {
        name: "USD Coin",
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
      {
        name: "Tether",
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    ],
  });
}
