import OpenAI from "openai";
import { getBTCPrice, getUSDCPrice, getTokenPrices } from "./pyth.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Check if OpenAI is configured
export function isOpenAIConfigured() {
  return !!OPENAI_API_KEY;
}

// Helper function to clean and parse JSON from OpenAI responses
function parseOpenAIJSON(text) {
  let cleanedText = text.trim();

  // Remove markdown code blocks
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/^```json\s*/, "");
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "");
  }
  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.replace(/\s*```$/, "");
  }

  // Find the JSON content between first { and last }
  const firstBrace = cleanedText.indexOf("{");
  const lastBrace = cleanedText.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
  }

  // Handle array responses (for trading signals)
  const firstBracket = cleanedText.indexOf("[");
  const lastBracket = cleanedText.lastIndexOf("]");

  if (
    firstBracket !== -1 &&
    lastBracket !== -1 &&
    lastBracket > firstBracket &&
    firstBracket < firstBrace
  ) {
    cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
  }

  // Remove any additional whitespace
  cleanedText = cleanedText.trim();

  // Try to parse the cleaned JSON
  return JSON.parse(cleanedText);
}

// Get trading analysis from OpenAI
export async function getTradingAnalysis(
  symbol,
  marketData,
  priceHistory = null
) {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
You are a professional crypto trading analyst. Analyze the following market data and provide trading recommendations.

Symbol: ${symbol}
Current Price: $${marketData.currentPrice}
24h Volume: ${marketData.volume || "N/A"}
Market Cap: ${marketData.marketCap || "N/A"}
Price Change 24h: ${marketData.priceChange24h || "N/A"}%

${
  priceHistory
    ? `Recent Price History: ${JSON.stringify(priceHistory, null, 2)}`
    : ""
}

Please provide:
1. Technical analysis summary
2. Trading recommendation (BUY/SELL/HOLD)
3. Confidence level (0-100%)
4. Key support and resistance levels
5. Risk factors to consider
6. Suggested position size (% of portfolio)

Format your response as JSON with the following structure:
{
  "analysis": "detailed technical analysis",
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 85,
  "supportLevels": [100000, 105000],
  "resistanceLevels": [115000, 120000],
  "riskFactors": ["list", "of", "risks"],
  "suggestedPositionSize": 10,
  "timeHorizon": "short|medium|long",
  "stopLoss": 108000,
  "takeProfit": 118000
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional cryptocurrency trading analyst with expertise in technical analysis and risk management. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const analysisText = response.choices[0].message.content.trim();

    // Try to parse JSON response
    try {
      return parseOpenAIJSON(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, return a structured fallback
      return {
        analysis: analysisText,
        recommendation: "HOLD",
        confidence: 50,
        supportLevels: [],
        resistanceLevels: [],
        riskFactors: ["Unable to parse detailed analysis"],
        suggestedPositionSize: 5,
        timeHorizon: "medium",
        stopLoss: null,
        takeProfit: null,
      };
    }
  } catch (error) {
    console.error("OpenAI trading analysis error:", error);
    throw error;
  }
}

// Generate trading strategy using OpenAI
export async function generateTradingStrategy(params) {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  const {
    portfolioSize,
    riskTolerance, // 'low' | 'medium' | 'high'
    timeHorizon, // 'short' | 'medium' | 'long'
    preferredAssets = ["BTC", "ETH"],
    marketCondition = "neutral", // 'bull' | 'bear' | 'neutral'
  } = params;

  const prompt = `
Create a comprehensive cryptocurrency trading strategy based on these parameters:

Portfolio Size: $${portfolioSize}
Risk Tolerance: ${riskTolerance}
Time Horizon: ${timeHorizon}
Preferred Assets: ${preferredAssets.join(", ")}
Market Condition: ${marketCondition}

Please create a detailed strategy including:
1. Asset allocation percentages
2. Entry and exit criteria
3. Risk management rules
4. Position sizing guidelines
5. Rebalancing frequency
6. Stop-loss and take-profit levels
7. Market condition adaptations

Format response as JSON:
{
  "strategyName": "Custom Strategy Name",
  "assetAllocation": {
    "BTC": 40,
    "ETH": 30,
    "cash": 30
  },
  "entryRules": ["rule1", "rule2"],
  "exitRules": ["rule1", "rule2"],
  "riskManagement": {
    "maxPositionSize": 20,
    "stopLossPercentage": 5,
    "takeProfitRatio": 2
  },
  "rebalancingFrequency": "weekly|monthly",
  "adaptations": {
    "bullMarket": "increase exposure",
    "bearMarket": "reduce exposure"
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional portfolio manager and trading strategist. Create detailed, actionable trading strategies. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const strategyText = response.choices[0].message.content.trim();
    return parseOpenAIJSON(strategyText);
  } catch (error) {
    console.error("OpenAI strategy generation error:", error);
    throw error;
  }
}

// Analyze market sentiment using OpenAI
export async function analyzeSentiment(newsData, socialData = null) {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
Analyze the market sentiment for cryptocurrency based on the following data:

News Headlines:
${newsData
  .map((item) => `- ${item.title}: ${item.summary || "No summary"}`)
  .join("\n")}

${
  socialData
    ? `Social Media Sentiment:
${JSON.stringify(socialData, null, 2)}`
    : ""
}

Please provide sentiment analysis with:
1. Overall sentiment score (-100 to +100)
2. Key themes affecting sentiment
3. Bullish indicators
4. Bearish indicators
5. Sentiment trend (improving/stable/deteriorating)

Format as JSON:
{
  "sentimentScore": 15,
  "sentiment": "slightly bullish",
  "keyThemes": ["adoption", "regulation"],
  "bullishIndicators": ["list of positive factors"],
  "bearishIndicators": ["list of negative factors"],
  "trend": "improving|stable|deteriorating",
  "confidence": 80
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a market sentiment analyst specializing in cryptocurrency markets. Provide objective, data-driven analysis. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const sentimentText = response.choices[0].message.content.trim();
    return parseOpenAIJSON(sentimentText);
  } catch (error) {
    console.error("OpenAI sentiment analysis error:", error);
    throw error;
  }
}

// Risk assessment using OpenAI
export async function assessRisk(position, marketData, portfolioData = null) {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
Assess the risk of this trading position:

Position Details:
- Asset: ${position.symbol}
- Size: ${position.amount}
- Entry Price: $${position.entryPrice}
- Current Price: $${marketData.currentPrice}
- Position Value: $${position.amount * marketData.currentPrice}
- P&L: ${(
    ((marketData.currentPrice - position.entryPrice) / position.entryPrice) *
    100
  ).toFixed(2)}%

Market Context:
- Volatility: ${marketData.volatility || "N/A"}
- Volume: ${marketData.volume || "N/A"}
- Market Cap: ${marketData.marketCap || "N/A"}

${
  portfolioData
    ? `Portfolio Context:
Total Value: $${portfolioData.totalValue}
Position as % of portfolio: ${(
        ((position.amount * marketData.currentPrice) /
          portfolioData.totalValue) *
        100
      ).toFixed(2)}%`
    : ""
}

Provide risk assessment with:
1. Risk score (0-100, where 100 is highest risk)
2. Risk factors
3. Recommended actions
4. Position sizing recommendations
5. Hedging suggestions

Format as JSON:
{
  "riskScore": 45,
  "riskLevel": "moderate",
  "riskFactors": ["high volatility", "overexposure"],
  "recommendedActions": ["reduce position size", "set stop loss"],
  "suggestedStopLoss": 105000,
  "hedgingOptions": ["buy put options"],
  "maxRecommendedExposure": 15
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a risk management specialist for cryptocurrency trading. Provide detailed, actionable risk assessments. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });

    const riskText = response.choices[0].message.content.trim();
    return parseOpenAIJSON(riskText);
  } catch (error) {
    console.error("OpenAI risk assessment error:", error);
    throw error;
  }
}

// Portfolio optimization using OpenAI
export async function optimizePortfolio(currentPortfolio, constraints = {}) {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
Optimize this cryptocurrency portfolio:

Current Portfolio:
${JSON.stringify(currentPortfolio, null, 2)}

Constraints:
- Minimum cash percentage: ${constraints.minCash || 10}%
- Maximum single asset exposure: ${constraints.maxSingleAsset || 50}%
- Risk tolerance: ${constraints.riskTolerance || "moderate"}
- Investment horizon: ${constraints.timeHorizon || "medium"}

Provide optimization recommendations:
1. Suggested rebalancing
2. Asset allocation changes
3. Risk-adjusted returns estimate
4. Diversification improvements
5. Cost analysis of changes

Format as JSON:
{
  "currentAllocation": {...},
  "suggestedAllocation": {...},
  "rebalancingActions": [
    {"action": "sell", "asset": "BTC", "amount": 0.1, "reason": "overweight"}
  ],
  "expectedImprovement": {
    "riskReduction": 15,
    "returnIncrease": 8
  },
  "riskMetrics": {
    "sharpeRatio": 1.2,
    "maxDrawdown": 25
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a portfolio optimization specialist. Provide mathematically sound, practical portfolio recommendations. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const optimizationText = response.choices[0].message.content.trim();
    return parseOpenAIJSON(optimizationText);
  } catch (error) {
    console.error("OpenAI portfolio optimization error:", error);
    throw error;
  }
}

// Generate trading signals using OpenAI
export async function generateTradingSignals(marketData, technicalIndicators) {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  // Get current price data for context
  const priceData = await getTokenPrices();

  const prompt = `
Generate trading signals based on current market data and technical indicators:

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Price Data:
BTC: $${priceData.xBTC.formatted}
USDC: $${priceData.xUSDC.formatted}

Technical Indicators:
${JSON.stringify(technicalIndicators, null, 2)}

Generate specific trading signals with:
1. Signal type (BUY/SELL/HOLD)
2. Confidence level
3. Entry price
4. Stop loss level
5. Take profit targets
6. Position size recommendation
7. Time frame

Format as JSON array:
[
  {
    "signal": "BUY",
    "asset": "BTC",
    "confidence": 75,
    "entryPrice": 110000,
    "stopLoss": 105000,
    "takeProfitTargets": [115000, 120000],
    "positionSize": 10,
    "timeFrame": "1-2 weeks",
    "reasoning": "bullish divergence on RSI"
  }
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional trading signal generator. Create specific, actionable trading signals with clear entry/exit criteria. Always respond with valid JSON array.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const signalsText = response.choices[0].message.content.trim();
    return parseOpenAIJSON(signalsText);
  } catch (error) {
    console.error("OpenAI trading signals error:", error);
    throw error;
  }
}
