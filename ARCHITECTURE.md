# Aura Marketplace - Architecture Overview

## System Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js 14 + Wagmi + RainbowKit
│   (Next.js)     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Smart Contract │  │   zkVerify     │
│  (Solidity)     │  │   Network      │
└─────────────────┘  └─────────────────┘
         │
         │ Merkle Proof
         │
         ▼
┌─────────────────┐
│  ZK Circuit     │  Noir Circuit
│  (Noir)         │
└─────────────────┘
```

## Component Details

### 1. Smart Contract Layer (`blockchain/`)

**EscrowMarketplace.sol**
- Manages task creation and escrow
- Validates zkVerify Merkle proofs
- Releases payments upon successful attestation
- Prevents double-claiming via nullifiers

**Key Functions:**
- `createTask()` - Create a new AI task with escrow
- `submitSolution()` - Submit solution with Merkle proof
- `updateZkVerifyRoot()` - Update Merkle root (oracle)
- `cancelTask()` - Cancel task and refund

### 2. ZK Circuit Layer (`circuits/`)

**model_inference/main.nr**
- 2-layer MLP neural network
- Fixed-point arithmetic (Q16.16)
- Private: model weights, biases, input
- Public: public input hash, nullifier
- Output: hash of computation result

**Circuit Flow:**
1. Accept private model weights and input
2. Perform forward pass through MLP
3. Apply ReLU and Sigmoid activations
4. Hash the output with public inputs
5. Return public output hash

### 3. Frontend Layer (`frontend/`)

**Components:**
- `TaskList` - Display available tasks
- `CreateTaskModal` - Create new tasks
- `SubmitSolutionModal` - Submit solutions with proof workflow

**Hooks:**
- `useMarketplace` - Contract interactions
- `useZkVerify` - zkVerify API integration
- `useTask` - Task data fetching

**Services:**
- `zkverify.ts` - zkVerify SDK wrapper
- `proof-generation.ts` - Proof generation utilities
- `contracts.ts` - Contract ABIs and addresses

### 4. Verification Layer (zkVerify)

**zkVerify Service:**
- Accepts ZK proofs from solvers
- Aggregates proofs off-chain
- Generates Merkle tree of attestations
- Provides Merkle proofs for on-chain verification

**API Endpoints:**
- `POST /v1/attestations` - Submit proof
- `GET /v1/attestations/:id` - Get attestation
- `GET /v1/merkle/root` - Get Merkle root
- `POST /v1/attestations/:id/verify` - Verify attestation

### 5. Model Server (Optional) (`model-server/`)

**Purpose:**
- Local AI inference before proof generation
- REST API for model execution
- Matches circuit logic for consistency

**Endpoints:**
- `POST /inference` - Run model inference
- `GET /health` - Health check

## Data Flow

### Task Creation Flow

```
Requester → Frontend → Smart Contract
                      ↓
                  Escrow Funds
                  Emit TaskCreated Event
```

### Solution Submission Flow

```
Solver → Frontend
         ↓
    Generate Proof (Noir)
         ↓
    Submit to zkVerify
         ↓
    Wait for Merkle Inclusion
         ↓
    Get Merkle Proof
         ↓
    Submit to Smart Contract
         ↓
    Contract Verifies Merkle Proof
         ↓
    Release Payment
```

## Security Considerations

1. **Nullifier System**
   - Prevents double-claiming rewards
   - Generated from task ID + solver address
   - Stored on-chain to track usage

2. **Merkle Proof Verification**
   - Contract verifies attestation exists in zkVerify tree
   - Root updated by trusted oracle/zkVerify network

3. **Output Hash Validation**
   - Contract checks output hash matches expected value
   - Ensures solver computed correct result

4. **Reentrancy Protection**
   - Uses OpenZeppelin ReentrancyGuard
   - State updates before external calls

## Fixed-Point Arithmetic

The circuit uses Q16.16 format:
- 16 bits integer part
- 16 bits fractional part
- Scale: 65536 (2^16)

**Conversion:**
- Float → Fixed: `value * 65536`
- Fixed → Float: `value / 65536`

## Future Enhancements

1. **The Graph Integration**
   - Index task events for efficient querying
   - Replace mock task list with real data

2. **Proof Generation Service**
   - Dedicated backend for proof generation
   - Handles nargo execution securely

3. **Advanced Models**
   - Support for larger neural networks
   - Different activation functions
   - Convolutional layers

4. **Task Marketplace Features**
   - Task categories and tags
   - Reputation system
   - Dispute resolution

5. **Gas Optimization**
   - Batch operations
   - Merkle tree caching
   - Optimized proof verification

## Dependencies

### Blockchain
- Foundry
- OpenZeppelin Contracts

### Circuits
- Noir (nargo)

### Frontend
- Next.js 14
- Wagmi + Viem
- RainbowKit
- TanStack Query
- TailwindCSS
- ShadcnUI

### Model Server
- Express
- TypeScript

## Network Configuration

**Supported Networks:**
- Sepolia (testnet)
- Can be extended to other EVM chains

**zkVerify:**
- Testnet API: `https://api.zkverify.io`
- Mainnet: TBD

