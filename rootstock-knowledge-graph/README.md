# GRC-20 Task Indexer

A simple indexer that monitors TaskRegistry contract events on Rootstock and publishes them to the GRC-20 knowledge graph.

## Features

- 🎯 **Real-time Event Monitoring**: Listens for TaskCreated events from your TaskRegistry contract
- 📊 **GRC-20 Integration**: Publishes task data to the Graph Protocol's knowledge graph
- 🔄 **Backfill Support**: Process historical events with customizable block ranges
- 🛡️ **Error Handling**: Graceful fallback when IPFS services are unavailable
- 📝 **Structured Data**: Converts blockchain events into structured knowledge graph entities

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

3. **Run the indexer**:

   ```bash
   # Live monitoring mode
   npm run dev

   # Backfill historical events
   npm run backfill
   ```

## Configuration

Update `.env` with your values:

```env
# Rootstock RPC URL
ROOTSTOCK_RPC_URL=https://rpc.testnet.rootstock.io/YOUR_KEY

# TaskRegistry Contract Address
TASK_REGISTRY_ADDRESS=0xYourContractAddress

# Private Key for GRC-20 Publisher
PRIVATE_KEY=0xYourPrivateKey
```

## Usage

### Live Indexing

Monitors for new TaskCreated events in real-time:

```bash
npm run dev
```

### Backfill Mode

Process historical events:

```bash
# Last 1000 blocks
npm run backfill

# Custom block range
npm run backfill -- --from-block=6868000 --to-block=6870000
```

## What It Does

1. **Monitors** TaskRegistry contract for TaskCreated events
2. **Extracts** task data (ID, creator, target contract, resolver type, etc.)
3. **Creates** structured entities in the GRC-20 knowledge graph
4. **Publishes** to IPFS with blockchain anchoring
5. **Logs** all operations with detailed status information

## Output Example

```
📥 New TaskCreated event detected!
📊 Event details: {
  blockNumber: 6869602n,
  taskId: '0x0000000000000000000000000000000000000000000000000000000000000004',
  creator: '0xa9a01d19b29f16811a9d5e160ad415a7c1e8a917',
  targetContract: '0x79d45320480ed0a4c7e2885b14abbfde394fb353'
}
✅ Successfully published to IPFS!
🔗 IPFS CID: ipfs://bafkreihdp44l57d4a2lbor6wlqck4xidslvng7xlcudes3xx34wrbiozri
```

## Troubleshooting

- **IPFS Upload Errors**: The indexer includes fallback mechanisms for when IPFS services are unavailable
- **RPC Connection Issues**: Check your Rootstock RPC URL and network connectivity
- **Contract Address**: Ensure your TaskRegistry contract address is correct and deployed

## Scripts

- `npm run dev` - Start live indexing
- `npm run backfill` - Process historical events
- `npm run build` - Build TypeScript
- `npm run type-check` - Check types without building
