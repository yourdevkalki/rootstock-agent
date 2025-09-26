# Dummy Tokens (xBTC & xUSD) Documentation

This document describes the dummy tokens xBTC and xUSD, along with the DummySwap contract for trading between them. The token prices are pegged to real BTC and USD prices using Pyth oracles.

## Overview

- **xBTC**: Dummy Bitcoin token representing BTC
- **xUSD**: Dummy USD stablecoin representing USD
- **DummySwap**: Simple AMM-style swap contract for xBTC/xUSD trading
- **Price Integration**: Real-time price feeds from Pyth Network

## Smart Contracts

### XBTC Token (`contracts/XBTC.sol`)

Standard ERC20 token with additional minting functionality for testing.

**Key Features:**

- Name: "Dummy Bitcoin"
- Symbol: "xBTC"
- Decimals: 18
- Mintable for testing purposes

### XUSD Token (`contracts/XUSD.sol`)

Standard ERC20 token representing USD with minting capabilities.

**Key Features:**

- Name: "Dummy USD"
- Symbol: "xUSD"
- Decimals: 18
- Mintable for testing purposes

### DummySwap Contract (`contracts/DummySwap.sol`)

Simple constant product AMM for swapping between xBTC and xUSD.

**Key Features:**

- Constant product formula (x \* y = k)
- 0.3% trading fee
- Liquidity management
- Price quotes
- Event logging

## Deployment

### Deploy to Rootstock Testnet

```bash
# Deploy all contracts (xBTC, xUSD, and DummySwap)
npm run hh:deploy:tokens:testnet

# Or deploy individually using hardhat
npx hardhat run scripts/deploy-tokens.js --network rootstock_testnet
```

### Environment Variables

Create a `.env` file with:

```bash
# Rootstock Testnet Configuration
RPC_URL=https://public-node.testnet.rsk.co
PRIVATE_KEY=your_private_key_here
CHAIN_ID=31

# Contract Addresses (set after deployment)
XBTC_ADDRESS=deployed_xbtc_address
XUSD_ADDRESS=deployed_xusd_address
DUMMY_SWAP_ADDRESS=deployed_swap_address

# Pyth Configuration
PYTH_HERMES_URL=https://hermes.pyth.network

# API Configuration
PORT=3000
```

## API Endpoints

### Dummy Token Routes (`/dummy-tokens`)

#### Get Contract Addresses

```http
GET /dummy-tokens/addresses
```

Response:

```json
{
  "addresses": {
    "XBTC": "0x...",
    "XUSD": "0x...",
    "DUMMY_SWAP": "0x..."
  },
  "description": {
    "XBTC": "Dummy Bitcoin token address",
    "XUSD": "Dummy USD token address",
    "DUMMY_SWAP": "Dummy swap contract address"
  }
}
```

#### Update Addresses (Admin)

```http
POST /dummy-tokens/addresses
Content-Type: application/json

{
  "XBTC": "0x...",
  "XUSD": "0x...",
  "DUMMY_SWAP": "0x..."
}
```

#### Get Token Information

```http
GET /dummy-tokens/token/{address}
```

Response:

```json
{
  "name": "Dummy Bitcoin",
  "symbol": "xBTC",
  "decimals": 18,
  "address": "0x..."
}
```

#### Get Token Balance

```http
GET /dummy-tokens/token/{address}/balance/{userAddress}
```

Response:

```json
{
  "balance": "1000000000000000000000",
  "formatted": "1000.0",
  "decimals": 18
}
```

#### Get Token Allowance

```http
GET /dummy-tokens/token/{address}/allowance/{owner}/{spender}
```

Response:

```json
{
  "allowance": "1000000000000000000000",
  "formatted": "1000.0",
  "decimals": 18
}
```

#### Get Swap Quote

```http
POST /dummy-tokens/quote
Content-Type: application/json

{
  "tokenIn": "0xXBTC_ADDRESS",
  "tokenOut": "0xXUSD_ADDRESS",
  "amountIn": "1000000000000000000"
}
```

Response:

```json
{
  "amountIn": "1000000000000000000",
  "amountOut": "65000000000000000000000",
  "tokenIn": "0xXBTC_ADDRESS",
  "tokenOut": "0xXUSD_ADDRESS",
  "rate": "65000"
}
```

#### Execute Swap

```http
POST /dummy-tokens/swap
Content-Type: application/json

{
  "tokenIn": "0xXBTC_ADDRESS",
  "tokenOut": "0xXUSD_ADDRESS",
  "amountIn": "1000000000000000000",
  "minAmountOut": "64000000000000000000000",
  "recipient": "0xRECIPIENT_ADDRESS"
}
```

Response:

```json
{
  "txHash": "0x...",
  "amountIn": "1000000000000000000",
  "amountOut": "65000000000000000000000",
  "gasUsed": "150000",
  "success": true
}
```

#### Get Pool Information

```http
GET /dummy-tokens/pool/info
```

Response:

```json
{
  "xbtcReserve": "10000000000000000000",
  "xusdReserve": "650000000000000000000000",
  "price": "65000000000000000000000",
  "priceFormatted": "65000.0"
}
```

#### Add Liquidity (Admin)

```http
POST /dummy-tokens/liquidity/add
Content-Type: application/json

{
  "xbtcAmount": "1000000000000000000",
  "xusdAmount": "65000000000000000000000"
}
```

#### Mint Tokens (Testing)

```http
POST /dummy-tokens/mint
Content-Type: application/json

{
  "token": "0xXBTC_ADDRESS",
  "recipient": "0xRECIPIENT_ADDRESS",
  "amount": "1000000000000000000"
}
```

#### Get Supported Tokens

```http
GET /dummy-tokens/tokens
```

Response:

```json
{
  "tokens": [
    {
      "address": "0xXBTC_ADDRESS",
      "symbol": "xBTC",
      "name": "Dummy Bitcoin",
      "decimals": 18
    },
    {
      "address": "0xXUSD_ADDRESS",
      "symbol": "xUSD",
      "name": "Dummy USD",
      "decimals": 18
    }
  ],
  "swapContract": "0xDUMMY_SWAP_ADDRESS"
}
```

### Price Routes (`/prices`)

#### Get All Price Feeds

```http
GET /prices/feeds
```

#### Get BTC Price

```http
GET /prices/btc
```

Response:

```json
{
  "symbol": "BTC",
  "name": "Bitcoin",
  "price": 6500000000000,
  "expo": -8,
  "formatted": 65000
}
```

#### Get Token Prices

```http
GET /prices/tokens
```

Response:

```json
{
  "xBTC": {
    "symbol": "xBTC",
    "name": "Dummy Bitcoin",
    "price": 6500000000000,
    "expo": -8,
    "formatted": 65000
  },
  "xUSD": {
    "symbol": "xUSD",
    "name": "Dummy USD",
    "price": 100000000,
    "expo": -8,
    "formatted": 1.0
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

#### Get Specific Token Price

```http
GET /prices/token/{symbol}  # xBTC or xUSD
```

## Testing

### Local Testing with Mock Data

```bash
# Start server with mock data
OFFCHAIN_MOCK=1 npm run dev

# Run API tests
npm run api:test

# Test swap functionality
npm run test:swap
```

### Testnet Testing

1. **Deploy contracts:**

   ```bash
   npm run hh:deploy:tokens:testnet
   ```

2. **Update environment variables** with deployed addresses

3. **Start server:**

   ```bash
   npm run dev
   ```

4. **Test endpoints:**

   ```bash
   # Get token prices
   curl http://localhost:3000/prices/tokens

   # Get swap quote
   curl -X POST http://localhost:3000/dummy-tokens/quote \
     -H "Content-Type: application/json" \
     -d '{"tokenIn":"XBTC_ADDRESS","tokenOut":"XUSD_ADDRESS","amountIn":"1000000000000000000"}'
   ```

## Integration Examples

### JavaScript/Node.js

```javascript
import { ethers } from "ethers";

// Setup
const provider = new ethers.JsonRpcProvider(
  "https://public-node.testnet.rsk.co"
);
const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

// Contract ABIs (abbreviated)
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

const SWAP_ABI = [
  "function swapXBTCForXUSD(uint256) external",
  "function getXBTCToXUSDQuote(uint256) view returns (uint256)",
];

// Get quote
async function getQuote() {
  const response = await fetch("http://localhost:3000/dummy-tokens/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokenIn: "XBTC_ADDRESS",
      tokenOut: "XUSD_ADDRESS",
      amountIn: ethers.parseEther("1").toString(),
    }),
  });

  return await response.json();
}

// Execute swap
async function executeSwap() {
  const swapContract = new ethers.Contract("SWAP_ADDRESS", SWAP_ABI, wallet);
  const xbtcContract = new ethers.Contract("XBTC_ADDRESS", ERC20_ABI, wallet);

  // Approve
  await xbtcContract.approve("SWAP_ADDRESS", ethers.parseEther("1"));

  // Swap
  const tx = await swapContract.swapXBTCForXUSD(ethers.parseEther("1"));
  await tx.wait();
}
```

### React Frontend

```jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

function TokenSwap() {
  const [prices, setPrices] = useState({});
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    fetch("/prices/tokens")
      .then((res) => res.json())
      .then(setPrices);
  }, []);

  const getQuote = async (amountIn) => {
    const response = await fetch("/dummy-tokens/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenIn: addresses.XBTC,
        tokenOut: addresses.XUSD,
        amountIn: ethers.parseEther(amountIn).toString(),
      }),
    });

    const data = await response.json();
    setQuote(data);
  };

  return (
    <div>
      <h3>Current Prices</h3>
      <p>xBTC: ${prices.xBTC?.formatted}</p>
      <p>xUSD: ${prices.xUSD?.formatted}</p>

      {/* Swap interface */}
      <input
        type="number"
        placeholder="Amount to swap"
        onChange={(e) => getQuote(e.target.value)}
      />

      {quote && (
        <p>You'll receive: {ethers.formatEther(quote.amountOut)} xUSD</p>
      )}
    </div>
  );
}
```

## Security Considerations

⚠️ **Important**: These are dummy tokens for testing purposes only!

- Contracts include minting functions - not suitable for production
- No access controls on admin functions
- Simple AMM implementation without advanced protection mechanisms
- Always verify contract addresses before mainnet usage

## Support

For issues or questions:

1. Check the API endpoints return expected data
2. Verify contract addresses are correctly set
3. Ensure sufficient testnet tokens for gas
4. Review transaction logs for debugging

## Roadmap

Future improvements:

- [ ] Add more sophisticated AMM features
- [ ] Implement governance tokens
- [ ] Add liquidity provider tokens
- [ ] Historical price data API
- [ ] Advanced trading features
- [ ] Security audits for production use
