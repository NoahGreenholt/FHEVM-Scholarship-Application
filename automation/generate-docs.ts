#!/usr/bin/env ts-node

/**
 * Generate Documentation - GitBook Documentation Generator
 *
 * Generates GitBook-formatted documentation from contract and test files.
 *
 * Usage:
 *   ts-node automation/generate-docs.ts <example-name>
 *   ts-node automation/generate-docs.ts --all
 *
 * Example: ts-node automation/generate-docs.ts scholarship-basic
 */

import * as fs from 'fs';
import * as path from 'path';

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

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

interface ExampleDoc {
  name: string;
  title: string;
  description: string;
  contract: string;
  test: string;
  category: string;
}

const EXAMPLES_DOCS: Record<string, ExampleDoc> = {
  'scholarship-basic': {
    name: 'scholarship-basic',
    title: 'Anonymous Scholarship Application',
    description: 'Privacy-preserving scholarship application using FHE encrypted boolean operations for eligibility checking',
    contract: 'contracts/AnonymousScholarshipApplication.sol',
    test: 'test/AnonymousScholarshipApplication.ts',
    category: 'Real-World Applications',
  },
};

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function extractCodeBlock(content: string, startLine: number = 0, endLine?: number): string {
  const lines = content.split('\n');
  const selectedLines = endLine
    ? lines.slice(startLine, endLine)
    : lines.slice(startLine);
  return selectedLines.join('\n');
}

function generateExampleDoc(exampleName: string, docConfig: ExampleDoc): string {
  const contractPath = path.resolve(docConfig.contract);
  const testPath = path.resolve(docConfig.test);

  const contractCode = readFile(contractPath);
  const testCode = readFile(testPath);

  return `# ${docConfig.title}

## Overview

${docConfig.description}

## What You'll Learn

- **FHE Encrypted Booleans**: Working with \`ebool\` type for private data
- **Boolean Operations**: Using \`FHE.and()\` on encrypted values
- **Permission Management**: Setting proper access controls with \`allowThis()\` and \`allow()\`
- **Access Control**: Implementing role-based permissions
- **Real-World Patterns**: Building practical privacy-preserving applications

## Key Concepts

### Encrypted Boolean Operations

The contract uses \`ebool\` - encrypted boolean values that can be processed without decryption:

\`\`\`solidity
// Convert plaintext to encrypted
ebool encrypted = FHE.asEbool(true);

// Perform logical operations on encrypted data
ebool result = FHE.and(condition1, condition2);
\`\`\`

### Permission System

FHEVM requires explicit permissions for encrypted data access:

\`\`\`solidity
// Allow contract to process the value
encryptedValue.allowThis();

// Allow specific address to decrypt
encryptedValue.allow(userAddress);
\`\`\`

## Smart Contract

{% tabs %}
{% tab title="AnonymousScholarshipApplication.sol" %}

\`\`\`solidity
${contractCode}
\`\`\`

{% endtab %}
{% endtabs %}

### Contract Highlights

#### 1. Encrypted Application Data

\`\`\`solidity
struct Application {
    address applicant;
    ebool hasFinancialNeed;      // FHE encrypted boolean
    ebool meetsAcademicCriteria; // FHE encrypted boolean
    ebool isEligible;            // FHE encrypted boolean
    uint256 timestamp;
    bool processed;
}
\`\`\`

Each application stores eligibility criteria as encrypted booleans, ensuring applicant privacy.

#### 2. FHE Boolean Logic

\`\`\`solidity
// Calculate eligibility: both conditions must be true
ebool isEligible = FHE.and(encryptedFinancialNeed, encryptedAcademicCriteria);
\`\`\`

The contract performs logical AND operation on encrypted data without ever seeing the plaintext values.

#### 3. Access Control & Permissions

\`\`\`solidity
// Set permissions for FHE data
encryptedFinancialNeed.allowThis();
encryptedAcademicCriteria.allowThis();
isEligible.allowThis();

// Allow program administrator to view eligibility
isEligible.allow(programs[_programId].administrator);
\`\`\`

Proper permission management ensures only authorized parties can access encrypted results.

## Comprehensive Tests

{% tabs %}
{% tab title="AnonymousScholarshipApplication.ts" %}

\`\`\`typescript
${testCode}
\`\`\`

{% endtab %}
{% endtabs %}

### Test Highlights

#### Success Cases ✅

- **Program Creation**: Administrators can create scholarship programs
- **Application Submission**: Applicants submit encrypted eligibility data
- **FHE Operations**: All boolean combinations (true/true, true/false, false/true, false/false)
- **Multi-User Scenarios**: Multiple applicants and programs
- **Access Control**: Proper permission verification

#### Failure Cases ❌

- **Invalid Program ID**: Rejects non-existent programs
- **Inactive Programs**: Prevents applications to inactive programs
- **Full Programs**: Blocks applications when capacity reached
- **Unauthorized Access**: Protects data from unauthorized users
- **Duplicate Processing**: Prevents re-processing applications

## Running the Example

### Installation

\`\`\`bash
npm install
\`\`\`

### Compilation

\`\`\`bash
npm run compile
\`\`\`

### Run Tests

\`\`\`bash
npm run test
\`\`\`

Expected output:
\`\`\`
AnonymousScholarshipApplication
  Program Management
    ✓ should create a new scholarship program
    ✓ should increment program count after creation
    ✓ should allow program admin to toggle program status
    ...
  Application Submission
    ✓ should submit application with both criteria met
    ✓ should submit application with various combinations
    ...
  FHE Encrypted Operations
    ✓ FHE.and(true, true) should result in eligible application
    ...
\`\`\`

## Common Patterns & Anti-Patterns

### ✅ DO: Always Set Permissions

\`\`\`solidity
ebool encrypted = FHE.asEbool(value);
encrypted.allowThis();           // Contract can use
encrypted.allow(userAddress);   // User can decrypt
\`\`\`

### ❌ DON'T: Forget allowThis()

\`\`\`solidity
ebool encrypted = FHE.asEbool(value);
encrypted.allow(userAddress);   // Missing allowThis() - will fail!
\`\`\`

### ✅ DO: Use Adequate Gas Limits

\`\`\`typescript
await contract.submitApplication(1, true, true, { gasLimit: 3000000 });
\`\`\`

### ❌ DON'T: Use Low Gas Limits

\`\`\`typescript
await contract.submitApplication(1, true, true, { gasLimit: 21000 }); // Will fail!
\`\`\`

## Gas Considerations

FHE operations require higher gas than standard operations:

| Operation | Approximate Gas |
|-----------|----------------|
| \`FHE.asEbool()\` | ~50,000 gas |
| \`FHE.and()\` | ~70,000 gas |
| \`allowThis()\` | ~20,000 gas |
| \`allow(address)\` | ~25,000 gas |

**Recommendation**: Always set \`gasLimit: 3000000\` or higher for FHE transactions.

## Real-World Applications

This pattern can be adapted for:

- **Financial Aid Programs**: Private income verification
- **Grant Applications**: Confidential eligibility screening
- **Hiring Processes**: Anonymous candidate evaluation
- **Voting Systems**: Private ballot casting
- **Compliance Checks**: Confidential requirement verification

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Solidity Library](https://github.com/zama-ai/fhevm-solidity)
- [Zama Community](https://community.zama.ai/)

---

**Category**: ${docConfig.category}
**Difficulty**: Intermediate
**Prerequisites**: Basic Solidity, understanding of boolean logic
`;
}

function generateSummary(generatedDocs: string[]): void {
  const summaryPath = path.join('docs', 'SUMMARY.md');

  let summary = `# Summary

## Introduction

* [Welcome](README.md)
* [Quick Start](QUICK_START.md)
* [FHEVM Concepts](FHEVM_CONCEPTS.md)

## Real-World Applications

`;

  generatedDocs.forEach(docName => {
    const config = EXAMPLES_DOCS[docName];
    summary += `* [${config.title}](${docName}.md)\n`;
  });

  summary += `
## Additional Resources

* [FHEVM Documentation](https://docs.zama.ai/fhevm)
* [Zama GitHub](https://github.com/zama-ai)
`;

  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs');
  }

  fs.writeFileSync(summaryPath, summary);
  info('Updated SUMMARY.md');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('\n' + '='.repeat(60), Color.Cyan);
    log('FHEVM Documentation Generator', Color.Cyan);
    log('='.repeat(60) + '\n', Color.Cyan);

    log('Usage:', Color.Yellow);
    log('  ts-node automation/generate-docs.ts <example-name>');
    log('  ts-node automation/generate-docs.ts --all\n');

    log('Available Examples:', Color.Yellow);
    Object.entries(EXAMPLES_DOCS).forEach(([name, config]) => {
      console.log(`  • ${name.padEnd(25)} - ${config.title}`);
    });

    log('\nExample:', Color.Yellow);
    log('  ts-node automation/generate-docs.ts scholarship-basic\n');
    return;
  }

  const docsDir = path.join('.', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  const generatedDocs: string[] = [];

  if (args[0] === '--all') {
    info('Generating documentation for all examples...\n');

    for (const [exampleName, config] of Object.entries(EXAMPLES_DOCS)) {
      info(`Generating: ${config.title}`);
      const docContent = generateExampleDoc(exampleName, config);
      const docPath = path.join(docsDir, `${exampleName}.md`);
      fs.writeFileSync(docPath, docContent);
      generatedDocs.push(exampleName);
      success(`Created: docs/${exampleName}.md`);
    }
  } else {
    const exampleName = args[0];

    if (!EXAMPLES_DOCS[exampleName]) {
      error(`Unknown example: ${exampleName}\nAvailable: ${Object.keys(EXAMPLES_DOCS).join(', ')}`);
    }

    const config = EXAMPLES_DOCS[exampleName];
    info(`Generating documentation for: ${config.title}\n`);

    const docContent = generateExampleDoc(exampleName, config);
    const docPath = path.join(docsDir, `${exampleName}.md`);
    fs.writeFileSync(docPath, docContent);
    generatedDocs.push(exampleName);
    success(`Created: docs/${exampleName}.md`);
  }

  // Generate SUMMARY.md
  generateSummary(generatedDocs);

  log('\n' + '='.repeat(60), Color.Green);
  success('Documentation generation complete!');
  log('='.repeat(60), Color.Green);
  log(`\nDocumentation location: ${path.resolve(docsDir)}`);
  log('\nTo view with GitBook:');
  log('  npm install -g gitbook-cli');
  log('  cd docs');
  log('  gitbook serve\n');
}

main().catch(err => {
  error(String(err));
});
