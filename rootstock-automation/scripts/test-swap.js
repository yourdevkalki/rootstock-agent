import hre from "hardhat";
import "dotenv/config";

const { ethers } = hre;

async function testSwap() {
  console.log("🔄 Testing Dummy Token Swap");
  console.log("============================");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Contract addresses from deployment
  const XBTC_ADDRESS = "0x18A1d7F323a90DDE8e5Efc42971cF06Ad5B759b8";
  const XUSD_ADDRESS = "0xB39E2eeB5063881D452616dff1BcE19d79C3375D";
  const DUMMY_SWAP_ADDRESS = "0x79D45320480ED0a4C7e2885b14aBBfdE394Fb353";

  // ABIs
  const ERC20_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function approve(address spender, uint256 value) external returns (bool)",
    "function mint(address to, uint256 value) external",
    "function symbol() external view returns (string)",
  ];

  const SWAP_ABI = [
    "function swapXBTCForXUSD(uint256 xbtcAmountIn) external",
    "function getXBTCToXUSDQuote(uint256 xbtcAmountIn) external view returns (uint256)",
    "function getReserves() external view returns (uint256, uint256)",
  ];

  try {
    // Initialize contracts
    const xbtcContract = new ethers.Contract(XBTC_ADDRESS, ERC20_ABI, deployer);
    const xusdContract = new ethers.Contract(XUSD_ADDRESS, ERC20_ABI, deployer);
    const swapContract = new ethers.Contract(
      DUMMY_SWAP_ADDRESS,
      SWAP_ABI,
      deployer
    );

    console.log("\\n1️⃣ Checking initial balances...");

    const [xbtcBalance, xusdBalance] = await Promise.all([
      xbtcContract.balanceOf(deployer.address),
      xusdContract.balanceOf(deployer.address),
    ]);

    console.log(`xBTC Balance: ${ethers.formatEther(xbtcBalance)}`);
    console.log(`xUSD Balance: ${ethers.formatEther(xusdBalance)}`);

    // Mint some xBTC if balance is too low
    const swapAmount = ethers.parseEther("0.1"); // 0.1 xBTC
    if (xbtcBalance < swapAmount) {
      console.log("\\n2️⃣ Minting xBTC for testing...");
      const mintTx = await xbtcContract.mint(
        deployer.address,
        ethers.parseEther("1")
      );
      await mintTx.wait();
      console.log("✅ Minted 1 xBTC");
    }

    console.log("\\n3️⃣ Getting swap quote...");
    const quote = await swapContract.getXBTCToXUSDQuote(swapAmount);
    console.log(
      `Quote: ${ethers.formatEther(swapAmount)} xBTC → ${ethers.formatEther(
        quote
      )} xUSD`
    );

    console.log("\\n4️⃣ Checking pool reserves...");
    const [xbtcReserve, xusdReserve] = await swapContract.getReserves();
    console.log(
      `Pool reserves: ${ethers.formatEther(
        xbtcReserve
      )} xBTC, ${ethers.formatEther(xusdReserve)} xUSD`
    );

    console.log("\\n5️⃣ Approving xBTC for swap...");
    const approveTx = await xbtcContract.approve(
      DUMMY_SWAP_ADDRESS,
      swapAmount
    );
    await approveTx.wait();
    console.log("✅ Approval confirmed");

    console.log("\\n6️⃣ Executing swap...");
    const swapTx = await swapContract.swapXBTCForXUSD(swapAmount);
    console.log("Transaction sent:", swapTx.hash);

    const receipt = await swapTx.wait();
    console.log("✅ Swap completed!");
    console.log("Gas used:", receipt.gasUsed.toString());

    console.log("\\n7️⃣ Checking final balances...");
    const [finalXbtcBalance, finalXusdBalance] = await Promise.all([
      xbtcContract.balanceOf(deployer.address),
      xusdContract.balanceOf(deployer.address),
    ]);

    console.log(`Final xBTC Balance: ${ethers.formatEther(finalXbtcBalance)}`);
    console.log(`Final xUSD Balance: ${ethers.formatEther(finalXusdBalance)}`);

    const xbtcDiff = xbtcBalance - finalXbtcBalance;
    const xusdDiff = finalXusdBalance - xusdBalance;

    console.log("\\n📊 Swap Summary:");
    console.log(`Swapped: ${ethers.formatEther(xbtcDiff)} xBTC`);
    console.log(`Received: ${ethers.formatEther(xusdDiff)} xUSD`);
    console.log(
      `Effective Rate: 1 xBTC = ${
        parseFloat(ethers.formatEther(xusdDiff)) /
        parseFloat(ethers.formatEther(xbtcDiff))
      } xUSD`
    );

    console.log("\\n🎉 Swap test completed successfully!");
  } catch (error) {
    console.error("\\n❌ Swap test failed:", error.message);

    if (error.message.includes("insufficient")) {
      console.error("💡 Try minting more tokens or check allowances");
    }
    if (error.message.includes("liquidity")) {
      console.error("💡 Pool may not have enough liquidity");
    }
  }
}

// Run the swap test
if (import.meta.url === `file://${process.argv[1]}`) {
  testSwap().catch(console.error);
}

export { testSwap };
