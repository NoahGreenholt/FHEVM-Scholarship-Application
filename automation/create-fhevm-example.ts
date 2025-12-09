#!/usr/bin/env ts-node

/**
 * Create FHEVM Example - Standalone Repository Generator
 *
 * Generates complete, standalone FHEVM example repositories from the ScholarshipApplication template.
 *
 * Usage: ts-node automation/create-fhevm-example.ts <example-name> [output-dir]
 *
 * Example: ts-node automation/create-fhevm-example.ts scholarship-basic ./my-scholarship-example
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

interface ExampleConfig {
  contract: string;
  test: string;
  description: string;
}

const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  'scholarship-basic': {
    contract: 'contracts/AnonymousScholarshipApplication.sol',
    test: 'test/AnonymousScholarshipApplication.ts',
    description: 'Privacy-preserving scholarship application with FHE encrypted boolean operations',
  },
};

function copyDirectoryRecursive(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // Skip unnecessary directories
      if (['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist', 'automation'].includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      // Skip build files and existing deployment scripts
      if (!item.endsWith('.mp4') && !item.includes('lock')) {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function updateDeployScript(outputDir: string, contractName: string): void {
  const deployDir = path.join(outputDir, 'deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  const deployScript = `import { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const deployer = (await hre.ethers.getSigners())[0];
  const factory = await hre.ethers.getContractFactory("${contractName}");

  console.log("Deploying ${contractName}...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ ${contractName} deployed successfully to:", contractAddress);

  // Verify on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY && hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await contract.deploymentTransaction()?.wait(6);

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("Note: Contract verification skipped or failed");
    }
  }
};

func.tags = ["${contractName}"];
export default func;
`;

  fs.writeFileSync(path.join(deployDir, 'deploy.ts'), deployScript);
  info(`Created deployment script for ${contractName}`);
}

function updateReadme(outputDir: string, exampleName: string, config: ExampleConfig): void {
  const readmeContent = `# ${exampleName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} FHEVM Example

${config.description}

## Overview

This example demonstrates:
- FHE encrypted boolean operations (\`ebool\`)
- Permission management with \`FHE.allowThis()\` and \`FHE.allow()\`
- Access control patterns
- Real-world privacy-preserving application logic

## Quick Start

### Installation

\`\`\`bash
npm install
\`\`\`

### Compilation

\`\`\`bash
npm run compile
\`\`\`

### Testing

\`\`\`bash
npm run test
\`\`\`

### Deployment

**Local Network:**
\`\`\`bash
npx hardhat node
npx hardhat deploy --network localhost
\`\`\`

**Sepolia Testnet:**
\`\`\`bash
npx hardhat deploy --network sepolia
\`\`\`

## Key Concepts

### FHE Encrypted Booleans

This example uses \`ebool\` - encrypted boolean values from FHEVM:

\`\`\`solidity
// Convert plaintext boolean to encrypted
ebool encrypted = FHE.asEbool(true);

// Perform operations on encrypted data
ebool result = FHE.and(encrypted1, encrypted2);

// Set permissions for contract and users
encrypted.allowThis();           // Contract can use
encrypted.allow(userAddress);   // User can decrypt
\`\`\`

### Permission System

- \`allowThis()\`: Allows the contract to process the encrypted value
- \`allow(address)\`: Grants decryption permission to a specific address

## Testing

The test suite includes:
- ✅ Successful operations with encrypted data
- ❌ Edge cases and error conditions
- Multi-user scenarios
- Access control validation
- FHE operation verification

## Gas Considerations

FHE operations are more gas-intensive than standard operations:
- Encryption/decryption: ~50,000+ gas
- FHE logical operations: varies by operation
- Permission calls: additional gas cost

Higher gas limits recommended for FHE transactions.

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama GitHub](https://github.com/zama-ai)
- [FHEVM Examples](https://github.com/zama-ai/fhevm-solidity)

## License

BSD-3-Clause-Clear

---

**Built with FHEVM by Zama**
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
  info('Created README.md');
}

function updatePackageJson(outputDir: string, exampleName: string, config: ExampleConfig): void {
  const packagePath = path.join(outputDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  pkg.name = `fhevm-${exampleName}`;
  pkg.description = config.description;
  pkg.keywords = [
    'fhevm',
    'zama',
    'fhe',
    'ethereum',
    'privacy',
    'confidential',
    'typescript',
    'hardhat',
    ...exampleName.split('-'),
  ];

  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  info('Updated package.json');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('\n' + '='.repeat(60), Color.Cyan);
    log('FHEVM Example Generator', Color.Cyan);
    log('='.repeat(60) + '\n', Color.Cyan);

    log('Usage: ts-node automation/create-fhevm-example.ts <example-name> [output-dir]\n');

    log('Available Examples:', Color.Yellow);
    Object.entries(EXAMPLES_MAP).forEach(([name, config]) => {
      console.log(`  • ${name.padEnd(25)} - ${config.description}`);
    });

    log('\nExample:', Color.Yellow);
    log('  ts-node automation/create-fhevm-example.ts scholarship-basic ./my-scholarship\n');
    return;
  }

  const exampleName = args[0];
  const outputDir = args[1] || `./${exampleName}`;

  if (!EXAMPLES_MAP[exampleName]) {
    error(`Unknown example: ${exampleName}\nAvailable: ${Object.keys(EXAMPLES_MAP).join(', ')}`);
  }

  const config = EXAMPLES_MAP[exampleName];

  info(`Generating ${exampleName} example...`);
  info(`Output directory: ${path.resolve(outputDir)}\n`);

  try {
    const sourceDir = path.resolve('.');
    const resolvedOutputDir = path.resolve(outputDir);

    // Copy base structure
    info('Copying base template...');
    copyDirectoryRecursive(sourceDir, resolvedOutputDir);

    // Copy contract
    const contractSource = path.join(sourceDir, config.contract);
    const contractDest = path.join(resolvedOutputDir, 'contracts', path.basename(config.contract));
    fs.mkdirSync(path.dirname(contractDest), { recursive: true });
    fs.copyFileSync(contractSource, contractDest);
    info(`Copied contract: ${path.basename(config.contract)}`);

    // Copy test
    const testSource = path.join(sourceDir, config.test);
    const testDest = path.join(resolvedOutputDir, 'test', path.basename(config.test));
    fs.mkdirSync(path.dirname(testDest), { recursive: true });
    fs.copyFileSync(testSource, testDest);
    info(`Copied test: ${path.basename(config.test)}`);

    // Get contract name and update deploy script
    const contractName = getContractName(contractDest);
    if (contractName) {
      updateDeployScript(resolvedOutputDir, contractName);
    }

    // Update README and package.json
    updateReadme(resolvedOutputDir, exampleName, config);
    updatePackageJson(resolvedOutputDir, exampleName, config);

    success(`\nExample generated successfully!`);
    log('\nNext steps:', Color.Cyan);
    log(`  cd ${outputDir}`);
    log(`  npm install`);
    log(`  npm run compile`);
    log(`  npm run test\n`);
  } catch (err) {
    error(`Failed to generate example: ${(err as Error).message}`);
  }
}

main().catch(err => {
  error(String(err));
});
