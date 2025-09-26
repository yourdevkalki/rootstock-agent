import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(RPC_URL);

const ABI = [
  "event TaskCreated(uint256 indexed taskId, address indexed creator, address indexed targetContract, uint8 resolverType, bytes resolverData)",
  "event TaskExecuted(uint256 indexed taskId, address indexed executor, bool success, bytes returnData)",
  "event TaskCancelled(uint256 indexed taskId)",
];

// Configure polling behaviour
const POLL_INTERVAL_MS = Number(process.env.LOG_POLL_INTERVAL_MS || 5000);
const LOG_WINDOW_BLOCKS = Number(process.env.LOG_WINDOW_BLOCKS || 1000);
const START_FROM_BLOCK = process.env.START_FROM_BLOCK
  ? Number(process.env.START_FROM_BLOCK)
  : undefined;

const iface = new ethers.Interface(ABI);

let lastProcessedBlock = 0;
let polling = false;
let intervalHandle;

async function handleLogs(fromBlock, toBlock) {
  const logs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    fromBlock,
    toBlock,
  });

  for (const log of logs) {
    // eslint-disable-next-line no-console
    console.log("Raw log:", {
      address: log.address,
      topics: log.topics,
      data: log.data,
      blockNumber: log.blockNumber,
    });

    let parsed;
    try {
      parsed = iface.parseLog({ topics: log.topics, data: log.data });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("Failed to parse log:", err.message);
      continue;
    }

    if (parsed.name === "TaskCreated") {
      const [taskId, creator, targetContract, resolverType, resolverData] =
        parsed.args;
      // eslint-disable-next-line no-console
      console.log(
        "TaskCreated",
        taskId.toString(),
        creator,
        targetContract,
        Number(resolverType),
        resolverData
      );
    } else if (parsed.name === "TaskExecuted") {
      const [taskId, executor, success, returnData] = parsed.args;
      // eslint-disable-next-line no-console
      console.log(
        "TaskExecuted",
        taskId.toString(),
        executor,
        Boolean(success),
        returnData
      );
    } else if (parsed.name === "TaskCancelled") {
      const [taskId] = parsed.args;
      // eslint-disable-next-line no-console
      console.log("TaskCancelled", taskId.toString());
    }
  }
}

async function pollOnce() {
  if (polling) return;
  polling = true;
  try {
    const latest = await provider.getBlockNumber();
    if (lastProcessedBlock === 0) {
      lastProcessedBlock = START_FROM_BLOCK ?? latest; // start from current block unless overridden
    }

    // Nothing new
    if (latest <= lastProcessedBlock) return;

    let nextFrom = lastProcessedBlock + 1;
    while (nextFrom <= latest) {
      const nextTo = Math.min(nextFrom + LOG_WINDOW_BLOCKS - 1, latest);
      await handleLogs(nextFrom, nextTo);
      lastProcessedBlock = nextTo;
      nextFrom = nextTo + 1;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Log polling error", err?.message || err);
  } finally {
    polling = false;
  }
}

export function wireEventLogs() {
  // eslint-disable-next-line no-console
  console.log(
    `Polling TaskRegistry logs via eth_getLogs (interval=${POLL_INTERVAL_MS}ms, window=${LOG_WINDOW_BLOCKS} blocks)`
  );
  // kick immediately, then on interval
  pollOnce();
  intervalHandle = setInterval(pollOnce, POLL_INTERVAL_MS);
}

export function stopEventLogs() {
  if (intervalHandle) clearInterval(intervalHandle);
}
