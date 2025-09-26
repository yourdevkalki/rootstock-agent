import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(RPC_URL);

const ABI = [
  "event TaskCreated(uint256 indexed taskId, address indexed creator, address indexed targetContract, uint8 resolverType, bytes resolverData)",
  "event TaskExecuted(uint256 indexed taskId, address indexed executor, bool success, bytes returnData)",
  "event TaskCancelled(uint256 indexed taskId)",
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

export function wireEventLogs() {
  // eslint-disable-next-line no-console
  console.log("Subscribing to TaskRegistry events...");
  contract.on("TaskCreated", (taskId, creator, target, resolverType) => {
    // eslint-disable-next-line no-console
    console.log("TaskCreated", taskId.toString(), creator, target, resolverType);
  });
  contract.on("TaskExecuted", (taskId, executor, success) => {
    // eslint-disable-next-line no-console
    console.log("TaskExecuted", taskId.toString(), executor, success);
  });
  contract.on("TaskCancelled", (taskId) => {
    // eslint-disable-next-line no-console
    console.log("TaskCancelled", taskId.toString());
  });
}


