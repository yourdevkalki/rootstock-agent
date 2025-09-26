import { Router } from "express";
import { getBTCPrice, getUSDCPrice, getTokenPrices } from "../services/pyth.js";
import {
  getSwapQuote,
  executeSwap,
  getSwapInfo,
  DUMMY_SWAP_ADDRESSES,
} from "../services/dummy-swap.js";

const router = Router();

// Enhanced swap quote with Pyth price integration
router.post("/quote/real-time", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, useRealPricing = false } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        error: "tokenIn, tokenOut, and amountIn are required",
      });
    }

    // Validate token addresses
    const validTokens = [DUMMY_SWAP_ADDRESSES.XBTC, DUMMY_SWAP_ADDRESSES.XUSDC];
    if (!validTokens.includes(tokenIn) || !validTokens.includes(tokenOut)) {
      return res.status(400).json({
        error: "Invalid token pair. Only xBTC/xUSDC swaps are supported",
      });
    }

    if (tokenIn === tokenOut) {
      return res.status(400).json({
        error: "Cannot swap token with itself",
      });
    }

    // Get on-chain AMM quote
    const ammQuote = await getSwapQuote(tokenIn, tokenOut, amountIn);

    let realTimeQuote = null;
    let priceDifference = null;

    if (useRealPricing) {
      // Get real-time prices from Pyth
      const [tokenPrices] = await Promise.all([getTokenPrices()]);

      const fromPrice =
        tokenIn === DUMMY_SWAP_ADDRESSES.XBTC
          ? tokenPrices.xBTC.formatted
          : tokenPrices.xUSDC.formatted;

      const toPrice =
        tokenOut === DUMMY_SWAP_ADDRESSES.XBTC
          ? tokenPrices.xBTC.formatted
          : tokenPrices.xUSDC.formatted;

      // Calculate real-time quote based on Pyth prices
      const inputAmount = parseFloat(amountIn) / 1e18; // Convert from wei
      const realTimeAmountOut = (inputAmount * fromPrice) / toPrice;
      const realTimeAmountOutWei = Math.floor(
        realTimeAmountOut * 1e18
      ).toString();

      realTimeQuote = {
        amountIn,
        amountOut: realTimeAmountOutWei,
        tokenIn,
        tokenOut,
        rate: (fromPrice / toPrice).toString(),
        fromPrice: tokenPrices.xBTC.formatted,
        toPrice: tokenPrices.xUSDC.formatted,
        source: "Pyth Network",
      };

      // Calculate price difference between AMM and real-time
      const ammAmountOut = parseFloat(ammQuote.amountOut) / 1e18;
      const pythAmountOut = realTimeAmountOut;
      priceDifference = {
        absoluteDifference: pythAmountOut - ammAmountOut,
        percentageDifference:
          ((pythAmountOut - ammAmountOut) / ammAmountOut) * 100,
        ammBetter: ammAmountOut > pythAmountOut,
      };
    }

    res.json({
      ammQuote: {
        ...ammQuote,
        source: "On-chain AMM",
      },
      realTimeQuote,
      priceDifference,
      recommendation: priceDifference
        ? {
            useAMM: priceDifference.ammBetter,
            reason: priceDifference.ammBetter
              ? "AMM offers better rate due to current liquidity"
              : "Real-time pricing offers better rate",
          }
        : null,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Real-time quote error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Execute swap with price impact analysis
router.post("/execute/with-analysis", async (req, res) => {
  try {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      recipient,
      slippageTolerance = 0.5,
    } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !minAmountOut || !recipient) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, amountIn, minAmountOut, and recipient are required",
      });
    }

    // Get pre-swap analysis
    const [preSwapQuote, realTimeQuote] = await Promise.all([
      getSwapQuote(tokenIn, tokenOut, amountIn),
      (async () => {
        try {
          const response = await fetch(
            `http://localhost:${
              process.env.PORT || 3000
            }/swap-pyth/quote/real-time`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tokenIn,
                tokenOut,
                amountIn,
                useRealPricing: true,
              }),
            }
          );
          return await response.json();
        } catch (error) {
          console.warn(
            "Could not get real-time quote for analysis:",
            error.message
          );
          return null;
        }
      })(),
    ]);

    // Calculate expected price impact
    const inputAmount = parseFloat(amountIn) / 1e18;
    const outputAmount = parseFloat(preSwapQuote.amountOut) / 1e18;
    const rate = parseFloat(preSwapQuote.rate);

    const priceImpact = {
      expectedOutput: outputAmount,
      rate,
      slippageTolerance,
      minReceived: parseFloat(minAmountOut) / 1e18,
      priceImpactPercentage: realTimeQuote
        ? Math.abs(
            ((rate - realTimeQuote.realTimeQuote?.rate) /
              realTimeQuote.realTimeQuote.rate) *
              100
          )
        : null,
    };

    // Execute the swap
    const swapResult = await executeSwap(
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      recipient
    );

    // Post-swap analysis
    const actualOutput = parseFloat(swapResult.amountOut) / 1e18;
    const executionAnalysis = {
      expectedOutput: outputAmount,
      actualOutput,
      slippage: ((outputAmount - actualOutput) / outputAmount) * 100,
      executionEfficiency: (actualOutput / outputAmount) * 100,
    };

    res.json({
      swapResult,
      preSwapAnalysis: {
        quote: preSwapQuote,
        priceImpact,
        realTimeComparison: realTimeQuote,
      },
      executionAnalysis,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Enhanced swap execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get real-time market data
router.get("/market-data", async (req, res) => {
  try {
    const [swapInfo, tokenPrices] = await Promise.all([
      getSwapInfo(),
      getTokenPrices(),
    ]);

    // Calculate pool metrics
    const xbtcReserve = parseFloat(swapInfo.xbtcReserve) / 1e18;
    const xusdcReserve = parseFloat(swapInfo.xusdcReserve) / 1e18;
    const poolPrice = parseFloat(swapInfo.priceFormatted);

    const marketData = {
      pool: {
        xbtcReserve,
        xusdcReserve,
        totalLiquidity: xbtcReserve * tokenPrices.xBTC.formatted + xusdcReserve,
        poolPrice,
        lastUpdated: new Date().toISOString(),
      },
      realTimePrices: {
        btc: tokenPrices.xBTC,
        usdc: tokenPrices.xUSDC,
      },
      priceComparison: {
        poolVsMarket: {
          poolPrice,
          marketPrice: tokenPrices.xBTC.formatted / tokenPrices.xUSDC.formatted,
          difference:
            poolPrice -
            tokenPrices.xBTC.formatted / tokenPrices.xUSDC.formatted,
          percentageDifference:
            ((poolPrice -
              tokenPrices.xBTC.formatted / tokenPrices.xUSDC.formatted) /
              (tokenPrices.xBTC.formatted / tokenPrices.xUSDC.formatted)) *
            100,
        },
      },
      metrics: {
        liquidityUtilization: Math.min((xbtcReserve * 100) / 1000, 100), // Assuming 1000 xBTC is max efficient liquidity
        priceImpactFor1BTC: calculatePriceImpact(xbtcReserve, xusdcReserve, 1),
        priceImpactFor10BTC: calculatePriceImpact(
          xbtcReserve,
          xusdcReserve,
          10
        ),
      },
    };

    res.json(marketData);
  } catch (error) {
    console.error("Market data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate price impact
function calculatePriceImpact(xbtcReserve, xusdcReserve, amountIn) {
  const k = xbtcReserve * xusdcReserve;
  const fee = 0.997; // 0.3% fee
  const amountInAfterFee = amountIn * fee;
  const newXbtcReserve = xbtcReserve + amountInAfterFee;
  const newXusdcReserve = k / newXbtcReserve;
  const amountOut = xusdcReserve - newXusdcReserve;

  const currentPrice = xusdcReserve / xbtcReserve;
  const executionPrice = amountOut / amountIn;

  return ((currentPrice - executionPrice) / currentPrice) * 100;
}

// Get arbitrage opportunities
router.get("/arbitrage", async (req, res) => {
  try {
    const [swapInfo, tokenPrices] = await Promise.all([
      getSwapInfo(),
      getTokenPrices(),
    ]);

    const poolPrice = parseFloat(swapInfo.priceFormatted);
    const marketPrice =
      tokenPrices.xBTC.formatted / tokenPrices.xUSDC.formatted;

    const priceDifference = poolPrice - marketPrice;
    const percentageDifference = (priceDifference / marketPrice) * 100;

    const arbitrageOpportunity = {
      exists: Math.abs(percentageDifference) > 0.1, // 0.1% threshold
      direction: priceDifference > 0 ? "sell_to_pool" : "buy_from_pool",
      poolPrice,
      marketPrice,
      priceDifference,
      percentageDifference,
      potentialProfit: Math.abs(percentageDifference),
      minTradeSize: 0.1, // Minimum 0.1 BTC for meaningful arbitrage
      recommendation:
        Math.abs(percentageDifference) > 0.5
          ? "Strong arbitrage opportunity"
          : Math.abs(percentageDifference) > 0.1
          ? "Moderate arbitrage opportunity"
          : "No significant arbitrage opportunity",
      lastUpdated: new Date().toISOString(),
    };

    res.json(arbitrageOpportunity);
  } catch (error) {
    console.error("Arbitrage analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
