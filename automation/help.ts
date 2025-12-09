#!/usr/bin/env ts-node

/**
 * Help - Display available automation tools
 */

enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Cyan = '\x1b[36m',
  Magenta = '\x1b[35m',
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

log('\n' + '='.repeat(70), Color.Cyan);
log('FHEVM Scholarship Application - Automation Tools', Color.Cyan);
log('='.repeat(70) + '\n', Color.Cyan);

log('Available Commands:', Color.Yellow);
log('━'.repeat(70), Color.Yellow);

log('\n📦 Project Setup\n', Color.Magenta);
console.log('  npm install              Install all dependencies');
console.log('  npm run clean            Clean build artifacts');
console.log('  npm run compile          Compile smart contracts');
console.log('  npm run typechain        Generate TypeScript types');

log('\n🧪 Testing\n', Color.Magenta);
console.log('  npm run test             Run all tests');
console.log('  npm run test:sepolia     Run tests on Sepolia testnet');
console.log('  npm run coverage         Generate test coverage report');

log('\n🚀 Deployment\n', Color.Magenta);
console.log('  npm run deploy:localhost Deploy to local network');
console.log('  npm run deploy:sepolia   Deploy to Sepolia testnet');
console.log('  npm run verify:sepolia   Verify contract on Etherscan');

log('\n🔧 Development Tools\n', Color.Magenta);
console.log('  npm run lint             Run all linters');
console.log('  npm run lint:sol         Lint Solidity files');
console.log('  npm run lint:ts          Lint TypeScript files');
console.log('  npm run prettier:check   Check code formatting');
console.log('  npm run prettier:write   Format all code');

log('\n🤖 Automation Scripts\n', Color.Magenta);
console.log('  npm run create-example   Generate standalone example repository');
console.log('  npm run generate-docs    Generate GitBook documentation');
console.log('  npm run help             Show this help message');

log('\n📚 Detailed Usage\n', Color.Yellow);
log('━'.repeat(70), Color.Yellow);

log('\n1. Create Standalone Example:\n', Color.Green);
console.log('   ts-node automation/create-fhevm-example.ts scholarship-basic ./output');
console.log('   ');
console.log('   This will:');
console.log('   • Clone the base template');
console.log('   • Copy contracts and tests');
console.log('   • Generate deployment scripts');
console.log('   • Create a ready-to-use repository');

log('\n2. Generate Documentation:\n', Color.Green);
console.log('   ts-node automation/generate-docs.ts scholarship-basic');
console.log('   ts-node automation/generate-docs.ts --all');
console.log('   ');
console.log('   This will:');
console.log('   • Extract code from contracts and tests');
console.log('   • Generate GitBook-formatted markdown');
console.log('   • Create comprehensive documentation');
console.log('   • Update SUMMARY.md index');

log('\n🎯 Quick Start Guide\n', Color.Yellow);
log('━'.repeat(70), Color.Yellow);

console.log(`
  1. Install dependencies:
     ${Color.Cyan}npm install${Color.Reset}

  2. Compile contracts:
     ${Color.Cyan}npm run compile${Color.Reset}

  3. Run tests:
     ${Color.Cyan}npm run test${Color.Reset}

  4. Generate documentation:
     ${Color.Cyan}npm run generate-docs${Color.Reset}

  5. Create standalone example:
     ${Color.Cyan}npm run create-example${Color.Reset}
`);

log('📖 Resources\n', Color.Yellow);
log('━'.repeat(70), Color.Yellow);

console.log(`
  • FHEVM Documentation:    https://docs.zama.ai/fhevm
  • Zama GitHub:            https://github.com/zama-ai
  • Community Forum:        https://community.zama.ai/
  • Discord:                https://discord.com/invite/zama
  • Project Repository:     https://github.com/NoahGreenholt/ScholarshipApplication
`);

log('━'.repeat(70) + '\n', Color.Cyan);
