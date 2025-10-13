# Smart Contract Playground

A comprehensive Ethereum smart contract development playground built with Hardhat, featuring various DeFi and utility contracts for learning and experimentation.

## 🚀 Overview

This project serves as a learning environment and testing ground for Solidity smart contracts. It includes implementations of common DeFi patterns, token contracts, and utility contracts with comprehensive testing and deployment scripts.

## 📋 Features

### Smart Contracts

- **🚰 Faucet Contract**: Token distribution system with cooldown periods and claim limits
- **💾 SimpleStorage**: Basic storage contract with owner-only access and custom error handling
- **🏦 Treasury**: Financial management contract for handling funds
- **🔐 AllowanceVault**: Advanced vault system with allowance management
- **👑 Owned**: Ownership management utility contract
- **🪙 TestToken & XToken**: ERC20 token implementations for testing

### Development Tools

- **Hardhat Framework**: Complete development environment
- **OpenZeppelin Integration**: Secure, audited contract libraries
- **Comprehensive Testing**: Full test coverage for all contracts
- **Deployment Scripts**: Automated deployment for all contracts
- **Local Network Support**: Easy local blockchain testing

## 🛠️ Technology Stack

- **Solidity**: ^0.8.20
- **Hardhat**: ^2.26.3
- **OpenZeppelin Contracts**: ^5.4.0
- **Chai**: Testing framework
- **Node.js**: Runtime environment

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🚀 Quick Start

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Start Local Network
```bash
npm run node
```

### Deploy Contracts
```bash
# Deploy all contracts
npm run deploy

# Or deploy specific contracts
npx hardhat run scripts/deploy-faucet.js --network localhost
```

## 📁 Project Structure

```
├── contracts/           # Solidity smart contracts
│   ├── Faucet.sol      # Token faucet with cooldown
│   ├── SimpleStorage.sol # Basic storage contract
│   ├── Treasury.sol     # Financial management
│   ├── AllowanceVault.sol # Vault with allowances
│   ├── Owned.sol       # Ownership utilities
│   ├── TestToken.sol   # ERC20 test token
│   └── XToken.sol      # Additional token contract
├── scripts/            # Deployment and utility scripts
│   ├── deploy-all.js   # Deploy all contracts
│   ├── deploy-faucet.js # Deploy faucet contract
│   ├── fund-faucet.js  # Fund faucet with tokens
│   └── *.test.js       # Contract interaction scripts
├── test/              # Test files
├── artifacts/         # Compiled contracts
└── cache/            # Hardhat cache
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile all smart contracts |
| `npm run test` | Run the test suite |
| `npm run deploy` | Deploy contracts to network |
| `npm run node` | Start local Hardhat network |
| `npm run clean` | Clean artifacts and cache |

## 🌐 Network Configuration

The project is configured for:
- **Local Development**: Hardhat Network (Chain ID: 31337)
- **Localhost**: http://127.0.0.1:8545
- **Testnet Ready**: Easily configurable for Sepolia and other testnets

## 🧪 Contract Details

### Faucet Contract
- **Purpose**: Distribute tokens with rate limiting
- **Features**: 
  - Configurable claim amounts
  - Cooldown periods (24h default)
  - Reentrancy protection
  - Owner controls

### SimpleStorage Contract
- **Purpose**: Demonstrate basic storage patterns
- **Features**:
  - Owner-only write access
  - Custom error handling
  - Event emission
  - Gas-optimized design

### Treasury Contract
- **Purpose**: Manage project funds and payments
- **Features**:
  - Multi-token support
  - Access controls
  - Withdrawal mechanisms

## 🔒 Security Features

- **OpenZeppelin Integration**: Battle-tested security patterns
- **Reentrancy Guards**: Protection against reentrancy attacks
- **Access Controls**: Owner and role-based permissions
- **Custom Errors**: Gas-efficient error handling
- **Comprehensive Testing**: Full test coverage

## 🧪 Testing

Run the complete test suite:
```bash
npm run test
```

Tests cover:
- Contract deployment
- Function calls and state changes
- Access control mechanisms
- Error conditions
- Event emissions

## 🚀 Deployment

### Local Deployment
```bash
# Start local network
npm run node

# Deploy to local network
npm run deploy
```

### Testnet Deployment
1. Configure network in `hardhat.config.js`
2. Add private key and RPC URL to `.env`
3. Deploy: `npx hardhat run scripts/deploy-all.js --network <network-name>`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Ethereum Development](https://ethereum.org/developers)

## ⚠️ Disclaimer

This project is for educational and testing purposes. Do not use in production without proper auditing and security reviews.
