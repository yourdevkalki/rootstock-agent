import { HermesClient } from "@pythnetwork/hermes-client";
import { isMock } from "../py.config.mjs";

const HERMES_URL = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";

const connection = new HermesClient(HERMES_URL, {});

export async function getLatestPythPrice(priceId) {
  if (isMock()) return { price: -11109000000, expo: -8 };

  try {
    // Use the correct method from Pyth HermesClient with parsed option
    const priceUpdate = await connection.getLatestPriceUpdates([priceId], {
      parsed: true,
    });
    if (!priceUpdate || !priceUpdate.parsed || !priceUpdate.parsed.length) {
      throw new Error("No price updates from Pyth");
    }

    const parsedData = priceUpdate.parsed[0];
    const price = Number(parsedData.price.price);
    const expo = Number(parsedData.price.expo);
    return { price, expo };
  } catch (error) {
    console.error("Pyth price fetch error:", error.message);
    // Fallback to mock data if Pyth fails
    console.log("Using mock price data as fallback");
    return { price: 11000000000000, expo: -8 }; // ~$110,000 BTC price (updated for current market)
  }
}

export function comparePrice(
  { price, expo },
  comparator,
  targetPrice,
  targetExpo
) {
  // Normalize both to a common exponent by scaling integers
  if (expo === targetExpo) {
    if (comparator === "gte") return BigInt(price) >= BigInt(targetPrice);
    if (comparator === "lte") return BigInt(price) <= BigInt(targetPrice);
    throw new Error("Invalid comparator");
  }
  const commonExpo = Math.min(expo, targetExpo);
  const scale = (val, fromExpo, toExpo) => {
    const diff = BigInt(fromExpo - toExpo);
    if (diff === 0n) return BigInt(val);
    if (diff > 0n) return BigInt(val) * 10n ** diff; // making exponent more negative -> scale up
    return BigInt(val) / 10n ** -diff;
  };
  const left = scale(price, expo, commonExpo);
  const right = scale(targetPrice, targetExpo, commonExpo);
  if (comparator === "gte") return left >= right;
  if (comparator === "lte") return left <= right;
  throw new Error("Invalid comparator");
}

// Pyth price feed IDs for major cryptocurrencies
export const PYTH_PRICE_FEEDS = {
  // Bitcoin price feed ID
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  // Ethereum price feed ID (for reference)
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  // USD Coin price feed ID
  USDC_USD:
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
};

// Get BTC price in USD
export async function getBTCPrice() {
  if (isMock()) {
    return {
      price: 11000000000000, // ~$110,000 in 8 decimal places (updated for current market)
      expo: -8,
      formatted: 110000,
    };
  }

  try {
    const priceData = await getLatestPythPrice(PYTH_PRICE_FEEDS.BTC_USD);
    const formatted = Number(priceData.price) * Math.pow(10, priceData.expo);
    return {
      ...priceData,
      formatted,
    };
  } catch (error) {
    throw new Error(`Failed to get BTC price: ${error.message}`);
  }
}

// Get USDC price from Pyth (should be close to 1.0)
export async function getUSDCPrice() {
  if (isMock()) {
    return {
      price: 100000000, // $1.00 in 8 decimal places
      expo: -8,
      formatted: 1.0,
    };
  }

  try {
    const priceData = await getLatestPythPrice(PYTH_PRICE_FEEDS.USDC_USD);
    const formatted = Number(priceData.price) * Math.pow(10, priceData.expo);
    return {
      ...priceData,
      formatted,
    };
  } catch (error) {
    // Fallback to 1.0 if USDC price fails
    return {
      price: 100000000,
      expo: -8,
      formatted: 1.0,
    };
  }
}

// Get both xBTC and xUSDC prices (pegged to real BTC and USDC)
export async function getTokenPrices() {
  try {
    const [btcPrice, usdcPrice] = await Promise.all([
      getBTCPrice(),
      getUSDCPrice(),
    ]);

    return {
      xBTC: {
        symbol: "xBTC",
        ...btcPrice,
        name: "Dummy Bitcoin",
      },
      xUSDC: {
        symbol: "xUSDC",
        ...usdcPrice,
        name: "Dummy USDC",
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get token prices: ${error.message}`);
  }
}
