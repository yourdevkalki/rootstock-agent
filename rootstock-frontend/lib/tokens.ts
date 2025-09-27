import { apiFetch } from "./utils";

export interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

export interface TokenListResponse {
  tokens: Token[];
  swapContract: string;
}

/**
 * Fetches the list of available tokens from the backend.
 */
export async function getAvailableTokens(): Promise<TokenListResponse> {
  return apiFetch("/dummy-tokens/tokens");
}

/**
 * Gets a swap quote from the backend.
 */
export async function getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string): Promise<{ amountOut: string }> {
  return apiFetch("/dummy-tokens/quote", {
    method: "POST",
    body: JSON.stringify({ tokenIn, tokenOut, amountIn }),
  });
}

/**
 * Executes a swap on the backend.
 */
export async function executeSwap(tokenIn: string, tokenOut: string, amountIn: string, minAmountOut: string, recipient: string) {
  return apiFetch("/dummy-tokens/swap", {
    method: "POST",
    body: JSON.stringify({ tokenIn, tokenOut, amountIn, minAmountOut, recipient }),
  });
}
