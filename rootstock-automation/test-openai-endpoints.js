#!/usr/bin/env node

import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

class OpenAIEndpointTester {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async makeRequest(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data,
      };
    } catch (error) {
      return {
        status: 500,
        ok: false,
        error: error.message,
      };
    }
  }

  async testEndpoint(
    name,
    method,
    endpoint,
    expectedStatus = 200,
    body = null
  ) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);

    const response = await this.makeRequest(method, endpoint, body);

    const statusIcon = response.ok ? "✅" : "❌";
    console.log(`   ${statusIcon} Status: ${response.status}`);

    if (response.data) {
      if (response.data.success !== undefined) {
        console.log(`   📊 Success: ${response.data.success}`);
      }
      if (response.data.message) {
        console.log(`   📝 Message: ${response.data.message}`);
      }
      if (response.data.error) {
        console.log(`   🚨 Error: ${response.data.error}`);
      }
    }

    return response;
  }

  async runTests() {
    console.log("🚀 Testing OpenAI API Endpoints");
    console.log("=".repeat(50));

    // Test basic health endpoint
    await this.testEndpoint("Health Check", "GET", "/health");

    // Test OpenAI health endpoint
    await this.testEndpoint("OpenAI Health Check", "GET", "/openai/health");

    // Test AI trading analysis
    await this.testEndpoint("Trading Analysis", "POST", "/openai/analysis/trading", 200, {
      symbol: "BTC",
      marketData: {
        currentPrice: 110000,
        symbol: "BTC"
      }
    });

    // Test strategy generation
    await this.testEndpoint("Generate Strategy", "POST", "/openai/strategy/generate", 200, {
      portfolioSize: 10000,
      riskTolerance: "medium",
      timeHorizon: "medium"
    });

    // Test AI recommendations
    await this.testEndpoint("AI Recommendation", "POST", "/openai/ai/recommendation", 200, {
      symbol: "BTC",
      amount: 1000
    });

    // Test position sizing
    await this.testEndpoint("Position Sizing", "POST", "/openai/ai/position-size", 200, {
      portfolioValue: 10000,
      riskTolerance: "medium"
    });

    // Test market timing
    await this.testEndpoint("Market Timing", "GET", "/openai/ai/market-timing");

    // Test trading signals
    await this.testEndpoint("Trading Signals", "POST", "/openai/signals/generate", 200, {
      marketData: {
        BTC: 110000,
        USDC: 1
      }
    });

    // Test risk assessment  
    await this.testEndpoint("Risk Assessment", "POST", "/openai/analysis/risk", 200, {
      position: {
        symbol: "BTC",
        amount: 0.1,
        entryPrice: 105000
      },
      marketData: {
        currentPrice: 110000
      }
    });

    // Test portfolio optimization
    await this.testEndpoint("Portfolio Optimization", "POST", "/openai/portfolio/optimize", 200, {
      currentPortfolio: {
        BTC: 0.5,
        USDC: 5000
      }
    });

    // Test strategy endpoints
    await this.testEndpoint("Get All Strategies", "GET", "/openai/strategies");
    await this.testEndpoint("Get All Analyses", "GET", "/openai/analyses");

    // Test updated pricing endpoints
    console.log("\n🏷️  Testing Updated Pricing");
    console.log("-".repeat(30));

    await this.testEndpoint("BTC Price", "GET", "/prices/btc");
    await this.testEndpoint("Token Prices", "GET", "/prices/tokens");

    console.log("\n✅ Test Suite Completed");
    console.log("=".repeat(50));
  }
}

// Run tests if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const tester = new OpenAIEndpointTester();

  console.log("⏳ Starting endpoint tests in 2 seconds...");
  setTimeout(() => {
    tester.runTests().catch(console.error);
  }, 2000);
}

export default OpenAIEndpointTester;
