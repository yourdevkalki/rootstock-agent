import { ethers } from "ethers";
import { isMock } from "../py.config.mjs";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

// Contract addresses - these will be set after deployment
export let DUMMY_SWAP_ADDRESSES = {
  XBTC: process.env.XBTC_ADDRESS || "",
  XUSDC: process.env.XUSDC_ADDRESS || "",
  DUMMY_SWAP: process.env.DUMMY_SWAP_ADDRESS || "",
};

// Update addresses (useful for dynamic configuration)
export function updateAddresses(addresses) {
  DUMMY_SWAP_ADDRESSES = { ...DUMMY_SWAP_ADDRESSES, ...addresses };
}

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function transferFrom(address from, address to, uint256 value) external returns (bool)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function mint(address to, uint256 value) external",
];

// DummySwap ABI
const DUMMY_SWAP_ABI = [
  "function xbtc() external view returns (address)",
  "function xusdc() external view returns (address)",
  "function xbtcReserve() external view returns (uint256)",
  "function xusdcReserve() external view returns (uint256)",
  "function addLiquidity(uint256 xbtcAmount, uint256 xusdcAmount) external",
  "function swapXBTCForXUSDC(uint256 xbtcAmountIn) external",
  "function swapXUSDCForXBTC(uint256 xusdcAmountIn) external",
  "function getXBTCToXUSDCQuote(uint256 xbtcAmountIn) external view returns (uint256)",
  "function getXUSDCToXBTCQuote(uint256 xusdcAmountIn) external view returns (uint256)",
  "function getReserves() external view returns (uint256, uint256)",
  "function getPrice() external view returns (uint256)",
  "event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)",
  "event LiquidityAdded(address indexed provider, uint256 xbtcAmount, uint256 xusdcAmount)",
];

// Get token info
export async function getTokenInfo(tokenAddress) {
  if (isMock()) {
    return {
      name: tokenAddress.includes("xBTC") ? "Dummy Bitcoin" : "Dummy USDC",
      symbol: tokenAddress.includes("xBTC") ? "xBTC" : "xUSDC",
      decimals: 18,
      address: tokenAddress,
    };
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      address: tokenAddress,
    };
  } catch (error) {
    throw new Error(`Failed to get token info: ${error.message}`);
  }
}

// Get token balance
export async function getTokenBalance(tokenAddress, userAddress) {
  if (isMock()) {
    return {
      balance: "1000000000000000000000", // 1000 tokens
      formatted: "1000.0",
      decimals: 18,
    };
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.decimals().catch(() => 18),
    ]);

    return {
      balance: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      decimals: Number(decimals),
    };
  } catch (error) {
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

// Get token allowance
export async function getTokenAllowance(tokenAddress, owner, spender) {
  if (isMock()) {
    return {
      allowance: "0",
      formatted: "0.0",
      decimals: 18,
    };
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [allowance, decimals] = await Promise.all([
      contract.allowance(owner, spender),
      contract.decimals().catch(() => 18),
    ]);

    return {
      allowance: allowance.toString(),
      formatted: ethers.formatUnits(allowance, decimals),
      decimals: Number(decimals),
    };
  } catch (error) {
    throw new Error(`Failed to get token allowance: ${error.message}`);
  }
}

// Get swap quote
export async function getSwapQuote(tokenIn, tokenOut, amountIn) {
  if (isMock()) {
    // Mock quote calculation (roughly 1 BTC = 65000 USD)
    const mockRate = tokenIn.includes("xBTC") ? 65000 : 1 / 65000;
    const amountOut = (
      parseFloat(ethers.formatEther(amountIn)) * mockRate
    ).toString();
    return {
      amountIn,
      amountOut: ethers.parseEther(amountOut).toString(),
      tokenIn,
      tokenOut,
      rate: mockRate.toString(),
    };
  }

  try {
    const contract = new ethers.Contract(
      DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      DUMMY_SWAP_ABI,
      provider
    );

    let amountOut;
    if (
      tokenIn === DUMMY_SWAP_ADDRESSES.XBTC &&
      tokenOut === DUMMY_SWAP_ADDRESSES.XUSDC
    ) {
      amountOut = await contract.getXBTCToXUSDCQuote(amountIn);
    } else if (
      tokenIn === DUMMY_SWAP_ADDRESSES.XUSDC &&
      tokenOut === DUMMY_SWAP_ADDRESSES.XBTC
    ) {
      amountOut = await contract.getXUSDCToXBTCQuote(amountIn);
    } else {
      throw new Error("Invalid token pair");
    }

    const rate =
      parseFloat(ethers.formatEther(amountOut)) /
      parseFloat(ethers.formatEther(amountIn));

    return {
      amountIn,
      amountOut: amountOut.toString(),
      tokenIn,
      tokenOut,
      rate: rate.toString(),
    };
  } catch (error) {
    throw new Error(`Failed to get swap quote: ${error.message}`);
  }
}

// Execute swap
export async function executeSwap(
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  recipient
) {
  if (isMock()) {
    return {
      txHash: "0x" + "mock".repeat(16),
      amountIn,
      amountOut: minAmountOut,
      gasUsed: "21000",
      success: true,
    };
  }

  if (!wallet) {
    throw new Error(
      "Wallet not configured. Set PRIVATE_KEY environment variable."
    );
  }

  try {
    const contract = new ethers.Contract(
      DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      DUMMY_SWAP_ABI,
      wallet
    );

    // First, ensure the contract has allowance to spend the input token
    const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, wallet);
    const currentAllowance = await tokenContract.allowance(
      wallet.address,
      DUMMY_SWAP_ADDRESSES.DUMMY_SWAP
    );

    if (currentAllowance < amountIn) {
      const approveTx = await tokenContract.approve(
        DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
        amountIn
      );
      await approveTx.wait();
    }

    let tx;
    if (
      tokenIn === DUMMY_SWAP_ADDRESSES.XBTC &&
      tokenOut === DUMMY_SWAP_ADDRESSES.XUSDC
    ) {
      tx = await contract.swapXBTCForXUSDC(amountIn);
    } else if (
      tokenIn === DUMMY_SWAP_ADDRESSES.XUSDC &&
      tokenOut === DUMMY_SWAP_ADDRESSES.XBTC
    ) {
      tx = await contract.swapXUSDCForXBTC(amountIn);
    } else {
      throw new Error("Invalid token pair");
    }

    const receipt = await tx.wait();

    // Parse the Swap event to get actual amounts
    const swapEvent = receipt.logs.find((log) => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog.name === "Swap";
      } catch {
        return false;
      }
    });

    let actualAmountOut = minAmountOut;
    if (swapEvent) {
      const parsedLog = contract.interface.parseLog(swapEvent);
      actualAmountOut = parsedLog.args.amountOut.toString();
    }

    return {
      txHash: receipt.hash,
      amountIn,
      amountOut: actualAmountOut,
      gasUsed: receipt.gasUsed.toString(),
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to execute swap: ${error.message}`);
  }
}

// Get swap reserves and price
export async function getSwapInfo() {
  if (isMock()) {
    return {
      xbtcReserve: ethers.parseEther("100").toString(),
      xusdcReserve: ethers.parseEther("6500000").toString(),
      price: ethers.parseEther("65000").toString(),
      priceFormatted: "65000.0",
    };
  }

  try {
    const contract = new ethers.Contract(
      DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      DUMMY_SWAP_ABI,
      provider
    );

    const [reserves, price] = await Promise.all([
      contract.getReserves(),
      contract.getPrice(),
    ]);

    return {
      xbtcReserve: reserves[0].toString(),
      xusdcReserve: reserves[1].toString(),
      price: price.toString(),
      priceFormatted: ethers.formatEther(price),
    };
  } catch (error) {
    throw new Error(`Failed to get swap info: ${error.message}`);
  }
}

// Add liquidity (for admin use)
export async function addLiquidity(xbtcAmount, xusdcAmount) {
  if (isMock()) {
    return {
      txHash: "0x" + "mock".repeat(16),
      xbtcAmount,
      xusdcAmount,
      gasUsed: "50000",
      success: true,
    };
  }

  if (!wallet) {
    throw new Error(
      "Wallet not configured. Set PRIVATE_KEY environment variable."
    );
  }

  try {
    const contract = new ethers.Contract(
      DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      DUMMY_SWAP_ABI,
      wallet
    );

    // Approve both tokens
    const xbtcContract = new ethers.Contract(
      DUMMY_SWAP_ADDRESSES.XBTC,
      ERC20_ABI,
      wallet
    );
    const xusdcContract = new ethers.Contract(
      DUMMY_SWAP_ADDRESSES.XUSDC,
      ERC20_ABI,
      wallet
    );

    const [xbtcAllowance, xusdcAllowance] = await Promise.all([
      xbtcContract.allowance(wallet.address, DUMMY_SWAP_ADDRESSES.DUMMY_SWAP),
      xusdcContract.allowance(wallet.address, DUMMY_SWAP_ADDRESSES.DUMMY_SWAP),
    ]);

    const approvals = [];
    if (xbtcAllowance < xbtcAmount) {
      approvals.push(
        xbtcContract.approve(DUMMY_SWAP_ADDRESSES.DUMMY_SWAP, xbtcAmount)
      );
    }
    if (xusdcAllowance < xusdcAmount) {
      approvals.push(
        xusdcContract.approve(DUMMY_SWAP_ADDRESSES.DUMMY_SWAP, xusdcAmount)
      );
    }

    if (approvals.length > 0) {
      await Promise.all(approvals.map((tx) => tx.then((t) => t.wait())));
    }

    const tx = await contract.addLiquidity(xbtcAmount, xusdcAmount);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      xbtcAmount,
      xusdcAmount,
      gasUsed: receipt.gasUsed.toString(),
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to add liquidity: ${error.message}`);
  }
}

// Mint tokens (for testing)
export async function mintTokens(tokenAddress, recipient, amount) {
  if (isMock()) {
    return {
      txHash: "0x" + "mock".repeat(16),
      recipient,
      amount,
      gasUsed: "50000",
      success: true,
    };
  }

  if (!wallet) {
    throw new Error(
      "Wallet not configured. Set PRIVATE_KEY environment variable."
    );
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const tx = await contract.mint(recipient, amount);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      recipient,
      amount,
      gasUsed: receipt.gasUsed.toString(),
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to mint tokens: ${error.message}`);
  }
}
