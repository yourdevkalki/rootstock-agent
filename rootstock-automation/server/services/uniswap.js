import { ethers } from "ethers";
import { isMock } from "../py.config.mjs";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

// Rootstock Uniswap v3 Contract Addresses
export const UNISWAP_ADDRESSES = {
  V3_CORE_FACTORY: "0xaF37EC98A00FD63689CF3060BF3B6784E00caD82",
  NFT_DESCRIPTOR: "0xA231609CF5ee20b3FF9bd8bBfD1928737E6e6264",
  NONFUNGIBLE_POSITION_DESCRIPTOR: "0x1519ab9C0bF7C8f261aCa6c58d59A152C95B3Ebc",
  NONFUNGIBLE_POSITION_MANAGER: "0x9d9386c042F194B460Ec424a1e57ACDE25f5C4b1",
  V3_MIGRATOR: "0x16678977CA4ec3DAD5efc7b15780295FE5f56162",
  MULTICALL2: "0x996a9858cDfa45Ad68E47c9A30a7201E29c6a386",
  PROXY_ADMIN: "0xE6c623e32eD33f29b4D7C002C01DebDA629e4604",
  TICK_LENS: "0x55B9dF5bF68ADe972191a91980459f48ecA16afC",
  DESCRIPTOR_PROXY: "0x2AECbeE0dc58e3419A52EEaF6Ea16C498BAeE24F",
  V3_STAKER: "0x96481062BfAA29AdaaeBfC5FA6F46d9556F0150c",
  QUOTER_V2: "0xb51727c996C68E60F598A923a5006853cd2fEB31",
  SWAP_ROUTER_02: "0x0B14ff67f0014046b4b99057Aec4509640b3947A",
  PERMIT2: "0xFcf5986450E4A014fFE7ad4Ae24921B589D039b5",
  UNIVERSAL_ROUTER: "0x244f68e77357f86a8522323eBF80b5FC2F814d3E",
  MESSAGE_SENDER: "0xf5F4496219F31CDCBa6130B5402873624585615a",
  MESSAGE_RECEIVER: "0x38aE7De6f9c51e17f49cF5730DD5F2d29fa20758",
};

// SwapRouter02 ABI (core swap functions)
const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)",
  "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
  "function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)",
  "function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)",
  "function unwrapWETH9(uint256 amountMinimum, address recipient) external payable",
  "function sweepToken(address token, uint256 amountMinimum, address recipient) external payable",
  "function refundETH() external payable",
];

// QuoterV2 ABI (for getting quotes)
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
  "function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amountOut, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
  "function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)",
  "function quoteExactOutput(bytes memory path, uint256 amountOut) external returns (uint256 amountIn, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)",
];

// NonfungiblePositionManager ABI (for liquidity management)
const POSITION_MANAGER_ABI = [
  "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)",
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)",
  "function burn(uint256 tokenId) external payable",
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function ownerOf(uint256 tokenId) external view returns (address owner)",
  "function balanceOf(address owner) external view returns (uint256 balance)",
  "function tokenByIndex(uint256 index) external view returns (uint256 tokenId)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)",
];

// V3 Factory ABI (for pool operations)
const V3_FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
  "function feeAmountTickSpacing(uint24 fee) external view returns (int24)",
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
];

// Common fee tiers in Uniswap v3
export const FEE_TIERS = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
};

// Contract instances
let swapRouter, quoter, positionManager, factory;

if (!isMock() && wallet) {
  swapRouter = new ethers.Contract(
    UNISWAP_ADDRESSES.SWAP_ROUTER_02,
    SWAP_ROUTER_ABI,
    wallet
  );
  quoter = new ethers.Contract(
    UNISWAP_ADDRESSES.QUOTER_V2,
    QUOTER_V2_ABI,
    provider
  );
  positionManager = new ethers.Contract(
    UNISWAP_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
    POSITION_MANAGER_ABI,
    wallet
  );
  factory = new ethers.Contract(
    UNISWAP_ADDRESSES.V3_CORE_FACTORY,
    V3_FACTORY_ABI,
    provider
  );
}

/**
 * Get a quote for exact input single swap
 */
export async function getExactInputQuote(
  tokenIn,
  tokenOut,
  amountIn,
  fee = FEE_TIERS.MEDIUM
) {
  if (isMock()) {
    return {
      amountOut: Math.floor(Number(amountIn) * 0.997).toString(), // Mock 0.3% slippage
      sqrtPriceX96After: "0",
      initializedTicksCrossed: 1,
      gasEstimate: "100000",
    };
  }

  try {
    const result = await quoter.quoteExactInputSingle.staticCall({
      tokenIn,
      tokenOut,
      amountIn,
      fee,
      sqrtPriceLimitX96: 0, // No price limit
    });

    return {
      amountOut: result[0].toString(),
      sqrtPriceX96After: result[1].toString(),
      initializedTicksCrossed: result[2].toString(),
      gasEstimate: result[3].toString(),
    };
  } catch (error) {
    console.error("Error getting quote:", error);
    throw new Error(`Failed to get quote: ${error.message}`);
  }
}

/**
 * Get a quote for exact output single swap
 */
export async function getExactOutputQuote(
  tokenIn,
  tokenOut,
  amountOut,
  fee = FEE_TIERS.MEDIUM
) {
  if (isMock()) {
    return {
      amountIn: Math.ceil(Number(amountOut) / 0.997).toString(), // Mock 0.3% slippage
      sqrtPriceX96After: "0",
      initializedTicksCrossed: 1,
      gasEstimate: "100000",
    };
  }

  try {
    const result = await quoter.quoteExactOutputSingle.staticCall({
      tokenIn,
      tokenOut,
      amountOut,
      fee,
      sqrtPriceLimitX96: 0, // No price limit
    });

    return {
      amountIn: result[0].toString(),
      sqrtPriceX96After: result[1].toString(),
      initializedTicksCrossed: result[2].toString(),
      gasEstimate: result[3].toString(),
    };
  } catch (error) {
    console.error("Error getting quote:", error);
    throw new Error(`Failed to get quote: ${error.message}`);
  }
}

/**
 * Execute exact input single swap
 */
export async function executeExactInputSingle(
  tokenIn,
  tokenOut,
  amountIn,
  amountOutMinimum,
  recipient,
  fee = FEE_TIERS.MEDIUM,
  deadline
) {
  if (isMock()) {
    return {
      txHash: "0xmock_swap_hash",
      amountOut: Math.floor(Number(amountIn) * 0.997).toString(),
    };
  }

  try {
    const params = {
      tokenIn,
      tokenOut,
      fee,
      recipient,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0, // No price limit
    };

    // Calculate deadline if not provided (30 minutes from now)
    if (!deadline) {
      deadline = Math.floor(Date.now() / 1000) + 30 * 60;
    }

    const tx = await swapRouter.exactInputSingle(params, {
      gasLimit: 300000,
      deadline,
    });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw new Error(`Failed to execute swap: ${error.message}`);
  }
}

/**
 * Execute exact output single swap
 */
export async function executeExactOutputSingle(
  tokenIn,
  tokenOut,
  amountOut,
  amountInMaximum,
  recipient,
  fee = FEE_TIERS.MEDIUM,
  deadline
) {
  if (isMock()) {
    return {
      txHash: "0xmock_swap_hash",
      amountIn: Math.ceil(Number(amountOut) / 0.997).toString(),
    };
  }

  try {
    const params = {
      tokenIn,
      tokenOut,
      fee,
      recipient,
      amountOut,
      amountInMaximum,
      sqrtPriceLimitX96: 0, // No price limit
    };

    // Calculate deadline if not provided (30 minutes from now)
    if (!deadline) {
      deadline = Math.floor(Date.now() / 1000) + 30 * 60;
    }

    const tx = await swapRouter.exactOutputSingle(params, {
      gasLimit: 300000,
      deadline,
    });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw new Error(`Failed to execute swap: ${error.message}`);
  }
}

/**
 * Get pool address for token pair and fee tier
 */
export async function getPoolAddress(tokenA, tokenB, fee) {
  if (isMock()) {
    return "0xaeF6fABf3b0C9e5F9d6D5170AfC703A633479Bbd"; // Mock WRBTC/USDT pool
  }

  try {
    const poolAddress = await factory.getPool(tokenA, tokenB, fee);
    return poolAddress;
  } catch (error) {
    console.error("Error getting pool address:", error);
    throw new Error(`Failed to get pool address: ${error.message}`);
  }
}

/**
 * Check token allowance
 */
export async function checkTokenAllowance(tokenAddress, owner, spender) {
  if (isMock()) {
    return {
      allowance: "1000000000000000000000",
      hasApproval: true,
    };
  }

  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );
    const allowance = await tokenContract.allowance(owner, spender);

    return {
      allowance: allowance.toString(),
      hasApproval: allowance > 0,
    };
  } catch (error) {
    console.error("Error checking allowance:", error);
    throw new Error(`Failed to check allowance: ${error.message}`);
  }
}

/**
 * Get token info (decimals, symbol, name)
 */
export async function getTokenInfo(tokenAddress) {
  if (isMock()) {
    return {
      decimals: 18,
      symbol: "MOCK",
      name: "Mock Token",
      totalSupply: "1000000000000000000000000",
    };
  }

  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    const [decimals, symbol, name, totalSupply] = await Promise.all([
      tokenContract.decimals().catch(() => 18),
      tokenContract.symbol().catch(() => "UNKNOWN"),
      tokenContract.name().catch(() => "Unknown Token"),
      tokenContract.totalSupply().catch(() => 0),
    ]);

    return {
      decimals: Number(decimals),
      symbol,
      name,
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    throw new Error(`Failed to get token info: ${error.message}`);
  }
}

/**
 * Get user's token balance
 */
export async function getTokenBalance(tokenAddress, userAddress) {
  if (isMock()) {
    return "1000000000000000000000"; // Mock 1000 tokens
  }

  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );
    const balance = await tokenContract.balanceOf(userAddress);

    return balance.toString();
  } catch (error) {
    console.error("Error getting token balance:", error);
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

/**
 * Encode path for multi-hop swaps
 */
export function encodePath(tokens, fees) {
  if (tokens.length !== fees.length + 1) {
    throw new Error("Invalid path: tokens length should be fees length + 1");
  }

  let path = "0x";

  for (let i = 0; i < tokens.length; i++) {
    // Add token address (remove 0x prefix for all but first)
    path += i === 0 ? tokens[i].slice(2) : tokens[i].slice(2);

    // Add fee if not last token
    if (i < fees.length) {
      path += fees[i].toString(16).padStart(6, "0");
    }
  }

  return path;
}

/**
 * Execute multi-hop exact input swap
 */
export async function executeExactInputMultiHop(
  path,
  recipient,
  amountIn,
  amountOutMinimum,
  deadline
) {
  if (isMock()) {
    return {
      txHash: "0xmock_multihop_swap",
      amountOut: Math.floor(Number(amountIn) * 0.994).toString(), // Mock with higher slippage
    };
  }

  try {
    // Calculate deadline if not provided (30 minutes from now)
    if (!deadline) {
      deadline = Math.floor(Date.now() / 1000) + 30 * 60;
    }

    const params = {
      path,
      recipient,
      amountIn,
      amountOutMinimum,
    };

    const tx = await swapRouter.exactInput(params, {
      gasLimit: 400000,
      deadline,
    });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("Error executing multi-hop swap:", error);
    throw new Error(`Failed to execute multi-hop swap: ${error.message}`);
  }
}

// Liquidity Management Functions

/**
 * Create a new liquidity position (mint NFT)
 */
export async function mintPosition(params) {
  if (isMock()) {
    return {
      txHash: "0xmock_mint_hash",
      tokenId: "1",
      liquidity: "1000000000000000",
      amount0: params.amount0Desired,
      amount1: params.amount1Desired,
    };
  }

  try {
    const tx = await positionManager.mint(params, { gasLimit: 500000 });
    const receipt = await tx.wait();

    // Parse the mint event to get tokenId and other details
    const mintEvent = receipt.logs.find((log) => {
      try {
        const parsed = positionManager.interface.parseLog(log);
        return parsed.name === "IncreaseLiquidity";
      } catch {
        return false;
      }
    });

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      // Additional parsing would be needed to extract exact values from events
      tokenId: "pending", // Would need to parse from events
      liquidity: "pending",
      amount0: "pending",
      amount1: "pending",
    };
  } catch (error) {
    console.error("Error minting position:", error);
    throw new Error(`Failed to mint position: ${error.message}`);
  }
}

/**
 * Increase liquidity in existing position
 */
export async function increaseLiquidity(params) {
  if (isMock()) {
    return {
      txHash: "0xmock_increase_hash",
      liquidity: "500000000000000",
      amount0: params.amount0Desired,
      amount1: params.amount1Desired,
    };
  }

  try {
    const tx = await positionManager.increaseLiquidity(params, {
      gasLimit: 400000,
    });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("Error increasing liquidity:", error);
    throw new Error(`Failed to increase liquidity: ${error.message}`);
  }
}

/**
 * Decrease liquidity in existing position
 */
export async function decreaseLiquidity(params) {
  if (isMock()) {
    return {
      txHash: "0xmock_decrease_hash",
      amount0: "1000000000000000",
      amount1: "1000000000000000",
    };
  }

  try {
    const tx = await positionManager.decreaseLiquidity(params, {
      gasLimit: 300000,
    });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("Error decreasing liquidity:", error);
    throw new Error(`Failed to decrease liquidity: ${error.message}`);
  }
}

/**
 * Collect fees from a position
 */
export async function collectFees(params) {
  if (isMock()) {
    return {
      txHash: "0xmock_collect_hash",
      amount0: "10000000000000",
      amount1: "10000000000000",
    };
  }

  try {
    const tx = await positionManager.collect(params, { gasLimit: 200000 });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("Error collecting fees:", error);
    throw new Error(`Failed to collect fees: ${error.message}`);
  }
}

/**
 * Get position details
 */
export async function getPosition(tokenId) {
  if (isMock()) {
    return {
      nonce: "0",
      operator: "0x0000000000000000000000000000000000000000",
      token0: "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d", // Mock WRBTC
      token1: "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96", // Mock USDT
      fee: 3000,
      tickLower: -887220,
      tickUpper: 887220,
      liquidity: "1000000000000000",
      feeGrowthInside0LastX128: "0",
      feeGrowthInside1LastX128: "0",
      tokensOwed0: "10000000000000",
      tokensOwed1: "10000000000000",
    };
  }

  try {
    const position = await positionManager.positions(tokenId);

    return {
      nonce: position[0].toString(),
      operator: position[1],
      token0: position[2],
      token1: position[3],
      fee: position[4].toString(),
      tickLower: position[5].toString(),
      tickUpper: position[6].toString(),
      liquidity: position[7].toString(),
      feeGrowthInside0LastX128: position[8].toString(),
      feeGrowthInside1LastX128: position[9].toString(),
      tokensOwed0: position[10].toString(),
      tokensOwed1: position[11].toString(),
    };
  } catch (error) {
    console.error("Error getting position:", error);
    throw new Error(`Failed to get position: ${error.message}`);
  }
}

/**
 * Get all positions owned by an address
 */
export async function getUserPositions(ownerAddress) {
  if (isMock()) {
    return [
      { tokenId: "1", ...(await getPosition("1")) },
      { tokenId: "2", ...(await getPosition("2")) },
    ];
  }

  try {
    const balance = await positionManager.balanceOf(ownerAddress);
    const positions = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await positionManager.tokenOfOwnerByIndex(
        ownerAddress,
        i
      );
      const position = await getPosition(tokenId.toString());
      positions.push({
        tokenId: tokenId.toString(),
        ...position,
      });
    }

    return positions;
  } catch (error) {
    console.error("Error getting user positions:", error);
    throw new Error(`Failed to get user positions: ${error.message}`);
  }
}

export {
  swapRouter,
  quoter,
  positionManager,
  factory,
  SWAP_ROUTER_ABI,
  QUOTER_V2_ABI,
  POSITION_MANAGER_ABI,
  V3_FACTORY_ABI,
  ERC20_ABI,
};
