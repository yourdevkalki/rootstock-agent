import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Initial supply: 1 million tokens each
  const initialSupply = 1000000; // This will be multiplied by 10^18 in the contract

  // Deploy xBTC
  const XBTCFactory = await ethers.getContractFactory("XBTC");
  const xbtc = await XBTCFactory.deploy(initialSupply);
  await xbtc.waitForDeployment();
  const xbtcAddress = await xbtc.getAddress();
  console.log("xBTC deployed to:", xbtcAddress);

  // Deploy xUSDC
  const XUSDCFactory = await ethers.getContractFactory("XUSDC");
  const xusdc = await XUSDCFactory.deploy(initialSupply);
  await xusdc.waitForDeployment();
  const xusdcAddress = await xusdc.getAddress();
  console.log("xUSDC deployed to:", xusdcAddress);

  // Deploy DummySwap
  const DummySwapFactory = await ethers.getContractFactory("DummySwap");
  const dummySwap = await DummySwapFactory.deploy(xbtcAddress, xusdcAddress);
  await dummySwap.waitForDeployment();
  const dummySwapAddress = await dummySwap.getAddress();
  console.log("DummySwap deployed to:", dummySwapAddress);

  // Add initial liquidity to the swap contract
  const xbtcLiquidity = ethers.parseEther("10"); // 10 xBTC
  const xusdcLiquidity = ethers.parseEther("1100000"); // 1,100,000 xUSDC (roughly 110k USD per BTC)

  console.log("\nAdding initial liquidity...");

  // Approve DummySwap to spend tokens
  await xbtc.approve(dummySwapAddress, xbtcLiquidity);
  await xusdc.approve(dummySwapAddress, xusdcLiquidity);

  // Add liquidity
  await dummySwap.addLiquidity(xbtcLiquidity, xusdcLiquidity);
  console.log("Initial liquidity added!");

  // Get reserves
  const [xbtcReserve, xusdcReserve] = await dummySwap.getReserves();
  console.log("xBTC Reserve:", ethers.formatEther(xbtcReserve));
  console.log("xUSDC Reserve:", ethers.formatEther(xusdcReserve));

  // Get current price
  const price = await dummySwap.getPrice();
  console.log("Current Price (xUSDC per xBTC):", ethers.formatEther(price));

  console.log("\n=== Deployment Summary ===");
  console.log("xBTC:", xbtcAddress);
  console.log("xUSDC:", xusdcAddress);
  console.log("DummySwap:", dummySwapAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
