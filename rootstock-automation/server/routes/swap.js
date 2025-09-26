import { Router } from "express";
import {
  getExactInputQuote,
  getExactOutputQuote,
  executeExactInputSingle,
  executeExactOutputSingle,
  executeExactInputMultiHop,
  getPoolAddress,
  checkTokenAllowance,
  getTokenInfo,
  getTokenBalance,
  encodePath,
  mintPosition,
  increaseLiquidity,
  decreaseLiquidity,
  collectFees,
  getPosition,
  getUserPositions,
  UNISWAP_ADDRESSES,
  FEE_TIERS,
} from "../services/uniswap.js";

const router = Router();

// Get Uniswap contract addresses
router.get("/addresses", (_req, res) => {
  res.json({
    addresses: UNISWAP_ADDRESSES,
    feeTiers: FEE_TIERS,
  });
});

// Quote endpoints
router.post("/quote/exact-input", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, fee } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        error: "tokenIn, tokenOut, and amountIn are required",
      });
    }

    const quote = await getExactInputQuote(tokenIn, tokenOut, amountIn, fee);
    res.json(quote);
  } catch (error) {
    console.error("Quote error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/quote/exact-output", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountOut, fee } = req.body;

    if (!tokenIn || !tokenOut || !amountOut) {
      return res.status(400).json({
        error: "tokenIn, tokenOut, and amountOut are required",
      });
    }

    const quote = await getExactOutputQuote(tokenIn, tokenOut, amountOut, fee);
    res.json(quote);
  } catch (error) {
    console.error("Quote error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Swap execution endpoints
router.post("/execute/exact-input", async (req, res) => {
  try {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMinimum,
      recipient,
      fee,
      deadline,
    } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !amountOutMinimum || !recipient) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, amountIn, amountOutMinimum, and recipient are required",
      });
    }

    const result = await executeExactInputSingle(
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMinimum,
      recipient,
      fee,
      deadline
    );

    res.json(result);
  } catch (error) {
    console.error("Swap execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/execute/exact-output", async (req, res) => {
  try {
    const {
      tokenIn,
      tokenOut,
      amountOut,
      amountInMaximum,
      recipient,
      fee,
      deadline,
    } = req.body;

    if (!tokenIn || !tokenOut || !amountOut || !amountInMaximum || !recipient) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, amountOut, amountInMaximum, and recipient are required",
      });
    }

    const result = await executeExactOutputSingle(
      tokenIn,
      tokenOut,
      amountOut,
      amountInMaximum,
      recipient,
      fee,
      deadline
    );

    res.json(result);
  } catch (error) {
    console.error("Swap execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/execute/multi-hop", async (req, res) => {
  try {
    const { tokens, fees, recipient, amountIn, amountOutMinimum, deadline } =
      req.body;

    if (!tokens || !fees || !recipient || !amountIn || !amountOutMinimum) {
      return res.status(400).json({
        error:
          "tokens, fees, recipient, amountIn, and amountOutMinimum are required",
      });
    }

    // Encode the path for multi-hop swap
    const path = encodePath(tokens, fees);

    const result = await executeExactInputMultiHop(
      path,
      recipient,
      amountIn,
      amountOutMinimum,
      deadline
    );

    res.json(result);
  } catch (error) {
    console.error("Multi-hop swap error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Pool information
router.get("/pool/:tokenA/:tokenB/:fee", async (req, res) => {
  try {
    const { tokenA, tokenB, fee } = req.params;

    const poolAddress = await getPoolAddress(tokenA, tokenB, parseInt(fee));

    if (poolAddress === "0x0000000000000000000000000000000000000000") {
      return res.status(404).json({
        error: "Pool does not exist for this token pair and fee tier",
      });
    }

    res.json({ poolAddress });
  } catch (error) {
    console.error("Pool lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Token information
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
    res.json({ balance });
  } catch (error) {
    console.error("Balance lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/token/:address/allowance/:owner/:spender", async (req, res) => {
  try {
    const { address, owner, spender } = req.params;

    const allowanceInfo = await checkTokenAllowance(address, owner, spender);
    res.json(allowanceInfo);
  } catch (error) {
    console.error("Allowance check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Liquidity Management Endpoints

router.post("/liquidity/mint", async (req, res) => {
  try {
    const {
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient,
      deadline,
    } = req.body;

    if (
      !token0 ||
      !token1 ||
      !fee ||
      tickLower === undefined ||
      tickUpper === undefined ||
      !amount0Desired ||
      !amount1Desired ||
      amount0Min === undefined ||
      amount1Min === undefined ||
      !recipient
    ) {
      return res.status(400).json({
        error: "All mint parameters are required",
      });
    }

    const params = {
      token0,
      token1,
      fee: parseInt(fee),
      tickLower: parseInt(tickLower),
      tickUpper: parseInt(tickUpper),
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient,
      deadline: deadline || Math.floor(Date.now() / 1000) + 30 * 60,
    };

    const result = await mintPosition(params);
    res.json(result);
  } catch (error) {
    console.error("Mint position error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/liquidity/increase", async (req, res) => {
  try {
    const {
      tokenId,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      deadline,
    } = req.body;

    if (
      !tokenId ||
      !amount0Desired ||
      !amount1Desired ||
      amount0Min === undefined ||
      amount1Min === undefined
    ) {
      return res.status(400).json({
        error:
          "tokenId, amount0Desired, amount1Desired, amount0Min, and amount1Min are required",
      });
    }

    const params = {
      tokenId,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      deadline: deadline || Math.floor(Date.now() / 1000) + 30 * 60,
    };

    const result = await increaseLiquidity(params);
    res.json(result);
  } catch (error) {
    console.error("Increase liquidity error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/liquidity/decrease", async (req, res) => {
  try {
    const { tokenId, liquidity, amount0Min, amount1Min, deadline } = req.body;

    if (
      !tokenId ||
      !liquidity ||
      amount0Min === undefined ||
      amount1Min === undefined
    ) {
      return res.status(400).json({
        error: "tokenId, liquidity, amount0Min, and amount1Min are required",
      });
    }

    const params = {
      tokenId,
      liquidity,
      amount0Min,
      amount1Min,
      deadline: deadline || Math.floor(Date.now() / 1000) + 30 * 60,
    };

    const result = await decreaseLiquidity(params);
    res.json(result);
  } catch (error) {
    console.error("Decrease liquidity error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/liquidity/collect", async (req, res) => {
  try {
    const { tokenId, recipient, amount0Max, amount1Max } = req.body;

    if (
      !tokenId ||
      !recipient ||
      amount0Max === undefined ||
      amount1Max === undefined
    ) {
      return res.status(400).json({
        error: "tokenId, recipient, amount0Max, and amount1Max are required",
      });
    }

    const params = {
      tokenId,
      recipient,
      amount0Max,
      amount1Max,
    };

    const result = await collectFees(params);
    res.json(result);
  } catch (error) {
    console.error("Collect fees error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Position information
router.get("/position/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    const position = await getPosition(tokenId);
    res.json(position);
  } catch (error) {
    console.error("Position lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/positions/:owner", async (req, res) => {
  try {
    const { owner } = req.params;

    const positions = await getUserPositions(owner);
    res.json({ positions });
  } catch (error) {
    console.error("User positions error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Utility endpoints
router.post("/path/encode", (req, res) => {
  try {
    const { tokens, fees } = req.body;

    if (!tokens || !fees) {
      return res.status(400).json({
        error: "tokens and fees arrays are required",
      });
    }

    const path = encodePath(tokens, fees);
    res.json({ path });
  } catch (error) {
    console.error("Path encoding error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
