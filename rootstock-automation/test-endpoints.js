#!/usr/bin/env node

import fetch from "node-fetch";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

class APITester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.passed = 0;
    this.failed = 0;
    this.results = [];
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

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
      this.results.push({ name, status: "PASSED" });
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
      this.results.push({ name, status: "FAILED", error: error.message });
    }
  }

  async expect(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async runAllTests() {
    console.log("🚀 Starting API Endpoint Tests");
    console.log("================================\n");

    // Health check
    await this.test("Health Check", async () => {
      const response = await this.makeRequest("GET", "/health");
      await this.expect(response.ok, "Health check failed");
      await this.expect(
        response.data.ok === true,
        "Health check returned false"
      );
    });

    // Test Prices Endpoints
    await this.test("Get Price Feeds", async () => {
      const response = await this.makeRequest("GET", "/prices/feeds");
      await this.expect(response.ok, "Price feeds request failed");
      await this.expect(response.data.feeds, "No feeds returned");
    });

    await this.test("Get BTC Price", async () => {
      const response = await this.makeRequest("GET", "/prices/btc");
      await this.expect(response.ok, "BTC price request failed");
      await this.expect(response.data.formatted > 0, "Invalid BTC price");
    });

    await this.test("Get USDC Price", async () => {
      const response = await this.makeRequest("GET", "/prices/usdc");
      await this.expect(response.ok, "USDC price request failed");
      await this.expect(response.data.formatted > 0, "Invalid USDC price");
    });

    await this.test("Get All Token Prices", async () => {
      const response = await this.makeRequest("GET", "/prices/tokens");
      await this.expect(response.ok, "Token prices request failed");
      await this.expect(response.data.xBTC, "No xBTC price returned");
      await this.expect(response.data.xUSDC, "No xUSDC price returned");
    });

    await this.test("Get Token Price by Symbol (xBTC)", async () => {
      const response = await this.makeRequest("GET", "/prices/token/xBTC");
      await this.expect(response.ok, "xBTC token price request failed");
      await this.expect(
        response.data.symbol === "xBTC",
        "Wrong token symbol returned"
      );
    });

    await this.test("Get Token Price by Symbol (xUSDC)", async () => {
      const response = await this.makeRequest("GET", "/prices/token/xUSDC");
      await this.expect(response.ok, "xUSDC token price request failed");
      await this.expect(
        response.data.symbol === "xUSDC",
        "Wrong token symbol returned"
      );
    });

    // Test Token Endpoints
    await this.test("Get All Tokens", async () => {
      const response = await this.makeRequest("GET", "/tokens");
      await this.expect(response.ok, "Tokens request failed");
      await this.expect(
        Array.isArray(response.data.tokens),
        "Tokens should be an array"
      );
      await this.expect(
        response.data.tokens.length === 2,
        "Should have exactly 2 tokens"
      );
    });

    await this.test("Get Token Details (xBTC)", async () => {
      const response = await this.makeRequest("GET", "/tokens/xBTC");
      await this.expect(response.ok, "xBTC details request failed");
      await this.expect(response.data.symbol === "xBTC", "Wrong token symbol");
      await this.expect(
        response.data.currentPrice,
        "No current price included"
      );
    });

    await this.test("Get Token Details (xUSDC)", async () => {
      const response = await this.makeRequest("GET", "/tokens/xUSDC");
      await this.expect(response.ok, "xUSDC details request failed");
      await this.expect(response.data.symbol === "xUSDC", "Wrong token symbol");
      await this.expect(
        response.data.currentPrice,
        "No current price included"
      );
    });

    await this.test("Get Exchange Rate (xBTC to xUSDC)", async () => {
      const response = await this.makeRequest("GET", "/tokens/xBTC/rate/xUSDC");
      await this.expect(response.ok, "Exchange rate request failed");
      await this.expect(response.data.rate > 0, "Invalid exchange rate");
      await this.expect(response.data.fromToken === "XBTC", "Wrong from token");
      await this.expect(response.data.toToken === "XUSDC", "Wrong to token");
    });

    await this.test("Get Exchange Rate (xUSDC to xBTC)", async () => {
      const response = await this.makeRequest("GET", "/tokens/xUSDC/rate/xBTC");
      await this.expect(response.ok, "Exchange rate request failed");
      await this.expect(response.data.rate > 0, "Invalid exchange rate");
      await this.expect(
        response.data.fromToken === "XUSDC",
        "Wrong from token"
      );
      await this.expect(response.data.toToken === "XBTC", "Wrong to token");
    });

    await this.test("Get All Token Prices with Metadata", async () => {
      const response = await this.makeRequest("GET", "/tokens/prices/all");
      await this.expect(response.ok, "All prices request failed");
      await this.expect(response.data.tokens, "No tokens in response");
      await this.expect(response.data.tokens.xBTC, "No xBTC data");
      await this.expect(response.data.tokens.xUSDC, "No xUSDC data");
    });

    // Test Dummy Tokens Endpoints
    await this.test("Get Dummy Token Addresses", async () => {
      const response = await this.makeRequest("GET", "/dummy-tokens/addresses");
      await this.expect(response.ok, "Addresses request failed");
      await this.expect(response.data.addresses, "No addresses returned");
    });

    await this.test("Get Supported Tokens", async () => {
      const response = await this.makeRequest("GET", "/dummy-tokens/tokens");
      await this.expect(response.ok, "Supported tokens request failed");
      await this.expect(
        Array.isArray(response.data.tokens),
        "Tokens should be an array"
      );
    });

    await this.test("Get Pool Info", async () => {
      const response = await this.makeRequest("GET", "/dummy-tokens/pool/info");
      await this.expect(response.ok, "Pool info request failed");
      await this.expect(
        response.data.xbtcReserve !== undefined,
        "No xBTC reserve info"
      );
      await this.expect(
        response.data.xusdcReserve !== undefined,
        "No xUSDC reserve info"
      );
    });

    // Test Enhanced Swap Endpoints
    await this.test("Get Market Data", async () => {
      const response = await this.makeRequest("GET", "/swap-pyth/market-data");
      await this.expect(response.ok, "Market data request failed");
      await this.expect(response.data.pool, "No pool data");
      await this.expect(response.data.realTimePrices, "No real-time prices");
    });

    await this.test("Get Arbitrage Opportunities", async () => {
      const response = await this.makeRequest("GET", "/swap-pyth/arbitrage");
      await this.expect(response.ok, "Arbitrage data request failed");
      await this.expect(response.data.poolPrice !== undefined, "No pool price");
      await this.expect(
        response.data.marketPrice !== undefined,
        "No market price"
      );
    });

    // Test Automation Endpoints
    await this.test("Get Automation Orders", async () => {
      const response = await this.makeRequest("GET", "/automation/orders");
      await this.expect(response.ok, "Automation orders request failed");
      await this.expect(
        Array.isArray(response.data.orders),
        "Orders should be an array"
      );
    });

    await this.test("Get Automation Analytics", async () => {
      const response = await this.makeRequest("GET", "/automation/analytics");
      await this.expect(response.ok, "Analytics request failed");
      await this.expect(
        response.data.totalOrders !== undefined,
        "No total orders count"
      );
      await this.expect(response.data.orderTypes, "No order types breakdown");
    });

    // Test Task Endpoints
    await this.test("Get All Tasks", async () => {
      const response = await this.makeRequest("GET", "/tasks");
      await this.expect(response.ok, "Tasks request failed");
      await this.expect(
        Array.isArray(response.data),
        "Tasks should be an array"
      );
    });

    await this.test("Get Task Spender Address", async () => {
      const response = await this.makeRequest("GET", "/tasks/spender");
      await this.expect(response.ok, "Spender address request failed");
      await this.expect(response.data.spender, "No spender address returned");
    });

    // Error handling tests
    await this.test("Invalid Token Symbol (404)", async () => {
      const response = await this.makeRequest("GET", "/tokens/INVALID");
      await this.expect(
        response.status === 404,
        "Should return 404 for invalid token"
      );
    });

    await this.test("Invalid Exchange Rate Pair (400)", async () => {
      const response = await this.makeRequest(
        "GET",
        "/tokens/INVALID/rate/xBTC"
      );
      await this.expect(
        response.status === 400,
        "Should return 400 for invalid token pair"
      );
    });

    // Summary
    console.log("\n📊 Test Results Summary");
    console.log("=======================");
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(
      `📈 Success Rate: ${(
        (this.passed / (this.passed + this.failed)) *
        100
      ).toFixed(2)}%`
    );

    if (this.failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results
        .filter((r) => r.status === "FAILED")
        .forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
    }

    console.log("\n🎉 All endpoint tests completed!");

    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      successRate: (this.passed / (this.passed + this.failed)) * 100,
    };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester(BASE_URL);

  console.log(`🌐 Testing API at: ${BASE_URL}`);
  console.log("Make sure the server is running first!\n");

  try {
    const results = await tester.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Test runner failed:", error.message);
    process.exit(1);
  }
}

export { APITester };
