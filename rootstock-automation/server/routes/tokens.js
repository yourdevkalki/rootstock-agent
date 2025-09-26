import { Router } from "express";
import {
  getBTCPrice,
  getUSDCPrice,
  getTokenPrices,
  PYTH_PRICE_FEEDS,
} from "../services/pyth.js";
import {
  getTokenInfo,
  getTokenBalance,
  getTokenAllowance,
  DUMMY_SWAP_ADDRESSES,
} from "../services/dummy-swap.js";

const router = Router();

// Get all supported tokens
router.get("/", (_req, res) => {
  res.json({
    tokens: [
      {
        address: DUMMY_SWAP_ADDRESSES.XBTC,
        symbol: "xBTC",
        name: "Dummy Bitcoin",
        decimals: 18,
        description: "Test token pegged to Bitcoin price via Pyth",
        priceSource: "Pyth Network",
        priceFeedId: PYTH_PRICE_FEEDS.BTC_USD,
      },
      {
        address: DUMMY_SWAP_ADDRESSES.XUSDC,
        symbol: "xUSDC",
        name: "Dummy USDC",
        decimals: 18,
        description: "Test token pegged to USDC price via Pyth",
        priceSource: "Pyth Network",
        priceFeedId: PYTH_PRICE_FEEDS.USDC_USD,
      },
    ],
  });
});

// Get detailed token information
router.get("/:tokenSymbol", async (req, res) => {
  try {
    const { tokenSymbol } = req.params;
    const symbolUpper = tokenSymbol.toUpperCase();

    let tokenAddress;
    let priceFunction;
    let tokenDetails;

    if (symbolUpper === "XBTC") {
      tokenAddress = DUMMY_SWAP_ADDRESSES.XBTC;
      priceFunction = getBTCPrice;
      tokenDetails = {
        symbol: "xBTC",
        name: "Dummy Bitcoin",
        description: "Test token pegged to Bitcoin price via Pyth",
        priceSource: "Pyth Network",
        priceFeedId: PYTH_PRICE_FEEDS.BTC_USD,
      };
    } else if (symbolUpper === "XUSDC") {
      tokenAddress = DUMMY_SWAP_ADDRESSES.XUSDC;
      priceFunction = getUSDCPrice;
      tokenDetails = {
        symbol: "xUSDC",
        name: "Dummy USDC",
        description: "Test token pegged to USDC price via Pyth",
        priceSource: "Pyth Network",
        priceFeedId: PYTH_PRICE_FEEDS.USDC_USD,
      };
    } else {
      return res.status(404).json({
        error: `Token ${tokenSymbol} not found. Supported tokens: xBTC, xUSDC`,
      });
    }

    // Get token contract info and current price
    const [contractInfo, currentPrice] = await Promise.all([
      getTokenInfo(tokenAddress),
      priceFunction(),
    ]);

    res.json({
      ...tokenDetails,
      address: tokenAddress,
      contractInfo,
      currentPrice,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Token details error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get token balance for a specific address
router.get("/:tokenSymbol/balance/:userAddress", async (req, res) => {
  try {
    const { tokenSymbol, userAddress } = req.params;
    const symbolUpper = tokenSymbol.toUpperCase();

    let tokenAddress;
    if (symbolUpper === "XBTC") {
      tokenAddress = DUMMY_SWAP_ADDRESSES.XBTC;
    } else if (symbolUpper === "XUSDC") {
      tokenAddress = DUMMY_SWAP_ADDRESSES.XUSDC;
    } else {
      return res.status(404).json({
        error: `Token ${tokenSymbol} not found. Supported tokens: xBTC, xUSDC`,
      });
    }

    const balance = await getTokenBalance(tokenAddress, userAddress);

    res.json({
      token: {
        address: tokenAddress,
        symbol: symbolUpper,
      },
      userAddress,
      ...balance,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Balance lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get token allowance
router.get("/:tokenSymbol/allowance/:owner/:spender", async (req, res) => {
  try {
    const { tokenSymbol, owner, spender } = req.params;
    const symbolUpper = tokenSymbol.toUpperCase();

    let tokenAddress;
    if (symbolUpper === "XBTC") {
      tokenAddress = DUMMY_SWAP_ADDRESSES.XBTC;
    } else if (symbolUpper === "XUSDC") {
      tokenAddress = DUMMY_SWAP_ADDRESSES.XUSDC;
    } else {
      return res.status(404).json({
        error: `Token ${tokenSymbol} not found. Supported tokens: xBTC, xUSDC`,
      });
    }

    const allowance = await getTokenAllowance(tokenAddress, owner, spender);

    res.json({
      token: {
        address: tokenAddress,
        symbol: symbolUpper,
      },
      owner,
      spender,
      ...allowance,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Allowance lookup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get exchange rates between tokens
router.get("/:fromToken/rate/:toToken", async (req, res) => {
  try {
    const { fromToken, toToken } = req.params;
    const fromUpper = fromToken.toUpperCase();
    const toUpper = toToken.toUpperCase();

    // Validate tokens
    const validTokens = ["XBTC", "XUSDC"];
    if (!validTokens.includes(fromUpper) || !validTokens.includes(toUpper)) {
      return res.status(400).json({
        error: "Invalid token pair. Supported tokens: xBTC, xUSDC",
      });
    }

    if (fromUpper === toUpper) {
      return res.json({
        fromToken: fromUpper,
        toToken: toUpper,
        rate: 1,
        inverseRate: 1,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Get current prices for both tokens
    const [fromPrice, toPrice] = await Promise.all([
      fromUpper === "XBTC" ? getBTCPrice() : getUSDCPrice(),
      toUpper === "XBTC" ? getBTCPrice() : getUSDCPrice(),
    ]);

    // Calculate exchange rate
    const rate = fromPrice.formatted / toPrice.formatted;
    const inverseRate = toPrice.formatted / fromPrice.formatted;

    res.json({
      fromToken: fromUpper,
      toToken: toUpper,
      rate,
      inverseRate,
      fromPrice,
      toPrice,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Exchange rate error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all token prices with metadata
router.get("/prices/all", async (req, res) => {
  try {
    const prices = await getTokenPrices();

    res.json({
      ...prices,
      tokens: {
        xBTC: {
          ...prices.xBTC,
          address: DUMMY_SWAP_ADDRESSES.XBTC,
          priceFeedId: PYTH_PRICE_FEEDS.BTC_USD,
        },
        xUSDC: {
          ...prices.xUSDC,
          address: DUMMY_SWAP_ADDRESSES.XUSDC,
          priceFeedId: PYTH_PRICE_FEEDS.USDC_USD,
        },
      },
    });
  } catch (error) {
    console.error("All prices error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
