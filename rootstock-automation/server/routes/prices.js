import { Router } from "express";
import {
  getBTCPrice,
  getUSDCPrice,
  getTokenPrices,
  PYTH_PRICE_FEEDS,
  getLatestPythPrice,
} from "../services/pyth.js";

const router = Router();

// Get all supported price feeds
router.get("/feeds", (_req, res) => {
  res.json({
    feeds: PYTH_PRICE_FEEDS,
    description: {
      BTC_USD: "Bitcoin price in USD",
      ETH_USD: "Ethereum price in USD (for reference)",
      USDC_USD: "USD Coin price in USD",
    },
  });
});

// Get BTC price
router.get("/btc", async (_req, res) => {
  try {
    const price = await getBTCPrice();
    res.json({
      symbol: "BTC",
      name: "Bitcoin",
      ...price,
    });
  } catch (error) {
    console.error("BTC price error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get USDC price
router.get("/usdc", async (_req, res) => {
  try {
    const price = await getUSDCPrice();
    res.json({
      symbol: "USDC",
      name: "USD Coin",
      ...price,
    });
  } catch (error) {
    console.error("USDC price error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get both xBTC and xUSDC prices (our dummy tokens pegged to real prices)
router.get("/tokens", async (_req, res) => {
  try {
    const prices = await getTokenPrices();
    res.json(prices);
  } catch (error) {
    console.error("Token prices error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific token price
router.get("/token/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const symbolUpper = symbol.toUpperCase();

    if (symbolUpper === "XBTC") {
      const price = await getBTCPrice();
      res.json({
        symbol: "xBTC",
        name: "Dummy Bitcoin",
        ...price,
      });
    } else if (symbolUpper === "XUSDC") {
      const price = await getUSDCPrice();
      res.json({
        symbol: "xUSDC",
        name: "Dummy USDC",
        ...price,
      });
    } else {
      res.status(404).json({
        error: `Token ${symbol} not supported. Supported tokens: xBTC, xUSDC`,
      });
    }
  } catch (error) {
    console.error("Token price error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get price by Pyth feed ID
router.get("/feed/:feedId", async (req, res) => {
  try {
    const { feedId } = req.params;

    // Validate feed ID format (should be a 64-character hex string with 0x prefix)
    if (!/^0x[a-fA-F0-9]{64}$/.test(feedId)) {
      return res.status(400).json({
        error:
          "Invalid feed ID format. Expected 64-character hex string with 0x prefix",
      });
    }

    const price = await getLatestPythPrice(feedId);
    const formatted = Number(price.price) * Math.pow(10, price.expo);

    res.json({
      feedId,
      ...price,
      formatted,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Feed price error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical prices (placeholder for future implementation)
router.get("/history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = "1h", limit = 24 } = req.query;

    // This is a placeholder - in a real implementation, you'd fetch historical data
    res.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      limit: parseInt(limit),
      message: "Historical price data not yet implemented",
      currentPrice:
        symbol.toUpperCase() === "XBTC"
          ? await getBTCPrice()
          : await getUSDCPrice(),
    });
  } catch (error) {
    console.error("Historical price error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
