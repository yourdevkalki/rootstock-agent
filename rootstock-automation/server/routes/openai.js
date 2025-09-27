import { Router } from "express";
import {
  isOpenAIConfigured,
  getTradingAnalysis,
  generateTradingStrategy,
  analyzeSentiment,
  assessRisk,
  optimizePortfolio,
  generateTradingSignals,
} from "../services/openai.js";
import { getBTCPrice, getUSDCPrice, getTokenPrices } from "../services/pyth.js";

const router = Router();

// In-memory storage for strategies and analysis (in production, use a database)
const strategies = new Map();
const analyses = new Map();

// Health check endpoint
router.get("/health", async (_req, res) => {
  try {
    // Check if OpenAI API is configured
    if (!isOpenAIConfigured()) {
      return res.status(503).json({
        status: "unhealthy",
        message:
          "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "healthy",
      message: "OpenAI API configured successfully",
      model: process.env.OPENAI_MODEL || "gpt-4o",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// AI-powered trading analysis
router.post("/analysis/trading", async (req, res) => {
  try {
    const { symbol, marketData, priceHistory } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: symbol",
      });
    }

    // Get current price data if marketData not provided
    let currentMarketData = marketData;
    if (!currentMarketData) {
      if (symbol.toLowerCase().includes("btc")) {
        const btcPrice = await getBTCPrice();
        currentMarketData = {
          currentPrice: btcPrice.formatted,
          symbol: "BTC",
        };
      } else if (symbol.toLowerCase().includes("usd")) {
        const usdcPrice = await getUSDCPrice();
        currentMarketData = {
          currentPrice: usdcPrice.formatted,
          symbol: "USDC",
        };
      }
    }

    const analysis = await getTradingAnalysis(
      symbol,
      currentMarketData,
      priceHistory
    );

    // Store analysis for future reference
    const analysisId = `analysis_${Date.now()}`;
    analyses.set(analysisId, {
      id: analysisId,
      symbol,
      analysis,
      marketData: currentMarketData,
      created: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Trading analysis completed",
      data: {
        analysisId,
        symbol,
        analysis,
        marketData: currentMarketData,
      },
    });
  } catch (error) {
    console.error("Trading analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate trading strategy
router.post("/strategy/generate", async (req, res) => {
  try {
    const {
      portfolioSize,
      riskTolerance = "medium",
      timeHorizon = "medium",
      preferredAssets = ["BTC", "ETH"],
      marketCondition = "neutral",
    } = req.body;

    if (!portfolioSize) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: portfolioSize",
      });
    }

    const strategy = await generateTradingStrategy({
      portfolioSize,
      riskTolerance,
      timeHorizon,
      preferredAssets,
      marketCondition,
    });

    // Store strategy
    const strategyId = `strategy_${Date.now()}`;
    strategies.set(strategyId, {
      id: strategyId,
      strategy,
      parameters: {
        portfolioSize,
        riskTolerance,
        timeHorizon,
        preferredAssets,
        marketCondition,
      },
      created: new Date().toISOString(),
      status: "active",
    });

    res.json({
      success: true,
      message: "Trading strategy generated successfully",
      data: {
        strategyId,
        strategy,
        parameters: {
          portfolioSize,
          riskTolerance,
          timeHorizon,
          preferredAssets,
          marketCondition,
        },
      },
    });
  } catch (error) {
    console.error("Strategy generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Market sentiment analysis
router.post("/analysis/sentiment", async (req, res) => {
  try {
    const { newsData, socialData } = req.body;

    if (!newsData || !Array.isArray(newsData)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid newsData (should be array of news items)",
      });
    }

    const sentiment = await analyzeSentiment(newsData, socialData);

    res.json({
      success: true,
      message: "Sentiment analysis completed",
      data: {
        sentiment,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Risk assessment
router.post("/analysis/risk", async (req, res) => {
  try {
    const { position, marketData, portfolioData } = req.body;

    if (!position || !marketData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: position, marketData",
      });
    }

    const riskAssessment = await assessRisk(
      position,
      marketData,
      portfolioData
    );

    res.json({
      success: true,
      message: "Risk assessment completed",
      data: {
        position,
        riskAssessment,
        assessedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Risk assessment error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Portfolio optimization
router.post("/portfolio/optimize", async (req, res) => {
  try {
    const { currentPortfolio, constraints } = req.body;

    if (!currentPortfolio) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: currentPortfolio",
      });
    }

    const optimization = await optimizePortfolio(currentPortfolio, constraints);

    res.json({
      success: true,
      message: "Portfolio optimization completed",
      data: {
        optimization,
        originalPortfolio: currentPortfolio,
        constraints,
        optimizedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Portfolio optimization error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate trading signals
router.post("/signals/generate", async (req, res) => {
  try {
    const { marketData, technicalIndicators } = req.body;

    // Use current price data if marketData not provided
    let currentMarketData = marketData;
    if (!currentMarketData) {
      const priceData = await getTokenPrices();
      currentMarketData = {
        BTC: priceData.xBTC.formatted,
        USDC: priceData.xUSDC.formatted,
        timestamp: new Date().toISOString(),
      };
    }

    // Use mock technical indicators if not provided
    let indicators = technicalIndicators;
    if (!indicators) {
      indicators = {
        RSI: 45,
        MACD: { signal: "neutral", histogram: 0.1 },
        movingAverages: {
          MA20: currentMarketData.BTC * 0.98,
          MA50: currentMarketData.BTC * 0.95,
        },
        volume: "average",
        volatility: "moderate",
      };
    }

    const signals = await generateTradingSignals(currentMarketData, indicators);

    res.json({
      success: true,
      message: "Trading signals generated",
      data: {
        signals,
        marketData: currentMarketData,
        technicalIndicators: indicators,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Trading signals error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// AI Tool Call Endpoints - Simplified interfaces for AI agents

// Quick trading recommendation
router.post("/ai/recommendation", async (req, res) => {
  try {
    const { symbol = "BTC", amount, currentPosition } = req.body;

    // Get current price
    const priceData = await getTokenPrices();
    const currentPrice =
      symbol === "BTC" ? priceData.xBTC.formatted : priceData.xUSDC.formatted;

    const marketData = {
      currentPrice,
      symbol,
      timestamp: new Date().toISOString(),
    };

    const analysis = await getTradingAnalysis(symbol, marketData);

    // Generate actionable recommendation
    const recommendation = {
      action: analysis.recommendation,
      confidence: analysis.confidence,
      currentPrice,
      suggestedAmount: amount || (analysis.suggestedPositionSize / 100) * 10000, // Default $10k portfolio
      stopLoss: analysis.stopLoss,
      takeProfit: analysis.takeProfit,
      reasoning: analysis.analysis,
      riskLevel: analysis.confidence > 70 ? "moderate" : "high",
      timeFrame: analysis.timeHorizon,
    };

    res.json({
      success: true,
      message: `AI recommendation for ${symbol}`,
      data: recommendation,
    });
  } catch (error) {
    console.error("AI recommendation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Smart position sizing
router.post("/ai/position-size", async (req, res) => {
  try {
    const {
      portfolioValue,
      riskTolerance = "medium",
      symbol = "BTC",
      marketCondition = "neutral",
    } = req.body;

    if (!portfolioValue) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: portfolioValue",
      });
    }

    const strategy = await generateTradingStrategy({
      portfolioSize: portfolioValue,
      riskTolerance,
      timeHorizon: "medium",
      preferredAssets: [symbol],
      marketCondition,
    });

    const positionSize = {
      recommendedAmount:
        (portfolioValue * (strategy.assetAllocation[symbol] || 10)) / 100,
      maxPosition:
        (portfolioValue * strategy.riskManagement.maxPositionSize) / 100,
      stopLossPercent: strategy.riskManagement.stopLossPercentage,
      reasoning: `Based on ${riskTolerance} risk tolerance and ${marketCondition} market conditions`,
    };

    res.json({
      success: true,
      message: "Position sizing recommendation",
      data: positionSize,
    });
  } catch (error) {
    console.error("Position sizing error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Market timing advisor
router.get("/ai/market-timing", async (_req, res) => {
  try {
    const priceData = await getTokenPrices();

    // Mock news data for demonstration (in production, integrate with news API)
    const mockNews = [
      {
        title: "Bitcoin reaches new all-time high",
        summary: "BTC price surges past $110,000 amid institutional adoption",
        sentiment: "positive",
      },
      {
        title: "Federal Reserve maintains interest rates",
        summary: "Central bank policy remains supportive of risk assets",
        sentiment: "neutral",
      },
    ];

    const sentiment = await analyzeSentiment(mockNews);

    const marketData = {
      currentPrice: priceData.xBTC.formatted,
      symbol: "BTC",
      timestamp: new Date().toISOString(),
    };

    const analysis = await getTradingAnalysis("BTC", marketData);

    const timing = {
      signal: analysis.recommendation,
      confidence: analysis.confidence,
      sentimentScore: sentiment.sentimentScore,
      marketPhase:
        sentiment.sentimentScore > 20
          ? "bullish"
          : sentiment.sentimentScore < -20
          ? "bearish"
          : "neutral",
      recommendation:
        analysis.recommendation === "BUY" && sentiment.sentimentScore > 0
          ? "STRONG_BUY"
          : analysis.recommendation === "SELL" && sentiment.sentimentScore < 0
          ? "STRONG_SELL"
          : analysis.recommendation,
      optimalEntryWindow: analysis.timeHorizon,
    };

    res.json({
      success: true,
      message: "Market timing analysis",
      data: timing,
    });
  } catch (error) {
    console.error("Market timing error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all strategies
router.get("/strategies", (_req, res) => {
  try {
    const allStrategies = Array.from(strategies.values());
    res.json({
      success: true,
      data: allStrategies,
    });
  } catch (error) {
    console.error("Get strategies error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific strategy
router.get("/strategies/:strategyId", (req, res) => {
  try {
    const { strategyId } = req.params;
    const strategy = strategies.get(strategyId);

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: "Strategy not found",
      });
    }

    res.json({
      success: true,
      data: strategy,
    });
  } catch (error) {
    console.error("Get strategy error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete strategy
router.delete("/strategies/:strategyId", (req, res) => {
  try {
    const { strategyId } = req.params;

    if (!strategies.has(strategyId)) {
      return res.status(404).json({
        success: false,
        error: "Strategy not found",
      });
    }

    strategies.delete(strategyId);

    res.json({
      success: true,
      message: "Strategy deleted successfully",
    });
  } catch (error) {
    console.error("Delete strategy error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all analyses
router.get("/analyses", (_req, res) => {
  try {
    const allAnalyses = Array.from(analyses.values());
    res.json({
      success: true,
      data: allAnalyses,
    });
  } catch (error) {
    console.error("Get analyses error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
