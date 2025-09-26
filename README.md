# rootstock-agent

Project Idea: Open-Source DeFi Automation Platform (Rootstock)
Goal: Build a platform where anyone can create live automation agents (bots) for DeFi actions — like auto-compounding, limit orders, or recurring investments — on Rootstock.

Key Components

1. Task Registry (Smart Contract)
   - Stores tasks: target contract, function, condition (resolver), owner, and funds.
   - Allows users to create, cancel, and execute tasks.
2. Resolver (Condition Checker)
   - Logic that decides when a task should execute.
   - Can be simple (time interval) or price-based.
   - Can live on-chain (contract) or off-chain (Web3 Function).
3. Executor / Keeper (Off-chain Bot)
   - Watches tasks, checks resolvers.
   - Calls execute on the Task Registry when conditions are met.
   - Initially centralized for hackathon; can be decentralized later.
4. Front-end UI
   - Wallet connection (MetaMask, Rootstock-compatible).
   - Create automation tasks.
   - View task status and execution logs.
5. Funding / Fees
   - Users fund tasks (native token or ERC-20) to pay gas and executor.
   - Optional paymaster or sponsor for better UX.

MVP Scope for Hackathon

- 1 automation use-case:
  - Auto-compound LP rewards, price-triggered swap, or recurring DCA.
- Minimal smart contract + one resolver type.
- Single off-chain executor bot.
- Simple React dashboard to create/view tasks.
- Live demo: user creates task → executor triggers → result visible.

Pitch / Vision
“We are building the first open DeFi automation layer on Rootstock. Users can create live agents that handle repetitive DeFi tasks automatically. This unlocks passive, programmable finance for the Bitcoin DeFi ecosystem while remaining open-source for developers to innovate on top.”

In short: It’s like Gelato, but open-source, early on Rootstock, and designed for any DeFi automation task.

If you want, I can also draw a simple diagram showing Task → Resolver → Executor → Execution — makes it super easy to explain to judges and teammates. Do you want me to do that?

## 🔄 Uniswap v3 Integration

**NEW**: Complete Uniswap v3 swap and liquidity management functionality for Rootstock!

### Features:

- ✅ **Swap Operations**: Exact input/output swaps, multi-hop routing
- ✅ **Liquidity Management**: Mint/increase/decrease positions, collect fees
- ✅ **Price Quotes**: Real-time swap quotes via QuoterV2
- ✅ **Pool Information**: Token info, balances, allowances
- ✅ **Full API**: RESTful endpoints for all operations

### Quick Start:

```bash
# Get swap quote
curl -X POST http://localhost:3000/swap/quote/exact-input \
  -d '{"tokenIn":"0x542f...","tokenOut":"0xeF21...","amountIn":"1000000000000000000","fee":3000}'

# View all contract addresses
curl http://localhost:3000/swap/addresses

# Run demo
npm run swap:demo
```

📖 **Full Documentation**: See [UNISWAP_README.md](rootstock-automation/UNISWAP_README.md)

## Backend (Express + Pyth) Overview

This repo includes an Express API and background worker that integrates with Pyth price feeds to schedule on-chain tasks via the `TaskRegistry` contract. Two resolver types are supported:

- Time-based: execute every N seconds
- Price-based: execute when a Pyth price meets a comparator (>= or <= target)

Key endpoints:

- `GET /health` – health check
- `GET /tasks` – list tasks
- `POST /tasks/time` – create time task { targetContract, functionSignature, args, intervalSeconds }
- `POST /tasks/price` – create price task { targetContract, functionSignature, args, priceId, comparator, targetPrice, targetExpo }
- `POST /tasks/:taskId/execute` – force execute a task
- `POST /tasks/:taskId/cancel` – cancel a task

Run API:

```bash
cd rootstock-automation
npm i
# set environment (env file included for testnet)
# cp .env.example .env  # if example exists, or set the vars below:
# export PORT=3000 WORKER_POLL_MS=15000 \
# RPC_URL=https://rpc.testnet.rootstock.io/<YOUR-KEY> \
# PRIVATE_KEY=0x<YOUR-KEY> \
# CONTRACT_ADDRESS=<DEPLOYED_TASK_REGISTRY> \
# PYTH_HERMES_URL=https://hermes.pyth.network
npm run dev
```

References:

- Pyth EVM guide: https://docs.pyth.network/price-feeds/use-real-time-data/evm
- Rootstock Uniswap V3 pools (example): https://oku.trade/app/rootstock/pool/0xd2ffe51ab4e622a411abbe634832a19d919e9c55?utm_source=uniswap&utm_medium=forum&utm_campaign=rootstocktemp

### API additions for frontend

- `GET /tasks/spender` → `{ spender }` address to approve allowances for
- `GET /tasks/allowance?token=<addr>&owner=<addr>[&spender=<addr>]` → allowance info
- `GET /tasks/price/:priceId` → latest Pyth price `{ price, expo }`
- `POST /tasks/strategy` → store strategy and optionally persist on-chain task. Body example:
  ```json
  {
    "wallet": "0x...",
    "persistOnChain": true,
    "router": "0x...",
    "tokenIn": "0x...",
    "tokenOut": "0x...",
    "fee": 500,
    "amountIn": "100000000000000000",
    "minOut": "90000000",
    "recipient": "0x...",
    "deadline": 2000000000,
    "owner": "0x...",
    "priceId": "0x<pyth_price_id_bytes32>",
    "comparator": "gte",
    "targetPrice": "-11109000000",
    "targetExpo": -8
  }
  ```
- `GET /tasks/strategy/:wallet` → returns stored strategies for a wallet
