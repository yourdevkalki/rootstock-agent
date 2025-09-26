import { ethers } from "ethers";
import {
  getExactInputQuote,
  executeExactInputSingle,
  getTokenInfo,
  checkTokenAllowance,
  UNISWAP_ADDRESSES,
  FEE_TIERS,
} from "../server/services/uniswap.js";

// Demo script showing how to use Uniswap v3 swap functionality
async function demoSwap() {
  console.log("🔄 Uniswap v3 Swap Demo on Rootstock\n");

  // Example token addresses (replace with actual Rootstock tokens)
  const WRBTC = "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d"; // Wrapped BTC on Rootstock
  const USDT = "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96"; // USDT on Rootstock

  const amountIn = ethers.parseUnits("0.001", 18); // 0.001 WRBTC
  const recipient = "0x742d35Cc6634C0532925a3b8D1b9B3a5D85C5b3B"; // Example recipient

  try {
    console.log("📋 Contract Addresses:");
    console.log(`SwapRouter02: ${UNISWAP_ADDRESSES.SWAP_ROUTER_02}`);
    console.log(`QuoterV2: ${UNISWAP_ADDRESSES.QUOTER_V2}`);
    console.log(
      `PositionManager: ${UNISWAP_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER}\n`
    );

    // 1. Get token information
    console.log("1️⃣ Getting token information...");
    const tokenInInfo = await getTokenInfo(WRBTC);
    const tokenOutInfo = await getTokenInfo(USDT);

    console.log(
      `Token In: ${tokenInInfo.name} (${tokenInInfo.symbol}) - ${tokenInInfo.decimals} decimals`
    );
    console.log(
      `Token Out: ${tokenOutInfo.name} (${tokenOutInfo.symbol}) - ${tokenOutInfo.decimals} decimals\n`
    );

    // 2. Get quote
    console.log("2️⃣ Getting swap quote...");
    const quote = await getExactInputQuote(
      WRBTC,
      USDT,
      amountIn.toString(),
      FEE_TIERS.MEDIUM
    );

    console.log(
      `Amount In: ${ethers.formatUnits(amountIn, tokenInInfo.decimals)} ${
        tokenInInfo.symbol
      }`
    );
    console.log(
      `Estimated Amount Out: ${ethers.formatUnits(
        quote.amountOut,
        tokenOutInfo.decimals
      )} ${tokenOutInfo.symbol}`
    );
    console.log(`Gas Estimate: ${quote.gasEstimate}\n`);

    // 3. Check allowance
    console.log("3️⃣ Checking token allowance...");
    const allowance = await checkTokenAllowance(
      WRBTC,
      recipient,
      UNISWAP_ADDRESSES.SWAP_ROUTER_02
    );
    console.log(
      `Current Allowance: ${ethers.formatUnits(
        allowance.allowance,
        tokenInInfo.decimals
      )} ${tokenInInfo.symbol}`
    );
    console.log(`Has Approval: ${allowance.hasApproval}\n`);

    // 4. Calculate minimum output with slippage protection (1%)
    const slippageTolerance = 0.01; // 1%
    const amountOutMinimum = BigInt(
      Math.floor(Number(quote.amountOut) * (1 - slippageTolerance))
    );

    console.log("4️⃣ Swap parameters:");
    console.log(
      `Amount Out Minimum (1% slippage): ${ethers.formatUnits(
        amountOutMinimum,
        tokenOutInfo.decimals
      )} ${tokenOutInfo.symbol}`
    );
    console.log(`Fee Tier: ${FEE_TIERS.MEDIUM / 10000}%`);
    console.log(`Recipient: ${recipient}\n`);

    // Note: In production, you would execute the swap here:
    // const swapResult = await executeExactInputSingle(
    //   WRBTC,
    //   USDT,
    //   amountIn.toString(),
    //   amountOutMinimum.toString(),
    //   recipient,
    //   FEE_TIERS.MEDIUM
    // );

    console.log("✅ Demo completed successfully!");
    console.log("\n📝 Next steps for production:");
    console.log("1. Ensure sufficient token balance");
    console.log("2. Approve token spending if needed");
    console.log("3. Execute swap with proper error handling");
    console.log("4. Monitor transaction status");
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
  }
}

// Demo liquidity management
async function demoLiquidity() {
  console.log("\n💧 Liquidity Management Demo\n");

  const WRBTC = "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d";
  const USDT = "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96";
  const owner = "0x742d35Cc6634C0532925a3b8D1b9B3a5D85C5b3B";

  console.log("📋 Liquidity Parameters:");
  console.log(`Token Pair: WRBTC/USDT`);
  console.log(`Fee Tier: ${FEE_TIERS.MEDIUM / 10000}%`);
  console.log(
    `Position Manager: ${UNISWAP_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER}\n`
  );

  // Example mint parameters
  const mintParams = {
    token0: WRBTC.toLowerCase() < USDT.toLowerCase() ? WRBTC : USDT,
    token1: WRBTC.toLowerCase() < USDT.toLowerCase() ? USDT : WRBTC,
    fee: FEE_TIERS.MEDIUM,
    tickLower: -887220, // Full range example
    tickUpper: 887220,
    amount0Desired: ethers.parseUnits("0.1", 18).toString(), // 0.1 of token0
    amount1Desired: ethers.parseUnits("100", 6).toString(), // 100 of token1 (assuming USDT)
    amount0Min: "0",
    amount1Min: "0",
    recipient: owner,
    deadline: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  };

  console.log("🏗️ Mint Position Parameters:");
  console.log(
    `Amount 0 Desired: ${ethers.formatUnits(mintParams.amount0Desired, 18)}`
  );
  console.log(
    `Amount 1 Desired: ${ethers.formatUnits(mintParams.amount1Desired, 6)}`
  );
  console.log(`Tick Range: ${mintParams.tickLower} to ${mintParams.tickUpper}`);

  console.log("\n✅ Liquidity demo completed!");
  console.log("In production, you would:");
  console.log("1. Approve both tokens for the position manager");
  console.log("2. Call mint function with proper parameters");
  console.log("3. Monitor the transaction and get the NFT token ID");
}

// Run demos
async function main() {
  await demoSwap();
  await demoLiquidity();

  console.log("\n🚀 Uniswap v3 integration ready!");
  console.log("API endpoints available at:");
  console.log("- POST /swap/quote/exact-input - Get swap quotes");
  console.log("- POST /swap/execute/exact-input - Execute swaps");
  console.log("- POST /swap/liquidity/mint - Create liquidity positions");
  console.log("- GET /swap/addresses - Get contract addresses");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { demoSwap, demoLiquidity };
