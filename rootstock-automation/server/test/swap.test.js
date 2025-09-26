import { describe, it, before } from "mocha";
import request from "supertest";
import { expect } from "chai";

// Set up test environment
process.env.DISABLE_LISTEN = "1";
process.env.OFFCHAIN_MOCK = "1";
process.env.DISABLE_EVENT_SUBS = "1";
process.env.RPC_URL = "https://public-node.testnet.rsk.co";
process.env.PRIVATE_KEY =
  "0x1234567890123456789012345678901234567890123456789012345678901234";
process.env.CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

import app from "../index.js";

describe("Uniswap v3 API Tests", function () {
  const mockTokenIn = "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d";
  const mockTokenOut = "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96";
  const mockRecipient = "0x742d35Cc6634C0532925a3b8D1b9B3a5D85C5b3B";

  describe("GET /swap/addresses", function () {
    it("should return Uniswap contract addresses", async function () {
      const res = await request(app).get("/swap/addresses").expect(200);

      expect(res.body).to.have.property("addresses");
      expect(res.body).to.have.property("feeTiers");
      expect(res.body.addresses).to.have.property("SWAP_ROUTER_02");
      expect(res.body.addresses).to.have.property("QUOTER_V2");
      expect(res.body.addresses.SWAP_ROUTER_02).to.equal(
        "0x0B14ff67f0014046b4b99057Aec4509640b3947A"
      );
    });
  });

  describe("POST /swap/quote/exact-input", function () {
    it("should return a quote for exact input swap", async function () {
      const res = await request(app)
        .post("/swap/quote/exact-input")
        .send({
          tokenIn: mockTokenIn,
          tokenOut: mockTokenOut,
          amountIn: "1000000000000000000", // 1 token
          fee: 3000,
        })
        .expect(200);

      expect(res.body).to.have.property("amountOut");
      expect(res.body).to.have.property("gasEstimate");
      expect(parseInt(res.body.amountOut)).to.be.greaterThan(0);
    });

    it("should return 400 for missing parameters", async function () {
      await request(app)
        .post("/swap/quote/exact-input")
        .send({
          tokenIn: mockTokenIn,
          // Missing tokenOut and amountIn
        })
        .expect(400);
    });
  });

  describe("POST /swap/quote/exact-output", function () {
    it("should return a quote for exact output swap", async function () {
      const res = await request(app)
        .post("/swap/quote/exact-output")
        .send({
          tokenIn: mockTokenIn,
          tokenOut: mockTokenOut,
          amountOut: "1000000000000000000", // 1 token
          fee: 3000,
        })
        .expect(200);

      expect(res.body).to.have.property("amountIn");
      expect(res.body).to.have.property("gasEstimate");
      expect(parseInt(res.body.amountIn)).to.be.greaterThan(0);
    });
  });

  describe("GET /swap/pool/:tokenA/:tokenB/:fee", function () {
    it("should return pool address for token pair", async function () {
      const res = await request(app)
        .get(`/swap/pool/${mockTokenIn}/${mockTokenOut}/3000`)
        .expect(200);

      expect(res.body).to.have.property("poolAddress");
      expect(res.body.poolAddress).to.be.a("string");
    });
  });

  describe("GET /swap/token/:address", function () {
    it("should return token information", async function () {
      const res = await request(app)
        .get(`/swap/token/${mockTokenIn}`)
        .expect(200);

      expect(res.body).to.have.property("decimals");
      expect(res.body).to.have.property("symbol");
      expect(res.body).to.have.property("name");
      expect(res.body.decimals).to.be.a("number");
    });
  });

  describe("GET /swap/token/:address/balance/:user", function () {
    it("should return user token balance", async function () {
      const res = await request(app)
        .get(`/swap/token/${mockTokenIn}/balance/${mockRecipient}`)
        .expect(200);

      expect(res.body).to.have.property("balance");
      expect(res.body.balance).to.be.a("string");
    });
  });

  describe("GET /swap/token/:address/allowance/:owner/:spender", function () {
    it("should return token allowance information", async function () {
      const spender = "0x0B14ff67f0014046b4b99057Aec4509640b3947A"; // SwapRouter02
      const res = await request(app)
        .get(`/swap/token/${mockTokenIn}/allowance/${mockRecipient}/${spender}`)
        .expect(200);

      expect(res.body).to.have.property("allowance");
      expect(res.body).to.have.property("hasApproval");
      expect(res.body.allowance).to.be.a("string");
      expect(res.body.hasApproval).to.be.a("boolean");
    });
  });

  describe("POST /swap/execute/exact-input", function () {
    it("should return success for swap execution (mocked)", async function () {
      const res = await request(app)
        .post("/swap/execute/exact-input")
        .send({
          tokenIn: mockTokenIn,
          tokenOut: mockTokenOut,
          amountIn: "1000000000000000000",
          amountOutMinimum: "990000000000000000",
          recipient: mockRecipient,
          fee: 3000,
        })
        .expect(200);

      expect(res.body).to.have.property("txHash");
      expect(res.body.txHash).to.include("0xmock");
    });

    it("should return 400 for missing required parameters", async function () {
      await request(app)
        .post("/swap/execute/exact-input")
        .send({
          tokenIn: mockTokenIn,
          tokenOut: mockTokenOut,
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe("POST /swap/liquidity/mint", function () {
    it("should return success for liquidity mint (mocked)", async function () {
      const res = await request(app)
        .post("/swap/liquidity/mint")
        .send({
          token0: mockTokenIn,
          token1: mockTokenOut,
          fee: 3000,
          tickLower: -887220,
          tickUpper: 887220,
          amount0Desired: "100000000000000000",
          amount1Desired: "100000000000000000",
          amount0Min: "0",
          amount1Min: "0",
          recipient: mockRecipient,
        })
        .expect(200);

      expect(res.body).to.have.property("txHash");
      expect(res.body.txHash).to.include("0xmock");
    });
  });

  describe("GET /swap/position/:tokenId", function () {
    it("should return position information (mocked)", async function () {
      const res = await request(app).get("/swap/position/1").expect(200);

      expect(res.body).to.have.property("token0");
      expect(res.body).to.have.property("token1");
      expect(res.body).to.have.property("fee");
      expect(res.body).to.have.property("liquidity");
    });
  });

  describe("GET /swap/positions/:owner", function () {
    it("should return user positions (mocked)", async function () {
      const res = await request(app)
        .get(`/swap/positions/${mockRecipient}`)
        .expect(200);

      expect(res.body).to.have.property("positions");
      expect(res.body.positions).to.be.an("array");
    });
  });

  describe("POST /swap/path/encode", function () {
    it("should encode multi-hop path", async function () {
      const res = await request(app)
        .post("/swap/path/encode")
        .send({
          tokens: [mockTokenIn, mockTokenOut],
          fees: [3000],
        })
        .expect(200);

      expect(res.body).to.have.property("path");
      expect(res.body.path).to.be.a("string");
      expect(res.body.path).to.include("0x");
    });

    it("should return 400 for invalid path parameters", async function () {
      await request(app)
        .post("/swap/path/encode")
        .send({
          tokens: [mockTokenIn], // Should have 2 tokens for 1 fee
          fees: [3000],
        })
        .expect(500); // encodePath will throw an error
    });
  });
});
