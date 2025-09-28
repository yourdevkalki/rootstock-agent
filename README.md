# AutomationX: AI-Powered DeFi Automation on Rootstock

AutomationX is an open-source automation layer for DeFi, built on Bitcoin's Rootstock network. It allows anyone to create, test, and deploy on-chain automation agents using natural language. From swaps, lending, yield compounding, to custom trading strategies—just tell AutomationX what you want, and AI bots handle the execution securely on-chain.

- **AI-driven interface** – no coding, just commands in plain English.
- **Universal DeFi automation** – supports swaps, lending, compounding, liquidation alerts, and more.
- **Rootstock-native** – Bitcoin security with EVM compatibility for DeFi actions.
- **Test before mainnet** – deploy safely on testnet in minutes.

AutomationX makes DeFi hands-free, smart, and accessible—bringing Web2-like simplicity to Web3 automation.

## 🏗 Architecture

AutomationX consists of three main components working together to provide a complete DeFi automation platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                        AutomationX Platform                    │
├─────────────────────────────────────────────────────────────────┤
│  🎨 Frontend (Next.js)                                        │
│  ├── User Interface & Dashboard                               │
│  ├── Task Creation & Management                               │
│  ├── Real-time Analytics & Monitoring                         │
│  └── Wallet Integration                                       │
├─────────────────────────────────────────────────────────────────┤
│  ⚙️ Automation Engine (Node.js)                               │
│  ├── Smart Contract Integration                               │
│  ├── Pyth Price Feeds                                         │
│  ├── Task Execution & Monitoring                             │
│  ├── Natural Language Processing                             │
│  └── REST API                               │
├─────────────────────────────────────────────────────────────────┤
│  📊 Knowledge Graph (GRC-20 Indexer)                         │
│  ├── Blockchain Event Indexing                               │
│  ├── Task Data Storage & Retrieval                           │
│  ├── IPFS Integration                                         │
│  └── GraphQL API                                              │
├─────────────────────────────────────────────────────────────────┤
│  🔗 Smart Contract Layer (Rootstock)                          │
│  ├── XBTC Token (Bitcoin Proxy)                              │
│  ├── XUSDC Token (USDC Proxy)                                │
│  ├── DummySwap (AMM Implementation)                           │
│  └── TaskRegistry (Automation Hub)                           │
├─────────────────────────────────────────────────────────────────┤
│  🌐 External Integrations                                     │
│  ├── Pyth Network (Price Feeds)                               │
│  ├── Rootstock Network (Blockchain)                           │
│  ├── OpenAI (Natural Language Processing)                     │
│  └── IPFS (Decentralized Storage)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Component Overview

#### 🎨 **rootstock-frontend** - User Interface

- **Technology**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Purpose**: Modern web interface for creating and managing DeFi automation tasks
- **Features**: Real-time dashboard, task creation wizard, analytics, wallet connection

#### ⚙️ **rootstock-automation** - Core Engine

- **Technology**: Node.js, Express, Ethers.js, Hardhat
- **Purpose**: Backend automation engine with smart contract integration
- **Features**: 30+ API endpoints, Pyth price feeds, natural language processing, task execution

#### 📊 **rootstock-knowledge-graph** - Data Layer

- **Technology**: GRC-20 Protocol, TypeScript, IPFS
- **Purpose**: Blockchain event indexing and decentralized data storage
- **Features**: Real-time indexing, GraphQL API, IPFS integration, task history

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd defi-auto-agent
```

### 2. Start the Automation Engine

The automation engine is the core backend that handles smart contract interactions and task execution.

```bash
# Navigate to automation engine
cd rootstock-automation

# Install dependencies
npm install

# Set up environment (optional - uses mock mode by default)
cp .env.example .env

# Start the development server
npm run dev
```

The automation engine will start on `http://localhost:3001` with the following features:

- ✅ Real-time price feeds from Pyth Network
- ✅ Smart contract integration with Rootstock
- ✅ Natural language task processing
- ✅ 30+ REST API endpoints

### 3. Start the Knowledge Graph Indexer

The knowledge graph indexes blockchain events and provides data storage capabilities.

```bash
# Navigate to knowledge graph
cd rootstock-knowledge-graph

# Install dependencies
npm install

# Set up environment
cp env.example .env

# Start the indexer
npm run dev
```

The indexer will:

- ✅ Monitor TaskRegistry contract events
- ✅ Index task creation and execution data
- ✅ Store data on IPFS
- ✅ Provide GraphQL API access

### 4. Start the Frontend

The frontend provides the user interface for creating and managing automation tasks.

```bash
# Navigate to frontend
cd rootstock-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000` with:

- ✅ Modern React/Next.js interface
- ✅ Task creation wizard
- ✅ Real-time dashboard
- ✅ Wallet integration

### 5. Access the Platform

Once all components are running:

1. **Frontend**: Open `http://localhost:3000` in your browser
2. **API Documentation**: Available at `http://localhost:3001/api-docs`
3. **GraphQL Playground**: Available at `http://localhost:4000/graphql`

## 🧪 Testing

### Test the Automation Engine

```bash
cd rootstock-automation

# Run API tests
npm run api:test

# Run integration tests
npm run test:integration

# Test swap functionality
npm run test:swap
```

### Test the Knowledge Graph

```bash
cd rootstock-knowledge-graph

# Test queries
npm run test-queries

# View indexed data
npm run view-data
```

### Test the Frontend

```bash
cd rootstock-frontend

# Run linting
npm run lint

# Build for production
npm run build
```

## 🔧 Development Commands

### Automation Engine Commands

```bash
# Start development server
npm run dev

# Run automation bot
npm run bot

# Deploy contracts to testnet
npm run hh:deploy:testnet

# Deploy tokens to testnet
npm run hh:deploy:tokens:testnet

# Test swap functionality
npm run swap:demo
```

### Knowledge Graph Commands

```bash
# Start indexer
npm run dev

# Build TypeScript
npm run build

# Backfill historical data
npm run backfill

# Test IPFS integration
npm run test-ipfs
```

### Frontend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 📡 API Endpoints

### Automation Engine API (Port 3001)

#### 💰 Price Data

```http
GET  /prices/feeds            # Get supported price feeds
GET  /prices/btc              # Get current BTC price
GET  /prices/usdc             # Get current USDC price
GET  /prices/tokens           # Get all token prices
```

#### 🔄 Swap Operations

```http
POST /swap/quote/exact-input     # Get swap quote
POST /swap/execute/exact-input   # Execute swap
POST /swap-pyth/quote/real-time        # Real-time price comparison
POST /swap-pyth/execute/with-analysis  # Swap with analytics
```

#### 🤖 Automation System

```http
POST /automation/limit-order    # Create limit order
POST /automation/dca           # Create DCA strategy
POST /automation/stop-loss     # Create stop-loss order
GET  /automation/orders        # List all orders
```

#### 🧠 Natural Language Processing

```http
POST /natural-language/create-task    # Create task from natural language
POST /natural-language/parse          # Parse instruction (preview only)
GET  /natural-language/tasks          # List all natural language tasks
```

### Knowledge Graph API (Port 4000)

#### GraphQL Queries

```graphql
# Get all tasks
query GetAllTasks {
  tasks {
    id
    description
    status
    createdAt
  }
}

# Get task by ID
query GetTask($id: ID!) {
  task(id: $id) {
    id
    description
    status
    executions {
      id
      timestamp
      result
    }
  }
}
```

## 🎯 Example Usage

### Create a Natural Language Task

```bash
curl -X POST http://localhost:3001/natural-language/create-task \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Buy 0.1 BTC when the price drops below $40,000",
    "userAddress": "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82"
  }'
```

### Execute a Swap

```bash
curl -X POST http://localhost:3001/swap/execute/exact-input \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "XBTC",
    "tokenOut": "XUSDC",
    "amountIn": "1000000000000000000",
    "recipient": "0x742d35Cc6634C0532925a3b8D7389C4f8b6b0e82"
  }'
```

## 🚀 Deployment

### Deploy Smart Contracts

```bash
cd rootstock-automation

# Deploy to Rootstock testnet
npm run hh:deploy:testnet

# Deploy tokens
npm run hh:deploy:tokens:testnet
```

### Deploy Frontend

```bash
cd rootstock-frontend

# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run start
```

### Deploy Knowledge Graph

```bash
cd rootstock-knowledge-graph

# Build TypeScript
npm run build

# Start production indexer
npm start
```

## 🔗 Key Integrations

- **Pyth Network**: Real-time price feeds for BTC/USD and USDC/USD
- **Rootstock Network**: Bitcoin-secured EVM-compatible blockchain
- **OpenAI**: Natural language processing for task creation
- **IPFS**: Decentralized storage for task data
- **GRC-20 Protocol**: Blockchain event indexing

---

**Built for Rootstock Hackathon** 🏆  
_A complete DeFi automation platform with AI-powered natural language interface_
