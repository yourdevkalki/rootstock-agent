# Uniswap v3 Integration on Rootstock

This project now includes complete Uniswap v3 swap and liquidity management functionality for the Rootstock blockchain.

## 🔧 Contract Addresses (Rootstock)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| SwapRouter02               | `0x0B14ff67f0014046b4b99057Aec4509640b3947A` |
| QuoterV2                   | `0xb51727c996C68E60F598A923a5006853cd2fEB31` |
| NonfungiblePositionManager | `0x9d9386c042F194B460Ec424a1e57ACDE25f5C4b1` |
| V3CoreFactory              | `0xaF37EC98A00FD63689CF3060BF3B6784E00caD82` |

## 🚀 Quick Start

### 1. Get Swap Quote

```bash
curl -X POST http://localhost:3000/swap/quote/exact-input \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d",
    "tokenOut": "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96",
    "amountIn": "1000000000000000000",
    "fee": 3000
  }'
```

### 2. Execute Swap

```bash
curl -X POST http://localhost:3000/swap/execute/exact-input \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d",
    "tokenOut": "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96",
    "amountIn": "1000000000000000000",
    "amountOutMinimum": "990000000",
    "recipient": "0x742d35Cc6634C0532925a3b8D1b9B3a5D85C5b3B",
    "fee": 3000
  }'
```

### 3. Create Liquidity Position

```bash
curl -X POST http://localhost:3000/swap/liquidity/mint \
  -H "Content-Type: application/json" \
  -d '{
    "token0": "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d",
    "token1": "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96",
    "fee": 3000,
    "tickLower": -887220,
    "tickUpper": 887220,
    "amount0Desired": "100000000000000000",
    "amount1Desired": "10000000000",
    "amount0Min": "0",
    "amount1Min": "0",
    "recipient": "0x742d35Cc6634C0532925a3b8D1b9B3a5D85C5b3B"
  }'
```

## 📡 API Endpoints

### Swap Operations

| Endpoint                     | Method | Description                        |
| ---------------------------- | ------ | ---------------------------------- |
| `/swap/addresses`            | GET    | Get all Uniswap contract addresses |
| `/swap/quote/exact-input`    | POST   | Get quote for exact input swap     |
| `/swap/quote/exact-output`   | POST   | Get quote for exact output swap    |
| `/swap/execute/exact-input`  | POST   | Execute exact input swap           |
| `/swap/execute/exact-output` | POST   | Execute exact output swap          |
| `/swap/execute/multi-hop`    | POST   | Execute multi-hop swap             |

### Pool & Token Information

| Endpoint                                         | Method | Description            |
| ------------------------------------------------ | ------ | ---------------------- |
| `/swap/pool/:tokenA/:tokenB/:fee`                | GET    | Get pool address       |
| `/swap/token/:address`                           | GET    | Get token information  |
| `/swap/token/:address/balance/:user`             | GET    | Get user token balance |
| `/swap/token/:address/allowance/:owner/:spender` | GET    | Check token allowance  |

### Liquidity Management

| Endpoint                   | Method | Description                        |
| -------------------------- | ------ | ---------------------------------- |
| `/swap/liquidity/mint`     | POST   | Create new liquidity position      |
| `/swap/liquidity/increase` | POST   | Add liquidity to existing position |
| `/swap/liquidity/decrease` | POST   | Remove liquidity from position     |
| `/swap/liquidity/collect`  | POST   | Collect fees from position         |
| `/swap/position/:tokenId`  | GET    | Get position details               |
| `/swap/positions/:owner`   | GET    | Get all positions for owner        |

## 🛠️ Fee Tiers

Uniswap v3 supports multiple fee tiers:

- **100** (0.01%) - Stable pairs
- **500** (0.05%) - Low volatility pairs
- **3000** (0.3%) - Standard pairs
- **10000** (1%) - High volatility pairs

## 💡 Usage Examples

### JavaScript/Node.js

```javascript
import { ethers } from "ethers";

// Get a quote
const response = await fetch("http://localhost:3000/swap/quote/exact-input", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tokenIn: "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d",
    tokenOut: "0xeF213441A85dF4d7ACbdAE0Cf78004e1e486BB96",
    amountIn: ethers.parseUnits("0.001", 18).toString(),
    fee: 3000,
  }),
});

const quote = await response.json();
console.log(`Expected output: ${ethers.formatUnits(quote.amountOut, 6)} USDT`);
```

### Python

```python
import requests

# Get token information
response = requests.get('http://localhost:3000/swap/token/0x542fDA317318eBF1d3DEAf76E0b632741A7e677d')
token_info = response.json()
print(f"Token: {token_info['name']} ({token_info['symbol']})")
```

## 🔐 Security & Best Practices

### Before Swapping:

1. **Check Token Approvals**: Ensure tokens are approved for the SwapRouter
2. **Validate Quotes**: Always get fresh quotes before executing swaps
3. **Set Slippage Protection**: Use appropriate `amountOutMinimum` values
4. **Check Gas Estimates**: Monitor gas costs, especially for complex swaps

### Example: Safe Swap Flow

```javascript
// 1. Get quote
const quote = await getQuote(tokenIn, tokenOut, amountIn);

// 2. Calculate slippage protection (1%)
const slippage = 0.01;
const amountOutMinimum = BigInt(
  Math.floor(Number(quote.amountOut) * (1 - slippage))
);

// 3. Check allowance
const allowance = await checkAllowance(tokenIn, userAddress, SWAP_ROUTER);
if (!allowance.hasApproval) {
  // Approve token first
  await approveToken(tokenIn, SWAP_ROUTER, amountIn);
}

// 4. Execute swap
const result = await executeSwap({
  tokenIn,
  tokenOut,
  amountIn,
  amountOutMinimum: amountOutMinimum.toString(),
  recipient: userAddress,
  fee: 3000,
});
```

## 🧪 Testing

Run the demo script to test functionality:

```bash
npm run swap:demo
```

This will demonstrate:

- Getting token information
- Fetching swap quotes
- Checking allowances
- Example swap parameters

## 📊 Integration with Automation

The Uniswap service integrates seamlessly with the existing task automation system:

```javascript
// Create automated swap task
const swapTask = await createPriceTask(
  SWAP_ROUTER_ADDRESS,
  swapCallData,
  pythPriceId,
  "gte", // Execute when price >= target
  targetPrice,
  priceExponent
);
```

## 🌐 Rootstock Specific Notes

- **Chain ID**: 30 (mainnet) / 31 (testnet)
- **Native Token**: RBTC (Bitcoin-backed)
- **Popular Pairs**: WRBTC/USDT, WRBTC/DAI
- **Bridge Tokens**: Most tokens are bridged from Ethereum

## 📚 References

- [Uniswap v3 Documentation](https://docs.uniswap.org/)
- [Rootstock Documentation](https://dev.rootstock.io/)
- [Oku Trade (Rootstock Uniswap Interface)](https://oku.trade/app/rootstock/)

## ⚠️ Important Notes

1. **Test on Testnet First**: Always test your integration on Rootstock testnet
2. **Monitor Gas Costs**: Rootstock gas costs can vary
3. **Price Impact**: Large trades may have significant price impact
4. **MEV Protection**: Consider MEV protection for large transactions

## 🆘 Troubleshooting

### Common Issues:

1. **"Pool does not exist"**: The token pair may not have a pool for the specified fee tier
2. **"Insufficient allowance"**: Approve tokens before swapping
3. **"Excessive price impact"**: Reduce swap amount or adjust slippage
4. **"Transaction reverted"**: Check token balances and allowances

### Debug Mode:

Set `OFFCHAIN_MOCK=1` for testing without blockchain interaction.
