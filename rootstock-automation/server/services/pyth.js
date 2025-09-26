import { PriceServiceConnection } from "@pythnetwork/price-service-client";

const HERMES_URL = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";

const connection = new PriceServiceConnection(HERMES_URL, { timeout: 10_000 });

export async function getLatestPythPrice(priceId) {
  const updates = await connection.getLatestPriceUpdates([priceId]);
  if (!updates || !updates.length) throw new Error("No price updates from Pyth");
  const feed = updates[0];
  // Choose aggregate price
  const price = feed.price.price;
  const expo = feed.price.expo;
  return { price, expo };
}

export function comparePrice({ price, expo }, comparator, targetPrice, targetExpo) {
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
    return BigInt(val) / 10n ** (-diff);
  };
  const left = scale(price, expo, commonExpo);
  const right = scale(targetPrice, targetExpo, commonExpo);
  if (comparator === "gte") return left >= right;
  if (comparator === "lte") return left <= right;
  throw new Error("Invalid comparator");
}


