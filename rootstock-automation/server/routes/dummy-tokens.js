import { Router } from "express";
import {
  DUMMY_SWAP_ADDRESSES,
  updateAddresses,
  getTokenInfo,
  getTokenBalance,
  getTokenAllowance,
  getSwapQuote,
  executeSwap,
  getSwapInfo,
  addLiquidity,
  mintTokens,
} from "../services/dummy-swap.js";

const router = Router();

// Get contract addresses
router.get("/addresses", (_req, res) => {
  res.json({
    addresses: DUMMY_SWAP_ADDRESSES,
    description: {
      XBTC: "Dummy Bitcoin token address",
      XUSD: "Dummy USD token address",
      DUMMY_SWAP: "Dummy swap contract address",
    },
  });
});

// Update addresses (admin endpoint)
router.post("/addresses", (req, res) => {
  try {
    const { XBTC, XUSD, DUMMY_SWAP } = req.body;

    if (!XBTC && !XUSD && !DUMMY_SWAP) {
      return res.status(400).json({
        error: "At least one address (XBTC, XUSD, or DUMMY_SWAP) is required",
      });
    }

    const newAddresses = {};
    if (XBTC) newAddresses.XBTC = XBTC;
    if (XUSD) newAddresses.XUSD = XUSD;
    if (DUMMY_SWAP) newAddresses.DUMMY_SWAP = DUMMY_SWAP;

    updateAddresses(newAddresses);
    res.json({
      success: true,
      addresses: DUMMY_SWAP_ADDRESSES,
      message: "Addresses updated successfully",
    });
  } catch (error) {
    console.error("Address update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Token information endpoints
router.get("/token/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const tokenInfo = await getTokenInfo(address);
    res.json(tokenInfo);
  } catch (error) {
    console.error("Token info error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/token/:address/balance/:user", async (req, res) => {
  try {
    const { address, user } = req.params;
    const balance = await getTokenBalance(address, user);
    res.json(balance);
  } catch (error) {
    console.error("Balance lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/token/:address/allowance/:owner/:spender", async (req, res) => {
  try {
    const { address, owner, spender } = req.params;
    const allowance = await getTokenAllowance(address, owner, spender);
    res.json(allowance);
  } catch (error) {
    console.error("Allowance check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Swap quote endpoint
router.post("/quote", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        error: "tokenIn, tokenOut, and amountIn are required",
      });
    }

    // Validate token pair
    const validTokens = [DUMMY_SWAP_ADDRESSES.XBTC, DUMMY_SWAP_ADDRESSES.XUSD];
    if (!validTokens.includes(tokenIn) || !validTokens.includes(tokenOut)) {
      return res.status(400).json({
        error: "Invalid token pair. Only xBTC/xUSD swaps are supported",
      });
    }

    if (tokenIn === tokenOut) {
      return res.status(400).json({
        error: "Cannot swap token with itself",
      });
    }

    const quote = await getSwapQuote(tokenIn, tokenOut, amountIn);
    res.json(quote);
  } catch (error) {
    console.error("Quote error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Swap execution endpoint
router.post("/swap", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, minAmountOut, recipient } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !minAmountOut || !recipient) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, amountIn, minAmountOut, and recipient are required",
      });
    }

    // Validate token pair
    const validTokens = [DUMMY_SWAP_ADDRESSES.XBTC, DUMMY_SWAP_ADDRESSES.XUSD];
    if (!validTokens.includes(tokenIn) || !validTokens.includes(tokenOut)) {
      return res.status(400).json({
        error: "Invalid token pair. Only xBTC/xUSD swaps are supported",
      });
    }

    if (tokenIn === tokenOut) {
      return res.status(400).json({
        error: "Cannot swap token with itself",
      });
    }

    const result = await executeSwap(
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      recipient
    );
    res.json(result);
  } catch (error) {
    console.error("Swap execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get swap pool information
router.get("/pool/info", async (req, res) => {
  try {
    const info = await getSwapInfo();
    res.json(info);
  } catch (error) {
    console.error("Pool info error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add liquidity endpoint (admin)
router.post("/liquidity/add", async (req, res) => {
  try {
    const { xbtcAmount, xusdAmount } = req.body;

    if (!xbtcAmount || !xusdAmount) {
      return res.status(400).json({
        error: "xbtcAmount and xusdAmount are required",
      });
    }

    const result = await addLiquidity(xbtcAmount, xusdAmount);
    res.json(result);
  } catch (error) {
    console.error("Add liquidity error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mint tokens endpoint (for testing)
router.post("/mint", async (req, res) => {
  try {
    const { token, recipient, amount } = req.body;

    if (!token || !recipient || !amount) {
      return res.status(400).json({
        error: "token, recipient, and amount are required",
      });
    }

    // Validate token address
    const validTokens = [DUMMY_SWAP_ADDRESSES.XBTC, DUMMY_SWAP_ADDRESSES.XUSD];
    if (!validTokens.includes(token)) {
      return res.status(400).json({
        error: "Invalid token address. Only xBTC and xUSD are supported",
      });
    }

    const result = await mintTokens(token, recipient, amount);
    res.json(result);
  } catch (error) {
    console.error("Mint tokens error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get supported tokens
router.get("/tokens", (_req, res) => {
  res.json({
    tokens: [
      {
        address: DUMMY_SWAP_ADDRESSES.XBTC,
        symbol: "xBTC",
        name: "Dummy Bitcoin",
        decimals: 18,
      },
      {
        address: DUMMY_SWAP_ADDRESSES.XUSD,
        symbol: "xUSD",
        name: "Dummy USD",
        decimals: 18,
      },
    ],
    swapContract: DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
  });
});

export default router;
