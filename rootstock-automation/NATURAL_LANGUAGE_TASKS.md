# 🤖 Natural Language Task Creation

This document explains how to use the natural language task creation feature that allows users to create on-chain automation tasks using plain English descriptions.

## Overview

The natural language task creation system uses OpenAI to parse user instructions and automatically generate the appropriate blockchain task parameters, then creates the task on-chain using the TaskRegistry contract on Rootstock testnet.

### Key Features

- 🤖 **AI-Powered Parsing**: Converts plain English to blockchain parameters
- 🔗 **Real On-Chain Tasks**: Creates actual tasks on Rootstock testnet
- 📊 **Confidence Scoring**: AI provides confidence levels and warnings
- 🔍 **Preview Mode**: Test parsing without creating tasks
- ⚡ **Real-Time Processing**: Immediate task creation with transaction hashes
- 📝 **Comprehensive Logging**: Stores original instructions with parsed parameters

## API Endpoints

### 1. Create Task from Natural Language

**POST** `/natural-language/create-task`

Creates an on-chain task from a natural language description.

**Request Body:**

```json
{
  "instruction": "Remove my ETH from Aave lending if the interest rate drops below 2.5%",
  "userAddress": "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82"
}
```

**Response:**

```json
{
  "success": true,
  "taskId": "5",
  "transactionHash": "0x10c6b45762cc3f657cc68b29b029f1a4bcf63dc6f5ebd43e89db5a9977422392",
  "originalInstruction": "Remove my ETH from Aave lending if the interest rate drops below 2.5%",
  "parsedTask": {
    "taskType": "price",
    "description": "Monitor Aave lending rate and withdraw ETH when rate drops below 2.5%",
    "confidence": 85,
    "warnings": ["Ensure Aave contract is properly configured"]
  },
  "taskDetails": {
    "targetContract": "0x79D45320480ED0a4C7e2885b14aBBfdE394Fb353",
    "functionSignature": "convertPositionToUSDT(address,uint256)",
    "resolverData": {
      "priceId": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
      "comparator": "lte",
      "targetPrice": "25000000",
      "targetExpo": -8
    }
  },
  "message": "Task created successfully! Monitor Aave lending rate and withdraw ETH when rate drops below 2.5%",
  "nextSteps": [
    "The task is now registered on-chain and will be monitored",
    "You can check task status using GET /tasks/:taskId",
    "Cancel the task anytime using POST /tasks/:taskId/cancel"
  ]
}
```

### 2. Parse Instruction (Preview)

**POST** `/natural-language/parse`

Parses an instruction without creating the actual task (useful for testing).

**Request Body:**

```json
{
  "instruction": "Swap 1 BTC to USDC when BTC price reaches $120,000"
}
```

**Response:**

```json
{
  "success": true,
  "originalInstruction": "Swap 1 BTC to USDC when BTC price reaches $120,000",
  "parsedTask": {
    "taskType": "price",
    "targetContract": "0xUniswap_V3_Router",
    "functionSignature": "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
    "args": [
      "0xBTC_Address",
      "0xUSDC_Address",
      "3000",
      "0x...",
      "1000000000000000000",
      "0",
      "0"
    ],
    "resolverData": {
      "priceId": "0xe62df6c8b4c85fe1b67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      "comparator": "gte",
      "targetPrice": "12000000000000",
      "targetExpo": -8
    },
    "description": "Swap 1 BTC to USDC when BTC price reaches or exceeds $120,000",
    "confidence": 90,
    "warnings": []
  },
  "preview": true,
  "message": "This is a preview. Use POST /natural-language/create-task to actually create the task."
}
```

### 3. Get Natural Language Task Details

**GET** `/natural-language/task/:taskId`

Retrieves details of a natural language task.

**Response:**

```json
{
  "success": true,
  "task": {
    "originalInstruction": "Swap 1 BTC to USDC when BTC price reaches $120,000",
    "userAddress": "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82",
    "parsedTask": {
      /* parsed task details */
    },
    "createdAt": "2025-09-27T16:20:38.358Z",
    "taskId": "123"
  }
}
```

### 4. List Natural Language Tasks

**GET** `/natural-language/tasks?userAddress=0x...`

Lists all natural language tasks, optionally filtered by user address.

**Response:**

```json
{
  "success": true,
  "tasks": [
    {
      "originalInstruction": "Swap 1 BTC to USDC when BTC price reaches $120,000",
      "userAddress": "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82",
      "taskId": "123",
      "createdAt": "2025-09-27T16:20:38.358Z"
    }
  ],
  "totalCount": 1
}
```

## Supported Instruction Types

### Price-Based Tasks

These tasks execute when certain price conditions are met:

- **"Swap X BTC to USDC when BTC price reaches $Y"**
- **"Sell all my USDC if BTC drops below $X"**
- **"Remove my ETH from Aave lending if the interest rate drops below X%"**
- **"Execute a limit order when price goes above/below $X"**

### Time-Based Tasks

These tasks execute at regular intervals:

- **"Withdraw my earnings from the liquidity pool every week"**
- **"Rebalance my portfolio every 24 hours"**
- **"Execute a DCA strategy every X seconds"**
- **"Compound my rewards daily"**

## Example Usage

### JavaScript/Node.js

```javascript
// Create a task
const response = await fetch(
  "http://localhost:3000/natural-language/create-task",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instruction: "Swap 1 BTC to USDC when BTC price reaches $120,000",
      userAddress: "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82",
    }),
  }
);

const result = await response.json();
console.log("Task created:", result.taskId);
console.log("Transaction hash:", result.transactionHash);
console.log(
  "Verify on Rootstock testnet:",
  `https://explorer.testnet.rsk.co/tx/${result.transactionHash}`
);
```

### cURL

```bash
# Create a task
curl -X POST http://localhost:3000/natural-language/create-task \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Swap 1 BTC to USDC when BTC price reaches $120,000",
    "userAddress": "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82"
  }'

# Parse instruction (preview)
curl -X POST http://localhost:3000/natural-language/parse \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Remove my ETH from Aave lending if the interest rate drops below 2.5%"
  }'
```

## Supported Protocols

The system currently supports these DeFi protocols:

- **Dummy Swap Contract**: Token swaps and automated trading (`0x79D45320480ED0a4C7e2885b14aBBfdE394Fb353`)
- **Task Registry**: On-chain automation hub (`0xD34443CeC1492B9ceD1500cC899b108f5D7C16a4`)
- **Aave**: Lending and borrowing operations (via natural language parsing)
- **Uniswap V3**: Token swaps and liquidity operations (via natural language parsing)

## Available Tokens

- **XBTC**: Bitcoin-pegged test token (`0x18A1d7F323a90DDE8e5Efc42971cF06Ad5B759b8`)
- **XUSDC**: USDC-pegged test token (`0xB39E2eeB5063881D452616dff1BcE19d79C3375D`)

## Price Feeds (Pyth Network)

- **BTC/USD**: `0xe62df6c8b4c85fe1b67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **USDC/USD**: `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a`

## Transaction Verification

### Real Blockchain Transactions

When you create a task, the system returns a **real transaction hash** from the Rootstock testnet:

```json
{
  "success": true,
  "taskId": "5",
  "transactionHash": "0x10c6b45762cc3f657cc68b29b029f1a4bcf63dc6f5ebd43e89db5a9977422392"
}
```

### Verification Methods

1. **Rootstock Explorer**:

   - Visit: `https://explorer.testnet.rsk.co/tx/{transactionHash}`
   - Example: https://explorer.testnet.rsk.co/tx/0x10c6b45762cc3f657cc68b29b029f1a4bcf63dc6f5ebd43e89db5a9977422392

2. **Task Registry Events**:

   - Contract: `0xD34443CeC1492B9ceD1500cC899b108f5D7C16a4`
   - Event: `TaskCreated(uint256 indexed taskId, address indexed creator, address indexed targetContract, uint8 resolverType, bytes resolverData)`

3. **API Verification**:
   ```bash
   curl -X GET http://localhost:3000/tasks/{taskId}
   ```

### What You Can Verify

- ✅ **Transaction Hash**: Real blockchain transaction
- ✅ **Block Number**: Confirmed on Rootstock testnet
- ✅ **Gas Used**: Actual gas consumption
- ✅ **Contract Address**: TaskRegistry contract interaction
- ✅ **Event Logs**: TaskCreated event emission
- ✅ **Task Parameters**: Encoded function calls and resolver data

## Error Handling

The API provides detailed error messages and suggestions:

```json
{
  "error": "Could not parse instruction into valid task parameters",
  "confidence": 45,
  "warnings": ["Instruction too vague", "Missing specific amounts"],
  "suggestion": "Please provide more specific instructions with clear trigger conditions"
}
```

## Best Practices

### Writing Clear Instructions

1. **Be Specific**: Include exact amounts, prices, and tokens

   - ✅ "Swap 1 BTC to USDC when BTC price reaches $120,000"
   - ❌ "Buy Bitcoin when it's cheap"

2. **Include Trigger Conditions**: Specify when the task should execute

   - ✅ "Remove my ETH from Aave if interest rate drops below 2.5%"
   - ❌ "Do something with my tokens"

3. **Specify Addresses**: Include your wallet address for task creation
   - ✅ Provide your actual wallet address
   - ❌ Use placeholder addresses

### Testing Instructions

1. Use the `/natural-language/parse` endpoint to test instructions before creating tasks
2. Check the confidence level - aim for 80%+ confidence
3. Review warnings and adjust instructions if needed

## Configuration

### Environment Variables

```bash
# Required for natural language processing
OPENAI_API_KEY=your_openai_api_key

# Optional: Specify OpenAI model (default: gpt-4o)
OPENAI_MODEL=gpt-4o

# Blockchain configuration (Rootstock Testnet)
RPC_URL=https://rpc.testnet.rootstock.io/your_endpoint
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=0xD34443CeC1492B9ceD1500cC899b108f5D7C16a4

# Token addresses
XBTC_ADDRESS=0x18A1d7F323a90DDE8e5Efc42971cF06Ad5B759b8
XUSDC_ADDRESS=0xB39E2eeB5063881D452616dff1BcE19d79C3375D
DUMMY_SWAP_ADDRESS=0x79D45320480ED0a4C7e2885b14aBBfdE394Fb353

# Pyth Network
PYTH_HERMES_URL=https://hermes.pyth.network
```

### Running in Mock Mode

For testing without blockchain interaction:

```bash
OFFCHAIN_MOCK=true
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**

   - Set the `OPENAI_API_KEY` environment variable

2. **"Low confidence in instruction parsing"**

   - Make your instruction more specific
   - Include exact amounts and conditions

3. **"Failed to parse AI response"**

   - The AI returned malformed JSON
   - Try rephrasing your instruction

4. **"Missing required parameters"**
   - Ensure you provide both `instruction` and `userAddress`

### Getting Help

- Check the `/natural-language/parse` endpoint to preview task parsing
- Review the `warnings` field in responses for guidance
- Use more specific language in your instructions

## Testing

Run the test suite:

```bash
node test-natural-language.js
```

This will test various instruction types and demonstrate the API functionality.

## Recent Updates & Improvements

### Version 2.0 - Real Transaction Hashes ✨

**What's New:**

- ✅ **Real Transaction Hashes**: All endpoints now return actual blockchain transaction hashes
- ✅ **Improved Contract Addresses**: Updated to use real deployed contracts on Rootstock testnet
- ✅ **Enhanced Error Handling**: Better JSON parsing and error messages
- ✅ **Transaction Verification**: Full blockchain verification support

**Before vs After:**

| Feature          | Before           | After                                        |
| ---------------- | ---------------- | -------------------------------------------- |
| Transaction Hash | `"0x123"` (fake) | `"0x10c6b45762cc3f..."` (real)               |
| Contract Address | Placeholder      | `0x79D45320480ED0a4C7e2885b14aBBfdE394Fb353` |
| Verification     | Not possible     | Full blockchain verification                 |
| Task Registry    | Mock             | `0xD34443CeC1492B9ceD1500cC899b108f5D7C16a4` |

**Example Real Transaction:**

- **Hash**: `0x10c6b45762cc3f657cc68b29b029f1a4bcf63dc6f5ebd43e89db5a9977422392`
- **Block**: `6869610`
- **Status**: ✅ Confirmed on Rootstock testnet
- **Explorer**: [View on Explorer](https://explorer.testnet.rsk.co/tx/0x10c6b45762cc3f657cc68b29b029f1a4bcf63dc6f5ebd43e89db5a9977422392)

### API Response Format Updates

**All task creation endpoints now return:**

```json
{
  "success": true,
  "taskId": "5",
  "transactionHash": "0x10c6b45762cc3f657cc68b29b029f1a4bcf63dc6f5ebd43e89db5a9977422392"
  // ... rest of response
}
```

**Affected Endpoints:**

- `POST /natural-language/create-task` ✅ Updated
- `POST /tasks/time` ✅ Updated
- `POST /tasks/price` ✅ Updated
