import { ethers } from "ethers";
import { getLatestPythPrice, comparePrice } from "./pyth.js";
import { isMock } from "../py.config.mjs";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Minimal ABI for our upgraded registry
const ABI = [
  "event TaskCreated(uint256 indexed taskId, address indexed creator, address indexed targetContract, uint8 resolverType, bytes resolverData)",
  "event TaskExecuted(uint256 indexed taskId, address indexed executor, bool success, bytes returnData)",
  "event TaskCancelled(uint256 indexed taskId)",
  "function createTask(address _targetContract, bytes _callData, uint8 _resolverType, bytes _resolverData) external returns (uint256)",
  "function executeTask(uint256 _taskId) external returns (bool, bytes)",
  "function cancelTask(uint256 _taskId) external",
  "function getTaskCount() external view returns (uint256)",
  "function getTask(uint256 _taskId) external view returns (address,address,bytes,uint8,bytes,uint256,bool)",
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
const coder = ethers.AbiCoder.defaultAbiCoder();

export function abiEncodeFunctionCalldata(functionSignature, args) {
  const iface = new ethers.Interface([`function ${functionSignature}`]);
  const fragmentName = functionSignature.split("(")[0];
  return iface.encodeFunctionData(fragmentName, args);
}

export async function createTimeTask(targetContract, callData, intervalSeconds) {
  if (isMock()) return "1";
  const resolverData = coder.encode(["uint256"], [intervalSeconds]);
  const tx = await contract.createTask(targetContract, callData, 0, resolverData);
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "TaskCreated");
  return event?.args?.taskId?.toString() ?? null;
}

export async function createPriceTask(targetContract, callData, priceId, comparator, targetPrice, targetExpo) {
  if (isMock()) return "2";
  const comparatorFlag = comparator === "gte" ? 0 : 1; // 0: >=, 1: <=
  const resolverData = coder.encode(["bytes32", "int64", "int32", "uint8"], [priceId, targetPrice, targetExpo, comparatorFlag]);
  const tx = await contract.createTask(targetContract, callData, 1, resolverData);
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "TaskCreated");
  return event?.args?.taskId?.toString() ?? null;
}

export async function getAllTasks() {
  if (isMock()) return [];
  const count = await contract.getTaskCount();
  const tasks = [];
  for (let i = 0n; i < count; i++) {
    // eslint-disable-next-line no-await-in-loop
    const t = await contract.getTask(i);
    tasks.push(await formatTask(i, t));
  }
  return tasks;
}

export async function describeTask(taskId) {
  if (isMock()) return { taskId: String(taskId), active: true, resolver: { type: "Time", interval: "60" }, lastRun: "0" };
  const t = await contract.getTask(taskId);
  return formatTask(BigInt(taskId), t);
}

async function formatTask(taskId, tuple) {
  const [creator, targetContract, callData, resolverType, resolverData, lastRun, active] = tuple;
  const typeStr = resolverType === 0 ? "Time" : "Price";
  let decoded;
  if (resolverType === 0) {
    const [interval] = coder.decode(["uint256"], resolverData);
    decoded = { interval: interval.toString() };
  } else {
    const [priceId, targetPrice, targetExpo, comparatorFlag] = coder.decode(
      ["bytes32", "int64", "int32", "uint8"],
      resolverData
    );
    decoded = {
      priceId,
      targetPrice: targetPrice.toString(),
      targetExpo: Number(targetExpo),
      comparator: comparatorFlag === 0 ? "gte" : "lte",
    };
  }
  return {
    taskId: taskId.toString(),
    creator,
    targetContract,
    callData,
    resolver: { type: typeStr, ...decoded },
    lastRun: lastRun.toString(),
    active,
  };
}

export async function executeTask(taskId) {
  if (isMock()) return { txHash: "0xmock", success: true };
  const tx = await contract.executeTask(taskId);
  const receipt = await tx.wait();
  const ev = receipt.logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "TaskExecuted");
  return { txHash: receipt.hash, success: ev?.args?.success };
}

export async function cancelTask(taskId) {
  if (isMock()) return { ok: true };
  const tx = await contract.cancelTask(taskId);
  await tx.wait();
}

export async function evaluateShouldExecute(task) {
  if (!task.active) return false;
  if (task.resolver.type === "Time") {
    const now = Math.floor(Date.now() / 1000);
    const last = Number(task.lastRun);
    const interval = Number(task.resolver.interval);
    const due = now - last >= interval;
    // eslint-disable-next-line no-console
    console.log(
      `[EVAL][Time] task=${task.taskId} now=${now} last=${last} interval=${interval} due=${due}`
    );
    return due;
  }
  // price-based
  const { priceId, targetPrice, targetExpo, comparator } = task.resolver;
  const latest = await getLatestPythPrice(priceId);
  const result = comparePrice(
    { price: BigInt(latest.price), expo: latest.expo },
    comparator,
    BigInt(targetPrice),
    Number(targetExpo)
  );
  // eslint-disable-next-line no-console
  console.log(
    `[EVAL][Price] task=${task.taskId} priceId=${priceId} latest.price=${latest.price} latest.expo=${latest.expo} comparator=${comparator} targetPrice=${targetPrice} targetExpo=${targetExpo} should=${result}`
  );
  return result;
}


