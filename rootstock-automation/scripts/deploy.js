import hre from "hardhat";

async function main() {
  console.log("Deploying contracts with account:", (await hre.ethers.getSigners())[0].address);

  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy();
  await taskRegistry.waitForDeployment();
  const registryAddress = await taskRegistry.getAddress();
  console.log("TaskRegistry deployed to:", registryAddress);

  const DummyTarget = await hre.ethers.getContractFactory("DummyTarget");
  const dummy = await DummyTarget.deploy();
  await dummy.waitForDeployment();
  const dummyAddress = await dummy.getAddress();
  console.log("DummyTarget deployed to:", dummyAddress);

  console.log("Export env:");
  console.log(`CONTRACT_ADDRESS=${registryAddress}`);
  console.log(`DUMMY_TARGET=${dummyAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
