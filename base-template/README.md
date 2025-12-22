# FHEVM Base Template

A Hardhat-based template for developing Fully Homomorphic Encryption (FHE) enabled Solidity smart contracts using FHEVM by Zama.

## Overview

This is the base template used to scaffold new FHEVM example projects. It includes:

- **Complete Hardhat Setup**: TypeScript configuration with all necessary plugins
- **FHEVM Integration**: Pre-configured @fhevm/solidity and hardhat plugin
- **Testing Framework**: Mocha + Chai for comprehensive test suites
- **Deployment Tools**: hardhat-deploy for multi-network deployments
- **Development Tools**: TypeChain, Prettier, ESLint, Solhint
- **Multi-Network Support**: Local, Sepolia testnet, and mainnet configurations

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### Installation

```bash
npm install
```

### Compilation

```bash
npm run compile
```

### Testing

```bash
npm run test
```

### Deployment

**Local Network:**
```bash
npm run deploy:localhost
```

**Sepolia Testnet:**
```bash
npm run deploy:sepolia
```

## Project Structure

```
├── contracts/
│   └── Example.sol          # Your Solidity contracts
├── test/
│   └── Example.ts           # Test files
├── deploy/
│   └── deploy.ts            # Deployment scripts
├── hardhat.config.ts        # Hardhat configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Configuration

### Environment Variables

Set up your environment variables using Hardhat vars:

```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

### Network Configuration

Networks are configured in `hardhat.config.ts`:
- **hardhat**: Local hardhat network
- **anvil**: Local Anvil node
- **sepolia**: Ethereum Sepolia testnet
- **localhost**: Local node running on port 8545

## Available Scripts

- `npm run compile` - Compile contracts
- `npm run test` - Run tests
- `npm run coverage` - Generate coverage report
- `npm run lint` - Lint code
- `npm run prettier:write` - Format code
- `npm run deploy:localhost` - Deploy to localhost
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run verify:sepolia` - Verify contracts on Etherscan

## FHEVM Features

This template is configured to support:

- **Encrypted Data Types**: euint8, euint16, euint32, euint64, euint128, euint256, ebool
- **FHE Operations**: add, sub, mul, div, rem, lt, le, gt, ge, eq, ne, and, or, xor
- **Encrypted Comparisons**: Perform comparisons on encrypted data
- **Access Control**: FHE.allow() and FHE.allowThis() for permission management
- **Encrypted Conditionals**: if/else logic on encrypted data

## Learning Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Community](https://community.zama.ai)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)

## Support

For help and support:
- Check the [FHEVM documentation](https://docs.zama.ai/fhevm)
- Join the [Zama Community](https://community.zama.ai)
- Open issues on [GitHub](https://github.com/zama-ai)

## License

BSD-3-Clause-Clear License

---

**Built with ❤️ using FHEVM by Zama**
