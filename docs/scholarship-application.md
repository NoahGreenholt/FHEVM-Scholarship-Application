# Privacy-Preserving Scholarship Application

## Overview

The Anonymous Scholarship Application demonstrates how to build a privacy-preserving evaluation system using FHEVM. This example shows how to process sensitive data without revealing it on the blockchain.

## Concept

### Problem

Traditional scholarship applications expose sensitive information:
- Financial need status
- Academic credentials
- Evaluation results

This creates privacy concerns and potential discrimination risks.

### Solution

Using FHEVM, we can:
1. Accept encrypted inputs from applicants
2. Evaluate eligibility without decrypting data
3. Store results while maintaining privacy
4. Grant access only to authorized parties

## Architecture

### Data Structures

```solidity
struct Application {
    address applicant;
    ebool hasFinancialNeed;      // Encrypted boolean
    ebool meetsAcademicCriteria; // Encrypted boolean
    ebool isEligible;            // Encrypted result
    uint256 timestamp;
    bool processed;
}

struct ScholarshipProgram {
    string name;
    string description;
    uint256 maxApplications;
    uint256 currentApplications;
    bool isActive;
    address administrator;
}
```

### Key Features

- **Encrypted Booleans**: Use `ebool` for private data
- **Access Control**: Role-based permission management
- **Event Logging**: Transparent audit trail
- **Multi-Program Support**: Multiple scholarship programs

## Implementation

### Creating a Program

```solidity
function createProgram(
    string memory _name,
    string memory _description,
    uint256 _maxApplications
) external {
    programCount++;
    programs[programCount] = ScholarshipProgram({
        name: _name,
        description: _description,
        maxApplications: _maxApplications,
        currentApplications: 0,
        isActive: true,
        administrator: msg.sender
    });

    emit ProgramCreated(programCount, _name, msg.sender);
}
```

### Submitting an Application

```solidity
function submitApplication(
    uint256 _programId,
    bool _financialNeed,
    bool _academicCriteria
) external {
    require(programs[_programId].isActive, "Program not active");

    // Convert plaintext to encrypted values
    ebool encryptedFinancialNeed = FHE.asEbool(_financialNeed);
    ebool encryptedAcademicCriteria = FHE.asEbool(_academicCriteria);

    // Compute eligibility on encrypted data
    ebool isEligible = FHE.and(
        encryptedFinancialNeed,
        encryptedAcademicCriteria
    );

    // Set permissions
    encryptedFinancialNeed.allowThis();
    encryptedAcademicCriteria.allowThis();
    isEligible.allowThis();
    isEligible.allow(msg.sender);
    isEligible.allow(programs[_programId].administrator);

    // Store application
    applicationCount++;
    applications[applicationCount] = Application({
        applicant: msg.sender,
        hasFinancialNeed: encryptedFinancialNeed,
        meetsAcademicCriteria: encryptedAcademicCriteria,
        isEligible: isEligible,
        timestamp: block.timestamp,
        processed: false
    });

    emit ApplicationSubmitted(applicationCount, _programId, msg.sender);
}
```

## FHE Operations

### Boolean AND Operation

```solidity
// ✅ Correct: Compute on encrypted data
ebool result = FHE.and(encryptedA, encryptedB);

// ❌ Incorrect: Decrypt before computing
bool plainA = decrypt(encryptedA);  // Don't do this!
bool plainB = decrypt(encryptedB);
bool result = plainA && plainB;
```

### Permission Management

```solidity
// ✅ Correct: Set permissions after operations
result.allowThis();           // Contract can access
result.allow(user1);          // User1 can access
result.allow(user2);          // User2 can access

// ❌ Incorrect: Missing permissions
// Without allowThis(), contract can't use the encrypted value
// Without allow(user), users can't decrypt their data
```

## Testing Patterns

### Testing Encrypted Operations

```typescript
it("✅ Should evaluate eligibility correctly", async function () {
  // Submit application with encrypted data
  await contract.submitApplication(programId, true, true);

  // Retrieve application
  const app = await contract.getApplication(1);

  // Verify structure (can't verify encrypted values directly)
  expect(app.applicant).to.equal(applicantAddress);
  expect(app.processed).to.be.false;
  expect(app.timestamp).to.be.gt(0);
});
```

### Testing Access Control

```typescript
it("✅ Should allow administrator access", async function () {
  await contract.submitApplication(programId, true, true);

  // Administrator should be able to access
  const app = await contract.connect(admin).getApplication(1);
  expect(app.applicant).to.equal(applicantAddress);
});

it("❌ Should deny unauthorized access", async function () {
  await contract.submitApplication(programId, true, true);

  // Unauthorized user should not be able to decrypt
  await expect(
    contract.connect(unauthorized).decryptResult(1)
  ).to.be.revertedWith("Unauthorized");
});
```

## Common Pitfalls

### 1. Missing Permission Sets

```solidity
// ❌ Incorrect: Missing allowThis()
ebool result = FHE.and(a, b);
// Contract can't use 'result' later

// ✅ Correct: Set permission
ebool result = FHE.and(a, b);
result.allowThis();
```

### 2. Incorrect Access Control

```solidity
// ❌ Incorrect: No role check
function processApplication(uint256 _id) external {
    applications[_id].processed = true;
}

// ✅ Correct: Role-based access
function processApplication(uint256 _id) external onlyProgramAdmin(_id) {
    applications[_id].processed = true;
}
```

### 3. Exposing Encrypted Data

```solidity
// ❌ Incorrect: Returning encrypted value in view function
function getResult(uint256 _id) external view returns (ebool) {
    return applications[_id].isEligible;  // Don't do this!
}

// ✅ Correct: Return encrypted handle only to authorized users
function getResult(uint256 _id) external view returns (euint256) {
    require(msg.sender == applications[_id].applicant, "Unauthorized");
    return FHE.asEuint256(applications[_id].isEligible);
}
```

## Use Cases

### Real-World Applications

1. **Scholarship Programs**
   - Private financial information
   - Confidential academic records
   - Anonymous evaluation

2. **Grant Applications**
   - Business financial data
   - Proprietary information
   - Competitive selection

3. **Loan Approval**
   - Credit scores
   - Income verification
   - Risk assessment

4. **Job Applications**
   - Salary requirements
   - Background checks
   - Skills assessment

## Performance Considerations

### Gas Usage

- **Encryption**: ~50,000 gas per ebool
- **FHE.and()**: ~30,000 gas
- **Permission sets**: ~20,000 gas per allow()

### Optimization Tips

```solidity
// ✅ Better: Batch permissions
result.allowThis();
result.allow(user1);
result.allow(user2);

// ❌ Worse: Multiple transactions
result.allowThis();  // Transaction 1
result.allow(user1); // Transaction 2
result.allow(user2); // Transaction 3
```

## Security Best Practices

### 1. Input Validation

```solidity
// ✅ Always validate inputs
require(programs[_programId].isActive, "Program not active");
require(
    programs[_programId].currentApplications < programs[_programId].maxApplications,
    "Program at capacity"
);
```

### 2. Reentrancy Protection

```solidity
// ✅ Use checks-effects-interactions pattern
// Checks first
require(condition, "Error");

// Effects second
state = newState;

// Interactions last
externalCall();
```

### 3. Access Control

```solidity
// ✅ Use modifiers for access control
modifier onlyProgramAdmin(uint256 _programId) {
    require(
        programs[_programId].administrator == msg.sender,
        "Not program administrator"
    );
    _;
}
```

## Advanced Patterns

### Multi-Criteria Evaluation

```solidity
// Combine multiple encrypted conditions
ebool eligibleByFinance = FHE.and(hasFinancialNeed, meetsIncomeRequirement);
ebool eligibleByAcademic = FHE.and(meetsGPA, hasRecommendation);
ebool finalEligibility = FHE.and(eligibleByFinance, eligibleByAcademic);
```

### Conditional Access

```solidity
// Grant access based on encrypted conditions
if (applicant == msg.sender) {
    result.allow(msg.sender);
}
if (administrator == msg.sender) {
    result.allow(msg.sender);
}
```

## Deployment

### Local Deployment

```bash
# Start local node
npm run chain

# Deploy contract
npm run deploy:localhost

# Run tests
npm run test
```

### Testnet Deployment

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia -- CONTRACT_ADDRESS
```

## Summary

This example demonstrates:

✅ **Privacy**: Sensitive data remains encrypted
✅ **Functionality**: Evaluate eligibility without decryption
✅ **Access Control**: Role-based permission management
✅ **Security**: Best practices for FHE applications
✅ **Testing**: Comprehensive test coverage
✅ **Documentation**: Clear patterns and anti-patterns

## Learn More

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Access Control Guide](./access-control.md)
- [Testing Patterns](./testing-patterns.md)
- [Security Best Practices](./security.md)

---

**Built with ❤️ using FHEVM by Zama**
