# Aura - The Privacy-Preserving AI Marketplace

A decentralized marketplace where Requesters post AI tasks and Solvers provide model inferences with ZK proofs for verification.

## Architecture

- **Frontend**: Next.js 14+ (App Router), TailwindCSS, ShadcnUI, Wagmi, RainbowKit
- **Blockchain**: Solidity smart contracts (Foundry) for escrow and payment release
- **ZK Circuits**: Noir circuits for AI model inference proofs
- **Verification**: zkVerify (Horizen Labs) for off-chain proof aggregation
- **State Management**: TanStack Query

## Project Structure

```
aura-marketplace/
├── blockchain/           # Foundry project
│   ├── contracts/        # Marketplace.sol, zkVerifyAttestation.sol
│   ├── scripts/          # Deployment & testing scripts
├── circuits/             # Noir circuits
│   ├── model_inference/  # ZK circuit for AI logic
│   └── tests/
├── frontend/             # Next.js Application
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # ShadcnUI + Custom Web3 components
│   │   ├── hooks/        # useZkVerify, useMarketplace
│   │   ├── lib/          # Proof generation & zkVerify SDK wrappers
│   └── public/
└── model-server/         # Node.js wrapper for local AI inference
```

## Getting Started

See [SETUP.md](./SETUP.md) for detailed installation and setup instructions.

### Quick Start

```bash
# Install all dependencies
npm run install:all

# Build contracts
cd blockchain && forge build

# Build circuits
cd ../circuits/model_inference && nargo build

# Run frontend
cd ../../frontend && npm run dev
```

## Documentation

- [SETUP.md](./SETUP.md) - Detailed setup and deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design decisions

## Features

✅ **Task Creation** - Requesters can post AI tasks with escrowed rewards  
✅ **ZK Proof Generation** - Noir circuits for proving AI model inference  
✅ **zkVerify Integration** - Off-chain proof aggregation and attestation  
✅ **Smart Contract Escrow** - Secure payment release upon proof verification  
✅ **Modern UI** - Next.js 14 with TailwindCSS and ShadcnUI  
✅ **Web3 Integration** - Wagmi + RainbowKit for wallet connectivity  

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, ShadcnUI
- **Web3**: Wagmi, Viem, RainbowKit
- **Blockchain**: Solidity, Foundry
- **ZK**: Noir
- **Verification**: zkVerify (Horizen Labs)
- **State**: TanStack Query

## License

MIT

