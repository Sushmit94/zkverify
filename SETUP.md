# Aura Marketplace - Setup Guide

This guide will help you set up and run the Aura Marketplace project.

## Prerequisites

- **Node.js** 18+ and npm
- **Foundry** (for smart contracts)
- **Noir** (nargo) for ZK circuits
- **Git**

## Installation

### 1. Clone and Install Dependencies

```bash
cd aura-marketplace
npm run install:all
```

Or install manually:

```bash
# Root
npm install

# Blockchain
cd blockchain
forge install OpenZeppelin/openzeppelin-contracts
npm install

# Frontend
cd ../frontend
npm install

# Model Server (optional)
cd ../model-server
npm install
```

### 2. Set Up Environment Variables

#### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Web3 Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract Addresses (set after deployment)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=

# zkVerify Configuration
NEXT_PUBLIC_ZKVERIFY_API_URL=https://api.zkverify.io
NEXT_PUBLIC_ZKVERIFY_API_KEY=

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Proof Generation API (optional, for local proof generation)
NEXT_PUBLIC_PROOF_API_URL=http://localhost:3002/prove
```

#### Blockchain

```bash
cd blockchain
```

Create `.env`:

```env
PRIVATE_KEY=your_private_key
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

## Building

### 1. Build Smart Contracts

```bash
cd blockchain
forge build
```

### 2. Build ZK Circuits

```bash
cd circuits/model_inference
nargo build
```

### 3. Build Frontend

```bash
cd frontend
npm run build
```

## Deployment

### 1. Deploy Smart Contracts

```bash
cd blockchain
forge script scripts/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --verify
```

After deployment, update `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS` in frontend `.env.local`.

### 2. Update zkVerify Merkle Root

Once deployed, you'll need to set up an oracle or manual process to update the zkVerify Merkle root in the contract:

```solidity
marketplace.updateZkVerifyRoot(newMerkleRoot);
```

## Running

### Development Mode

#### Frontend
```bash
cd frontend
npm run dev
```
Visit http://localhost:3000

#### Model Server (optional)
```bash
cd model-server
npm run dev
```
Runs on http://localhost:3001

### Production

```bash
# Frontend
cd frontend
npm run build
npm start

# Model Server
cd model-server
npm run build
npm start
```

## Testing

### Smart Contracts

```bash
cd blockchain
forge test
```

### ZK Circuits

```bash
cd circuits/model_inference
nargo prove
nargo verify
```

## Project Structure

```
aura-marketplace/
├── blockchain/          # Foundry project
│   ├── contracts/       # Solidity contracts
│   ├── scripts/         # Deployment scripts
│   └── test/            # Contract tests
├── circuits/            # Noir ZK circuits
│   └── model_inference/ # ML inference circuit
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities & services
└── model-server/        # AI inference API (optional)
```

## Usage Flow

1. **Requester creates a task:**
   - Provides dataset URI, expected output hash, and reward
   - Funds are escrowed in the contract

2. **Solver submits solution:**
   - Runs AI model inference locally
   - Generates ZK proof using Noir circuit
   - Submits proof to zkVerify network
   - Waits for attestation to be included in Merkle tree
   - Submits Merkle proof to smart contract
   - Payment is automatically released

## Troubleshooting

### Common Issues

1. **"Contract not found"**
   - Ensure contract is deployed and address is set in `.env.local`

2. **"Proof generation failed"**
   - Ensure nargo is installed and circuit is built
   - Check that proof generation API is running (if using)

3. **"zkVerify API error"**
   - Verify API URL and key in `.env.local`
   - Check network connectivity

4. **"Transaction failed"**
   - Ensure wallet is connected and has sufficient funds
   - Check that you're on the correct network (Sepolia)

## Next Steps

- Set up The Graph subgraph for indexing task events
- Implement proper proof generation backend service
- Add more sophisticated AI models
- Enhance UI/UX with better error handling and loading states
- Add task filtering and search functionality

## License

MIT

