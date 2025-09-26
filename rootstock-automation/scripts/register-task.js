import "dotenv/config";
import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  const TaskRegistry = await hre.ethers.getContractAt(
    "TaskRegistry",
    CONTRACT_ADDRESS
  );

  console.log("📌 Creating a new task...");

  // For this example, we'll create a task that calls a dummy contract
  // In a real scenario, you'd provide the actual target contract address and call data
  const targetContract = "0x0000000000000000000000000000000000000000"; // Dummy address
  const callData = "0x"; // Empty call data for now
  const interval = 300; // 5 minutes in seconds

  const tx = await TaskRegistry.createTask(targetContract, callData, interval);

  await tx.wait();

  console.log(`✅ Task registered at tx: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
