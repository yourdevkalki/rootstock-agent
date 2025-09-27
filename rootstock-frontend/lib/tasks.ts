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

// Helper to transform the raw backend task into the frontend format
export function transformTask(task: any): Task {
  const { resolver, active, taskId } = task;
  const id = taskId.toString();
  let type: TaskType = "time";
  let condition: any = {};

  // Handle the resolver object structure from your backend
  if (resolver.type === "Time") {
    type = "time";
    condition.intervalHours = Number(resolver.interval) / 3600;
  } else if (resolver.type === "Price") {
    type = "price";
    // You'll need to adjust this based on your actual price resolver structure
    condition.token = resolver.priceId || "UNKNOWN";
    condition.direction = resolver.comparator === 1 ? "above" : "below";
    condition.threshold = Number(resolver.targetPrice || 0) / (10 ** Math.abs(resolver.targetExpo || 2));
  }

  return {
    ...task,
    id,
    type,
    condition,
    status: active ? "active" : "cancelled",
    // These are placeholder values as they are not available from the backend yet
    action: "swap" as TaskAction,
    funds: { amount: 0, token: "N/A" },
    createdAt: Date.now(), // Placeholder
    history: [],
    // Add the backend fields
    resolverType: resolver.type === "Time" ? 0 : 1,
    resolverData: "", // You might need to reconstruct this
    lastRun: Number(task.lastRun || 0),
  };
}

export async function getTasks(): Promise<Task[]> {
  const rawTasks = await apiFetch("/tasks");
  console.log("Raw tasks from API:", rawTasks);
  if (!Array.isArray(rawTasks)) return [];
  const transformedTasks = rawTasks.map(transformTask);
  console.log("Transformed tasks:", transformedTasks);
  return transformedTasks;
}

export async function getTask(id: string): Promise<Task | undefined> {
  return apiFetch(`/tasks/${id}`)
}

// The `input` here will come from the form. We need to adapt it to the backend's expectations.
export async function createTask(input: any): Promise<{ taskId: string }> {
  const { type, condition, swap } = input

  const DUMMY_SWAP_ADDRESS = process.env.NEXT_PUBLIC_DUMMY_SWAP_ADDRESS || "";
  const XBTC_ADDRESS = process.env.NEXT_PUBLIC_XBTC_ADDRESS || "";
  const XUSD_ADDRESS = process.env.NEXT_PUBLIC_XUSD_ADDRESS || "";

  if (!DUMMY_SWAP_ADDRESS || !XBTC_ADDRESS || !XUSD_ADDRESS) {
    throw new Error("Required contract addresses are not configured in environment variables.");
  }

  const targetContract = ethers.getAddress(DUMMY_SWAP_ADDRESS);

  // Determine the correct function signature based on the input token
  const functionSignature = swap.tokenIn.toLowerCase() === XBTC_ADDRESS.toLowerCase()
    ? "swapXBTCForXUSD(uint256)"
    : "swapXUSDForXBTC(uint256)";

  // The DummySwap contract expects only the amount as an argument
  const amountIn = ethers.parseUnits(swap.amountIn, 18); // Assuming 18 decimals
  const args = [amountIn.toString()];

  if (type === "time") {
    return apiFetch("/tasks/time", {
      method: "POST",
      body: JSON.stringify({
        targetContract: targetContract,
        functionSignature: functionSignature,
        args: args,
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
        functionSignature: functionSignature,
        args: args,
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
  const fetcher = async () => {
    const tasks = await getTasks();
    console.log("useTasks fetcher result:", tasks);
    return tasks;
  }

  const { data, isLoading, mutate, error } = useSWR(["tasks", owner], fetcher, {
    revalidateOnFocus: false,
  });

  console.log("useTasks hook state:", { data, isLoading, error });

  const setCancelled = async (id: string) => {
    try {
      await cancelTask(id);
      await mutate(); // Re-fetch tasks
    } catch (error) {
      console.error("Error cancelling task:", error);
      throw error;
    }
  }

  return {
    tasks: data ?? [],
    isLoading: !!isLoading,
    error,
    refresh: () => mutate(),
    setCancelled,
  }
}