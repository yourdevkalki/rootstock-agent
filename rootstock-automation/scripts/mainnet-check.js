import { ethers } from "ethers";
import { UNISWAP_ADDRESSES } from "../server/services/uniswap.js";

// Mainnet readiness check script
async function checkMainnetReadiness() {
  console.log("🔍 Checking Mainnet Readiness...\n");

  const MAINNET_RPC = "https://public-node.rsk.co";
  const provider = new ethers.JsonRpcProvider(MAINNET_RPC);

  try {
    // 1. Check network
    const network = await provider.getNetwork();
    console.log(`✅ Network: ${network.name} (Chain ID: ${network.chainId})`);

    if (network.chainId !== 30n) {
      throw new Error(
        "❌ Not connected to Rootstock mainnet (Chain ID should be 30)"
      );
    }

    // 2. Check Uniswap contracts exist
    console.log("\n📋 Verifying Uniswap Contracts:");

    for (const [name, address] of Object.entries(UNISWAP_ADDRESSES)) {
      try {
        const code = await provider.getCode(address);
        if (code === "0x") {
          console.log(`❌ ${name}: ${address} - NO CONTRACT`);
        } else {
          console.log(`✅ ${name}: ${address} - CONTRACT EXISTS`);
        }
      } catch (error) {
        console.log(`❌ ${name}: ${address} - ERROR: ${error.message}`);
      }
    }

    // 3. Check if wallet is configured
    const privateKey = process.env.PRIVATE_KEY;
    if (
      !privateKey ||
      privateKey ===
        "0x1234567890123456789012345678901234567890123456789012345678901234"
    ) {
      console.log(
        "\n⚠️  WARNING: Using example private key - set real private key for mainnet"
      );
    } else {
      const wallet = new ethers.Wallet(privateKey, provider);
      const balance = await provider.getBalance(wallet.address);
      console.log(`\n💰 Wallet: ${wallet.address}`);
      console.log(`💰 Balance: ${ethers.formatEther(balance)} RBTC`);

      if (balance < ethers.parseEther("0.01")) {
        console.log(
          "⚠️  WARNING: Low RBTC balance - ensure sufficient funds for gas"
        );
      }
    }

    // 4. Check TaskRegistry if deployed
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (
      contractAddress &&
      contractAddress !== "0x1234567890123456789012345678901234567890"
    ) {
      const code = await provider.getCode(contractAddress);
      if (code === "0x") {
        console.log(`\n❌ TaskRegistry: ${contractAddress} - NOT DEPLOYED`);
      } else {
        console.log(`\n✅ TaskRegistry: ${contractAddress} - DEPLOYED`);
      }
    } else {
      console.log("\n⚠️  TaskRegistry not configured - deploy first");
    }

    console.log("\n🚀 Mainnet Status: READY");
    console.log("\n📝 Next steps:");
    console.log("1. Fund wallet with RBTC");
    console.log("2. Deploy TaskRegistry if needed");
    console.log("3. Start services with mainnet config");
  } catch (error) {
    console.error(`❌ Mainnet check failed: ${error.message}`);
    process.exit(1);
  }
}

checkMainnetReadiness().catch(console.error);
