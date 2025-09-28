import "dotenv/config";
import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const ABI = [
  "function createTask(address _targetContract, bytes calldata _callData, uint8 _resolverType, bytes calldata _resolverData) external returns (uint256)",
  "function executeTask(uint256 _taskId) external returns (bool success, bytes memory returnData)",
  "function cancelTask(uint256 _taskId) external",
  "function getTaskCount() external view returns (uint256)",
  "function getTask(uint256 _taskId) external view returns (address creator, address targetContract, bytes memory callData, uint8 resolverType, bytes memory resolverData, uint256 lastRun, bool active)",
  "event TaskCreated(uint256 indexed taskId, address indexed creator, address indexed targetContract, uint8 resolverType, bytes resolverData)",
  "event TaskExecuted(uint256 indexed taskId, address indexed executor, bool success, bytes returnData)",
  "event TaskCancelled(uint256 indexed taskId)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log("🤖 Automation bot started...");
  console.log(`📋 Monitoring contract: ${CONTRACT_ADDRESS}`);

  // Polling: check every minute
  setInterval(async () => {
    try {
      console.log("🔍 Checking tasks...");

      // Get the total number of tasks first
      const taskCount = await contract.getTaskCount();
      console.log(`📊 Total tasks: ${taskCount}`);

      // Check all existing tasks
      for (let taskId = 0; taskId < Number(taskCount); taskId++) {
        try {
          const task = await contract.getTask(taskId);

          // Check if task is active
          if (task.active) {
            const now = Math.floor(Date.now() / 1000);
            const timeSinceLastExecution = now - Number(task.lastRun);

            console.log(`📋 Task ${taskId}:`);
            console.log(`   Creator: ${task.creator}`);
            console.log(`   Target Contract: ${task.targetContract}`);
            console.log(`   Interval: ${task.interval}s`);
            console.log(`   Last Run: ${timeSinceLastExecution}s ago`);
            console.log(`   Active: ${task.active}`);

            if (timeSinceLastExecution > Number(task.interval)) {
              console.log(`⚡ Time to execute task ${taskId}!`);
              console.log(`   Call Data: ${task.callData}`);
              // Here you can add: swap, LP, or any DeFi action
              // You would call the target contract with the callData
            }
          }
        } catch (taskErr) {
          console.error(`Error checking task ${taskId}:`, taskErr.message);
          continue;
        }
      }
    } catch (err) {
      console.error("Error checking tasks:", err.message);
    }
  }, 600 * 1000);
}

main();
