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

  // Deploy xUSD
  const XUSDFactory = await ethers.getContractFactory("XUSD");
  const xusd = await XUSDFactory.deploy(initialSupply);
  await xusd.waitForDeployment();
  const xusdAddress = await xusd.getAddress();
  console.log("xUSD deployed to:", xusdAddress);

  // Deploy DummySwap
  const DummySwapFactory = await ethers.getContractFactory("DummySwap");
  const dummySwap = await DummySwapFactory.deploy(xbtcAddress, xusdAddress);
  await dummySwap.waitForDeployment();
  const dummySwapAddress = await dummySwap.getAddress();
  console.log("DummySwap deployed to:", dummySwapAddress);

  // Add initial liquidity to the swap contract
  const xbtcLiquidity = ethers.parseEther("10"); // 10 xBTC
  const xusdLiquidity = ethers.parseEther("650000"); // 650,000 xUSD (roughly 65k USD per BTC)

  console.log("\nAdding initial liquidity...");

  // Approve DummySwap to spend tokens
  await xbtc.approve(dummySwapAddress, xbtcLiquidity);
  await xusd.approve(dummySwapAddress, xusdLiquidity);

  // Add liquidity
  await dummySwap.addLiquidity(xbtcLiquidity, xusdLiquidity);
  console.log("Initial liquidity added!");

  // Get reserves
  const [xbtcReserve, xusdReserve] = await dummySwap.getReserves();
  console.log("xBTC Reserve:", ethers.formatEther(xbtcReserve));
  console.log("xUSD Reserve:", ethers.formatEther(xusdReserve));

  // Get current price
  const price = await dummySwap.getPrice();
  console.log("Current Price (xUSD per xBTC):", ethers.formatEther(price));

  console.log("\n=== Deployment Summary ===");
  console.log("xBTC:", xbtcAddress);
  console.log("xUSD:", xusdAddress);
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
