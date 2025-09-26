import "dotenv/config";
import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const DUMMY_TARGET = process.env.DUMMY_TARGET;

  const TaskRegistry = await hre.ethers.getContractAt(
    "TaskRegistry",
    CONTRACT_ADDRESS
  );

  console.log("📌 Creating a new TIME task on registry:", CONTRACT_ADDRESS);
  const iface = new hre.ethers.Interface(["function poke()"]);
  const callData = iface.encodeFunctionData("poke", []);
  const interval = 60; // 1 minute
  // ResolverType.Time = 0, resolverData = abi.encode(uint256 interval)
  const resolverData = hre.ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [BigInt(interval)]);
  const tx = await TaskRegistry.createTask(DUMMY_TARGET, callData, 0, resolverData);
  await tx.wait();

  console.log(`✅ Time task registered. tx: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
