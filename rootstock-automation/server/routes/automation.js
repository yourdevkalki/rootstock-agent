import { Router } from "express";
import {
  createPriceTask,
  createTimeTask,
  getAllTasks,
  executeTask,
  cancelTask,
  describeTask,
} from "../services/tasks.js";
import {
  getBTCPrice,
  getUSDCPrice,
  PYTH_PRICE_FEEDS,
  comparePrice,
} from "../services/pyth.js";
import { getSwapQuote, DUMMY_SWAP_ADDRESSES } from "../services/dummy-swap.js";

const router = Router();

// Create a limit order (price-based swap automation)
router.post("/limit-order", async (req, res) => {
  try {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      limitPrice,
      direction, // "above" or "below"
      recipient,
      expiryTime,
      slippageTolerance = 0.5,
    } = req.body;

    // Validation
    if (
      !tokenIn ||
      !tokenOut ||
      !amountIn ||
      !limitPrice ||
      !direction ||
      !recipient
    ) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, amountIn, limitPrice, direction, and recipient are required",
      });
    }

    if (!["above", "below"].includes(direction)) {
      return res.status(400).json({
        error: "direction must be 'above' or 'below'",
      });
    }

    // Validate token pair
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

    // Determine price feed to monitor
    let priceId;
    if (tokenIn === DUMMY_SWAP_ADDRESSES.XBTC) {
      priceId = PYTH_PRICE_FEEDS.BTC_USD;
    } else {
      priceId = PYTH_PRICE_FEEDS.USDC_USD;
    }

    // Get current price for reference
    const currentPrice =
      tokenIn === DUMMY_SWAP_ADDRESSES.XBTC
        ? await getBTCPrice()
        : await getUSDCPrice();

    // Create swap call data
    const swapParams = {
      tokenIn,
      tokenOut,
      amountIn,
      recipient,
      slippageTolerance,
    };

    // Calculate minimum amount out based on limit price
    const inputAmount = parseFloat(amountIn) / 1e18;
    const expectedOutput =
      direction === "above"
        ? inputAmount * limitPrice * (1 - slippageTolerance / 100)
        : (inputAmount / limitPrice) * (1 - slippageTolerance / 100);

    const minAmountOut = Math.floor(expectedOutput * 1e18).toString();

    // Store limit order metadata
    const limitOrderData = {
      type: "limit_order",
      tokenIn,
      tokenOut,
      amountIn,
      limitPrice,
      direction,
      recipient,
      currentPrice: currentPrice.formatted,
      minAmountOut,
      slippageTolerance,
      expiryTime,
      createdAt: new Date().toISOString(),
      swapParams,
    };

    // Create price-based task
    const comparator = direction === "above" ? "gte" : "lte";
    const targetPrice = Math.floor(limitPrice * 1e8); // Convert to 8 decimal places for Pyth
    const targetExpo = -8;

    // For now, we'll create a simple swap task that monitors the price
    // In a real implementation, this would be more sophisticated
    const taskId = await createPriceTask(
      process.env.TASK_REGISTRY_ADDRESS || DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      "executeSwap(address,address,uint256,uint256,address)", // This would need to be implemented in the contract
      [tokenIn, tokenOut, amountIn, minAmountOut, recipient],
      priceId,
      comparator,
      BigInt(targetPrice),
      targetExpo
    );

    // Store metadata (in a real app, this would go to a database)
    global.limitOrders = global.limitOrders || new Map();
    global.limitOrders.set(taskId, limitOrderData);

    res.json({
      success: true,
      taskId,
      limitOrder: limitOrderData,
      message: `Limit order created. Will execute when ${
        tokenIn === DUMMY_SWAP_ADDRESSES.XBTC ? "BTC" : "USDC"
      } price goes ${direction} $${limitPrice}`,
    });
  } catch (error) {
    console.error("Limit order creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a DCA (Dollar Cost Averaging) automation
router.post("/dca", async (req, res) => {
  try {
    const {
      tokenIn,
      tokenOut,
      totalAmount,
      frequency, // in seconds
      numberOfExecutions,
      recipient,
      slippageTolerance = 0.5,
    } = req.body;

    if (
      !tokenIn ||
      !tokenOut ||
      !totalAmount ||
      !frequency ||
      !numberOfExecutions ||
      !recipient
    ) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, totalAmount, frequency, numberOfExecutions, and recipient are required",
      });
    }

    const amountPerExecution = Math.floor(
      parseFloat(totalAmount) / numberOfExecutions
    ).toString();

    const dcaData = {
      type: "dca",
      tokenIn,
      tokenOut,
      totalAmount,
      amountPerExecution,
      frequency,
      numberOfExecutions,
      executionsCompleted: 0,
      recipient,
      slippageTolerance,
      createdAt: new Date().toISOString(),
      nextExecution: new Date(Date.now() + frequency * 1000).toISOString(),
    };

    // Create time-based recurring task
    const taskId = await createTimeTask(
      process.env.TASK_REGISTRY_ADDRESS || DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      "executeSwap(address,address,uint256,uint256,address)",
      [tokenIn, tokenOut, amountPerExecution, "0", recipient], // minAmountOut = 0 for market orders
      BigInt(frequency)
    );

    // Store metadata
    global.dcaOrders = global.dcaOrders || new Map();
    global.dcaOrders.set(taskId, dcaData);

    res.json({
      success: true,
      taskId,
      dcaOrder: dcaData,
      message: `DCA order created. Will execute ${numberOfExecutions} times, every ${frequency} seconds`,
    });
  } catch (error) {
    console.error("DCA creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a stop-loss automation
router.post("/stop-loss", async (req, res) => {
  try {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      stopPrice,
      recipient,
      slippageTolerance = 2.0, // Higher slippage tolerance for stop-losses
    } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !stopPrice || !recipient) {
      return res.status(400).json({
        error:
          "tokenIn, tokenOut, amountIn, stopPrice, and recipient are required",
      });
    }

    // Get current price
    const currentPrice =
      tokenIn === DUMMY_SWAP_ADDRESSES.XBTC
        ? await getBTCPrice()
        : await getUSDCPrice();

    // Validate stop price is below current price (for selling)
    if (stopPrice >= currentPrice.formatted) {
      return res.status(400).json({
        error: "Stop price must be below current price for stop-loss orders",
      });
    }

    const stopLossData = {
      type: "stop_loss",
      tokenIn,
      tokenOut,
      amountIn,
      stopPrice,
      recipient,
      currentPrice: currentPrice.formatted,
      slippageTolerance,
      createdAt: new Date().toISOString(),
    };

    // Determine price feed
    const priceId =
      tokenIn === DUMMY_SWAP_ADDRESSES.XBTC
        ? PYTH_PRICE_FEEDS.BTC_USD
        : PYTH_PRICE_FEEDS.USDC_USD;

    // Create price task (trigger when price goes below stop price)
    const targetPrice = Math.floor(stopPrice * 1e8);
    const targetExpo = -8;
    const minAmountOut = "0"; // Market order

    const taskId = await createPriceTask(
      process.env.TASK_REGISTRY_ADDRESS || DUMMY_SWAP_ADDRESSES.DUMMY_SWAP,
      "executeSwap(address,address,uint256,uint256,address)",
      [tokenIn, tokenOut, amountIn, minAmountOut, recipient],
      priceId,
      "lte", // Less than or equal
      BigInt(targetPrice),
      targetExpo
    );

    global.stopLossOrders = global.stopLossOrders || new Map();
    global.stopLossOrders.set(taskId, stopLossData);

    res.json({
      success: true,
      taskId,
      stopLoss: stopLossData,
      message: `Stop-loss created. Will execute when price drops to $${stopPrice}`,
    });
  } catch (error) {
    console.error("Stop-loss creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all automation orders
router.get("/orders", (req, res) => {
  try {
    const { type, status } = req.query;

    const allOrders = [];

    // Collect all order types
    const orderMaps = [
      { map: global.limitOrders, type: "limit_order" },
      { map: global.dcaOrders, type: "dca" },
      { map: global.stopLossOrders, type: "stop_loss" },
    ];

    orderMaps.forEach(({ map, type: orderType }) => {
      if (map) {
        map.forEach((order, taskId) => {
          if (!type || order.type === type) {
            allOrders.push({
              taskId,
              ...order,
              type: orderType,
            });
          }
        });
      }
    });

    // Filter by status if requested
    let filteredOrders = allOrders;
    if (status) {
      // This would need to check actual task status from the task registry
      filteredOrders = allOrders; // For now, return all
    }

    res.json({
      orders: filteredOrders,
      totalCount: filteredOrders.length,
      byType: {
        limitOrders: allOrders.filter((o) => o.type === "limit_order").length,
        dcaOrders: allOrders.filter((o) => o.type === "dca").length,
        stopLossOrders: allOrders.filter((o) => o.type === "stop_loss").length,
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific order details
router.get("/orders/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check all order types
    const orderMaps = [
      global.limitOrders,
      global.dcaOrders,
      global.stopLossOrders,
    ];

    let orderData = null;
    for (const map of orderMaps) {
      if (map && map.has(parseInt(taskId))) {
        orderData = map.get(parseInt(taskId));
        break;
      }
    }

    if (!orderData) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Get current task status
    const taskInfo = await describeTask(parseInt(taskId));

    res.json({
      order: orderData,
      taskInfo,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Order details error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel an automation order
router.delete("/orders/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Cancel the on-chain task
    await cancelTask(parseInt(taskId));

    // Remove from local storage
    const orderMaps = [
      global.limitOrders,
      global.dcaOrders,
      global.stopLossOrders,
    ];

    let removed = false;
    for (const map of orderMaps) {
      if (map && map.has(parseInt(taskId))) {
        map.delete(parseInt(taskId));
        removed = true;
        break;
      }
    }

    if (!removed) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Order cancellation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get automation analytics
router.get("/analytics", async (req, res) => {
  try {
    const { timeframe = "24h" } = req.query;

    // This would typically query a database for historical data
    // For now, we'll return mock analytics
    const analytics = {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalVolumeTraded: "0",
      averageExecutionTime: 0,
      successRate: 100,
      orderTypes: {
        limitOrders: global.limitOrders ? global.limitOrders.size : 0,
        dcaOrders: global.dcaOrders ? global.dcaOrders.size : 0,
        stopLossOrders: global.stopLossOrders ? global.stopLossOrders.size : 0,
      },
      timeframe,
      lastUpdated: new Date().toISOString(),
    };

    analytics.totalOrders = Object.values(analytics.orderTypes).reduce(
      (a, b) => a + b,
      0
    );
    analytics.activeOrders = analytics.totalOrders; // Simplified

    res.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a manual trigger (for testing)
router.post("/execute/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await executeTask(parseInt(taskId));

    res.json({
      success: true,
      taskId,
      result,
      message: "Task executed manually",
    });
  } catch (error) {
    console.error("Manual execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
