// API integration for tasks

import useSWR from "swr"
import { ethers } from "ethers"

// The base URL of the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export type TaskType = "time" | "price"
export type TaskAction = "swap" | "compound" | "stake"
export type TaskStatus = "active" | "executed" | "cancelled"
export type Direction = "above" | "below"

// This interface is a bit of a mix between the backend's Task and the frontend's display needs.
// It should be kept in sync with the backend's Task structure.
export interface Task {
  id: string // This will be the taskId from the backend (a number, but we'll use it as a string)
  type: TaskType
  action: TaskAction // This is a frontend concept for now
  condition: {
    // time-based
    intervalHours?: number
    // price-based
    token?: string
    threshold?: number
    direction?: Direction
  }
  funds: { amount: number; token: string } // This is a frontend concept
  status: TaskStatus
  createdAt: number
  history: Array<{ timestamp: number; executor: string; txHash: string; result: "success" | "fail" }>

  // Fields from the actual backend Task struct
  creator: string
  targetContract: string
  callData: string
  resolverType: number // 0 for Time, 1 for Price
  resolverData: string
  lastRun: number
  active: boolean
}

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

export async function getTasks(): Promise<Task[]> {
  return apiFetch("/tasks")
}

export async function getTask(id: string): Promise<Task | undefined> {
  return apiFetch(`/tasks/${id}`)
}

// The `input` here will come from the form. We need to adapt it to the backend's expectations.
export async function createTask(input: any): Promise<{ taskId: string }> {
  const { type, condition, swap } = input

  const UNISWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_UNISWAP_ROUTER_ADDRESS || "0xD34443CeC1492B9ceD1500cC899b108f5D7C16a4";
  const SWAP_FUNCTION_SIGNATURE = "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))";

  const targetContract = ethers.getAddress(UNISWAP_ROUTER_ADDRESS);

  // Encode the swap parameters
  const swapParams = {
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    fee: 3000, // Standard fee tier
    recipient: targetContract, // The router will send the tokens to itself to hold
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
    amountIn: ethers.parseUnits(swap.amountIn, 18), // Assuming 18 decimals
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  const abiCoder = new ethers.AbiCoder();
  const encodedArgs = abiCoder.encode(
    ["tuple(address,address,uint24,address,uint256,uint256,uint256,uint160)"],
    [Object.values(swapParams)]
  );

  if (type === "time") {
    return apiFetch("/tasks/time", {
      method: "POST",
      body: JSON.stringify({
        targetContract: targetContract,
        functionSignature: SWAP_FUNCTION_SIGNATURE,
        args: [encodedArgs],
        intervalSeconds: condition.intervalHours * 3600,
      }),
    })
  } else if (type === "price") {
    const priceIds: { [key: string]: string } = {
      RBTC: "0x...", // Replace with actual price IDs from Pyth
      USDR: "0x...",
      DOC: "0x...",
    }

    return apiFetch("/tasks/price", {
      method: "POST",
      body: JSON.stringify({
        targetContract: targetContract,
        functionSignature: SWAP_FUNCTION_SIGNATURE,
        args: [encodedArgs],
        priceId: priceIds[condition.token] || condition.token, // Use mapping or pass through
        comparator: condition.direction === "above" ? 1 : 2, // 1 for Gt, 2 for Lt
        targetPrice: Math.floor(condition.threshold * 100), // Assuming 2 decimal places
        targetExpo: -2,
      }),
    })
  } else {
    throw new Error(`Unsupported task type: ${type}`)
  }
}

export async function cancelTask(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/tasks/${id}/cancel`, { method: "POST" })
}

export function useTasks(owner?: string) {
  // Note: owner currently unused because the backend doesn't filter by owner yet.
  const fetcher = async () => getTasks()

  const { data, isLoading, mutate } = useSWR(["tasks", owner], fetcher)

  const setCancelled = async (id: string) => {
    await cancelTask(id)
    await mutate() // Re-fetch the tasks list
  }

  return {
    tasks: data ?? [],
    isLoading: !!isLoading,
    refresh: () => mutate(),
    setCancelled,
  }
}
