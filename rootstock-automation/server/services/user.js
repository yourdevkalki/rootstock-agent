import { ethers } from "ethers";
import { abiEncodeFunctionCalldata, createPriceTask } from "./tasks.js";
import { isMock } from "../py.config.mjs";

// For demo, spender is the TaskRegistry contract (pulls tokens via transferFrom)
export function getSpenderAddress() {
  return process.env.CONTRACT_ADDRESS;
}

// In-memory strategy store (frontend can POST strategies; we also persist on-chain via tasks)
const memoryStore = new Map(); // key: wallet -> strategies[]

export function storeUserStrategy(wallet, strategy) {
  const key = wallet.toLowerCase();
  const list = memoryStore.get(key) || [];
  list.push({ ...strategy, createdAt: Date.now() });
  memoryStore.set(key, list);
}

export function getUserStrategies(wallet) {
  return memoryStore.get(wallet.toLowerCase()) || [];
}

// High-level helper to create a limit order task
export async function createLimitOrderTask({
  router,
  tokenIn,
  tokenOut,
  fee,
  amountIn,
  minOut,
  recipient,
  deadline,
  owner,
  priceId,
  comparator,
  targetPrice,
  targetExpo,
}) {
  if (isMock()) {
    return "limit_order_" + Date.now();
  }
  
  const functionSignature =
    "executeSwapExactInputSingle(address,address,address,address,uint24,uint256,uint256,address,uint256)";
  const args = [owner, router, tokenIn, tokenOut, fee, amountIn, minOut, recipient, deadline];
  const callData = abiEncodeFunctionCalldata(functionSignature, args);
  const taskId = await createPriceTask(
    process.env.CONTRACT_ADDRESS,
    callData,
    priceId,
    comparator,
    BigInt(targetPrice),
    Number(targetExpo)
  );
  return taskId;
}


