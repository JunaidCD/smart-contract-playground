# Hardhat Demo Project

This is a basic Hardhat project skeleton that includes everything you need to get started with Ethereum smart contract development.

## Project Structure

```
├── contracts/          # Smart contracts
│   └── Lock.sol        # Sample contract
├── scripts/            # Deployment scripts
│   └── deploy.js       # Sample deployment script
├── test/               # Test files
│   └── Lock.js         # Sample test file
├── hardhat.config.js   # Hardhat configuration
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Prerequisites

- Node.js (v16 or later)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Available Scripts

- **Compile contracts**: `npm run compile`
- **Run tests**: `npm run test`
- **Deploy contracts**: `npm run deploy`
- **Start local node**: `npm run node`
- **Clean artifacts**: `npm run clean`

## Getting Started

### 1. Compile your contracts
```bash
npm run compile
```

### 2. Run tests
```bash
npm run test
```

### 3. Start a local Hardhat node
```bash
npm run node
```

### 4. Deploy to local network
In a new terminal window:
```bash
npm run deploy
```

## Configuration

The project is configured in `hardhat.config.js` with:
- Solidity version 0.8.19
- Optimizer enabled
- Local network configuration
- Test timeout settings

## Sample Contract

The `Lock.sol` contract demonstrates:
- Time-locked withdrawals
- Owner-only functions
- Event emissions
- Basic security patterns

## Testing

Tests are written using:
- Mocha testing framework
- Chai assertion library
- Hardhat network helpers
- Ethers.js for blockchain interactions

## Adding New Contracts

1. Create your contract in the `contracts/` directory
2. Write tests in the `test/` directory
3. Create deployment scripts in the `scripts/` directory
4. Update this README with your contract details

## Network Configuration

Currently configured networks:
- **Hardhat**: Local development network
- **Localhost**: Local node at http://127.0.0.1:8545

To add more networks (like testnets or mainnet), update the `networks` section in `hardhat.config.js`.

## Environment Variables

For production deployments, create a `.env` file with:
```
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
```

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## License

MIT
