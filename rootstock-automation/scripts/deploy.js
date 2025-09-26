import hre from "hardhat";

async function main() {
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy();

  await taskRegistry.waitForDeployment();

  console.log("TaskRegistry deployed to:", await taskRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
