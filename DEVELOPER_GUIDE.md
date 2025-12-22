# Developer Guide: Maintaining and Extending FHEVM Scholarship Application

This guide helps developers understand how to maintain, extend, and update the FHEVM Scholarship Application example as dependencies evolve.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Updating Dependencies](#updating-dependencies)
3. [Adding New Examples](#adding-new-examples)
4. [Modifying Contracts](#modifying-contracts)
5. [Testing and Verification](#testing-and-verification)
6. [Documentation Generation](#documentation-generation)
7. [Deployment Process](#deployment-process)
8. [Troubleshooting](#troubleshooting)

---

## Project Structure

### Core Directories

```
ScholarshipApplication/
├── base-template/              # Base Hardhat template for scaffolding
│   ├── contracts/              # Example contracts
│   ├── test/                   # Example tests
│   ├── deploy/                 # Deployment scripts
│   ├── hardhat.config.ts       # Hardhat configuration
│   ├── package.json            # Dependencies
│   └── README.md               # Template documentation
│
├── contracts/                  # Main contract implementations
│   └── AnonymousScholarshipApplication.sol
│
├── test/                       # Test files
│   └── AnonymousScholarshipApplication.ts
│
├── deploy/                     # Deployment scripts
│   └── deploy.ts
│
├── automation/                 # CLI automation tools
│   ├── create-fhevm-example.ts     # Generates standalone repos
│   ├── generate-docs.ts            # Creates documentation
│   └── help.ts                     # Interactive help
│
├── docs/                       # Generated documentation (GitBook)
│   └── SUMMARY.md
│
├── README.md                   # Main documentation
├── package.json                # Project dependencies
└── DEVELOPER_GUIDE.md          # This file
```

### Key Configuration Files

- **hardhat.config.ts**: Network and compilation settings
- **tsconfig.json**: TypeScript compiler options
- **package.json**: Dependencies and npm scripts

---

## Updating Dependencies

### Regular Maintenance Schedule

Monitor these key dependencies for updates:

| Dependency | Purpose | Update Frequency |
|------------|---------|------------------|
| @fhevm/solidity | FHEVM library | Monthly |
| @fhevm/hardhat-plugin | Hardhat integration | Monthly |
| hardhat | Build system | Quarterly |
| ethers | Ethereum library | Quarterly |
| typescript | Language support | Quarterly |
| @nomicfoundation/* | Testing tools | Quarterly |

### Update Procedure

1. **Check for Updates**
   ```bash
   npm outdated
   ```

2. **Update Specific Package**
   ```bash
   npm update @fhevm/solidity@latest
   ```

3. **Update All Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

4. **Test After Update**
   ```bash
   npm run clean
   npm run compile
   npm run test
   npm run coverage
   ```

5. **Verify Deployment Scripts**
   ```bash
   npm run deploy:localhost
   ```

6. **Update Documentation**
   - Update version numbers in README.md
   - Note breaking changes in DEVELOPER_GUIDE.md
   - Update CHANGELOG.md if applicable

### Breaking Changes

If a dependency update introduces breaking changes:

1. **Review Change Log**
   - Check the package's release notes
   - Identify affected code

2. **Update Code**
   - Modify contract imports if needed
   - Update test patterns
   - Adjust deployment scripts

3. **Test Thoroughly**
   - Run full test suite
   - Test on Sepolia before mainnet
   - Verify gas usage hasn't changed significantly

4. **Document Changes**
   - Update inline comments
   - Update README.md version section
   - Create migration guide if needed

### Example: Updating @fhevm/solidity

```bash
# 1. Check current version
npm list @fhevm/solidity

# 2. Update to latest
npm update @fhevm/solidity

# 3. Check for API changes
# Review: https://github.com/zama-ai/fhevm/releases

# 4. Update contracts if needed (usually backward compatible)
# Examples:
# - Import statement changes
# - New FHE operations available
# - New encrypted types

# 5. Run tests
npm run test

# 6. Deploy to localhost
npm run deploy:localhost
```

---

## Adding New Examples

### Using the Automation Tool

```bash
npm run create-example <example-name> [output-dir]
```

### Example Structure

When creating a new example:

1. **Contract File** (contracts/ExampleName.sol)
   - Clear purpose statement in comments
   - Well-documented functions
   - Examples of ✅ correct and ❌ incorrect usage

2. **Test File** (test/ExampleName.ts)
   - 30+ test cases
   - Test categories:
     - Basic functionality
     - Edge cases
     - Error conditions
     - Gas optimization
     - Permission management

3. **Documentation** (docs/ExampleName.md)
   - Overview of concept
   - Code walkthrough
   - Common pitfalls
   - Best practices

### Example Creation Steps

1. **Create Contract File**
   ```bash
   cp base-template/contracts/Example.sol contracts/NewExample.sol
   # Edit NewExample.sol with your implementation
   ```

2. **Create Test File**
   ```bash
   cp base-template/test/Example.ts test/NewExample.ts
   # Edit NewExample.ts with comprehensive tests
   ```

3. **Verify Compilation**
   ```bash
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm run test -- --grep "NewExample"
   ```

5. **Generate Documentation**
   ```bash
   npm run generate-docs
   ```

6. **Update SUMMARY.md**
   - Add reference to new example
   - Add to appropriate category

---

## Modifying Contracts

### Code Style Guidelines

**Solidity Conventions:**
```solidity
// ✅ Good: Clear naming and documentation
/// @title MyContract
/// @notice Describes contract purpose
contract MyContract {
  /// @notice Describes function purpose
  /// @param input Describes input
  /// @return Describes output
  function myFunction(uint256 input) external pure returns (uint256) {
    return input * 2;
  }
}
```

### Making Changes

1. **Before Modifying**
   - Create a new branch
   - Document planned changes
   - Run baseline tests

2. **During Modification**
   - Keep functions focused
   - Add JSDoc comments
   - Avoid gas-intensive patterns

3. **After Modification**
   - Run linter: `npm run lint`
   - Run formatter: `npm run prettier:write`
   - Run tests: `npm run test`
   - Check coverage: `npm run coverage`

### Common Modifications

**Adding a New Function**
```solidity
/// @notice New function description
/// @param param1 First parameter description
/// @return Result description
function newFunction(euint32 param1) external returns (euint32) {
  // Implementation
  return FHE.add(param1, FHE.asEuint32(1));
}
```

**Updating Permissions**
```solidity
// Always set permissions after FHE operations
result.allowThis();           // Contract can access result
result.allow(msg.sender);     // Caller can access result
```

---

## Testing and Verification

### Test Coverage Requirements

- Minimum 95% code coverage
- All functions tested
- Edge cases covered
- Error conditions verified

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- --grep "AnonymousScholarshipApplication"

# Generate coverage report
npm run coverage

# Watch mode for development
npm run test -- --watch
```

### Test File Structure

```typescript
describe("ContractName", function () {
  let contract: any;

  beforeEach(async function () {
    // Setup before each test
  });

  describe("Feature Category", function () {
    it("✅ Should succeed in correct case", async function () {
      // Test correct usage
    });

    it("❌ Should fail in incorrect case", async function () {
      // Test error handling
    });
  });
});
```

### Debugging Tests

```bash
# Enable debug output
DEBUG=* npm run test

# Run single test
npm run test -- --grep "specific test name"

# Show detailed error messages
npm run test -- --reporter spec
```

---

## Documentation Generation

### Auto-Generating Docs

```bash
# Generate docs for all examples
npm run generate-docs

# Generate docs for specific example
ts-node automation/generate-docs.ts <example-name>
```

### Documentation Structure

Each example should have:

1. **Title & Overview**
   - What the example demonstrates
   - Key FHEVM concepts used

2. **Code Walkthrough**
   - Contract implementation
   - Test patterns

3. **Common Pitfalls**
   - ❌ What NOT to do
   - ✅ Correct approach

4. **Use Cases**
   - Real-world applications
   - When to use this pattern

5. **Performance Notes**
   - Gas considerations
   - Optimization tips

### GitBook Format

Documentation is generated in GitBook format:
```
docs/
├── SUMMARY.md           # Index
├── overview.md          # Introduction
├── architecture.md      # System design
├── examples/            # Individual examples
│   ├── basic.md
│   ├── advanced.md
│   └── ...
└── api/                 # API reference
```

---

## Deployment Process

### Pre-Deployment Checklist

- [ ] All tests passing: `npm run test`
- [ ] Coverage acceptable: `npm run coverage`
- [ ] Code linted: `npm run lint`
- [ ] No security issues: Manual review
- [ ] Gas usage acceptable: `npm run test` with gas reporter
- [ ] Documentation updated
- [ ] Version bumped in package.json

### Deployment Steps

**Local Deployment (Development)**
```bash
# Terminal 1: Start local node
npm run chain

# Terminal 2: Deploy
npm run deploy:localhost

# Verify deployment
npx hardhat console --network localhost
> const Example = await ethers.getContractFactory("Example")
> const contract = await Example.attach("CONTRACT_ADDRESS")
```

**Testnet Deployment (Sepolia)**
```bash
# Set environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY

# Deploy
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia -- "CONTRACT_ADDRESS" "CONSTRUCTOR_ARGS"
```

**Mainnet Deployment**
```bash
# Double-check everything before mainnet
npm run test
npm run coverage

# Deploy with caution
npm run deploy:mainnet

# Verify on Etherscan
npm run verify:mainnet -- "CONTRACT_ADDRESS" "CONSTRUCTOR_ARGS"
```

### Post-Deployment

1. **Verify Contract**
   - Check contract address on block explorer
   - Call read-only functions to verify
   - Test interaction from frontend

2. **Monitor**
   - Watch for errors in logs
   - Monitor gas usage
   - Track transaction costs

3. **Update Records**
   - Document contract addresses
   - Update deployment log
   - Notify team members

---

## Troubleshooting

### Common Issues

**1. Compilation Errors**
```bash
# Clean and recompile
npm run clean
npm run compile

# Check syntax in contracts/
npm run lint:sol
```

**2. Test Failures**
```bash
# Run tests with detailed output
npm run test -- --reporter spec

# Check if contracts compile first
npm run compile

# Verify FHEVM plugin is loaded
npm run test -- --grep "simple test"
```

**3. Deployment Failures**
```bash
# Check hardhat config
npx hardhat config

# Verify network connection
npx hardhat run scripts/verify-network.ts --network sepolia

# Check account balance
npx hardhat console --network sepolia
> const signer = await ethers.getSigners()
> const balance = await signer[0].getBalance()
```

**4. Type Errors in Tests**
```bash
# Regenerate TypeChain types
npm run typechain

# Check tsconfig.json
npm run build:ts
```

**5. Permission Issues**
```
Error: FHE permission not set
// Solution: Always call allowThis() and allow() after FHE operations
```

### Getting Help

- **Documentation**: Check [FHEVM Docs](https://docs.zama.ai/fhevm)
- **Community**: Join [Zama Community](https://community.zama.ai)
- **Discord**: Ask in [Zama Discord](https://discord.com/invite/zama)
- **GitHub Issues**: Report bugs on [GitHub](https://github.com/zama-ai)

---

## Best Practices

### Code Quality

- ✅ Write clear, self-documenting code
- ✅ Add inline comments for complex logic
- ✅ Follow Solidity style guide
- ✅ Run linter before committing
- ❌ Avoid deep nesting
- ❌ Keep functions focused and small

### Testing

- ✅ Test both success and failure paths
- ✅ Include edge cases
- ✅ Document test intent in comments
- ✅ Maintain high coverage (95%+)
- ❌ Don't skip error testing
- ❌ Avoid duplicated test logic

### Security

- ✅ Set FHE permissions correctly
- ✅ Validate inputs at boundaries
- ✅ Use role-based access control
- ✅ Review security best practices
- ❌ Don't expose encrypted values
- ❌ Don't skip permission checks

### Documentation

- ✅ Document all public functions
- ✅ Explain complex algorithms
- ✅ Include usage examples
- ✅ Keep documentation current
- ❌ Don't assume reader knowledge
- ❌ Don't leave functions undocumented

---

## Maintenance Timeline

**Monthly:**
- Check for dependency updates
- Review security advisories
- Test with latest FHEVM

**Quarterly:**
- Run full test suite
- Check test coverage
- Review and update documentation
- Plan new examples

**Annually:**
- Major version reviews
- Performance profiling
- Security audit
- Community feedback integration

---

## Contact & Support

For questions or contributions:
- **GitHub**: Open issues and pull requests
- **Discord**: Join the Zama community
- **Email**: Contact the development team
- **Forum**: Post on the Zama community forum

---

**Last Updated**: December 2025

**Built with ❤️ using FHEVM by Zama**
