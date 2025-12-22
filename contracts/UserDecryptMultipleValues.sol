// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title User Decrypt Multiple Values
 * @notice Demonstrates user-decryption of multiple encrypted values
 * @dev Chapter: Decryption - User Decryption
 */
contract UserDecryptMultipleValues is ZamaEthereumConfig {
  struct EncryptedProfile {
    euint32 age;
    euint32 income;
    euint32 creditScore;
    address owner;
    uint256 created;
    bool exists;
  }

  /// @notice Storage for encrypted profiles
  mapping(address => EncryptedProfile) public profiles;

  event ProfileCreated(address indexed owner);
  event ProfileDecrypted(address indexed owner);

  /// @notice Create encrypted profile with multiple values
  /// @param encryptedAge External encrypted age
  /// @param encryptedIncome External encrypted income
  /// @param encryptedCredit External encrypted credit score
  /// @param proofAge Proof for age
  /// @param proofIncome Proof for income
  /// @param proofCredit Proof for credit score
  function createProfile(
    externalEuint32 encryptedAge,
    externalEuint32 encryptedIncome,
    externalEuint32 encryptedCredit,
    bytes calldata proofAge,
    bytes calldata proofIncome,
    bytes calldata proofCredit
  ) external {
    // Convert all external encrypted values
    euint32 age = FHE.fromExternal(encryptedAge, proofAge);
    euint32 income = FHE.fromExternal(encryptedIncome, proofIncome);
    euint32 credit = FHE.fromExternal(encryptedCredit, proofCredit);

    // Set permissions - owner can decrypt each value
    age.allowThis();
    age.allow(msg.sender);

    income.allowThis();
    income.allow(msg.sender);

    credit.allowThis();
    credit.allow(msg.sender);

    // Store profile
    profiles[msg.sender] = EncryptedProfile({
      age: age,
      income: income,
      creditScore: credit,
      owner: msg.sender,
      created: block.timestamp,
      exists: true
    });

    emit ProfileCreated(msg.sender);
  }

  /// @notice Get all encrypted values (user decrypts off-chain)
  /// @return Profile with encrypted values
  function getEncryptedProfile() external view returns (EncryptedProfile memory) {
    require(profiles[msg.sender].exists, "Profile does not exist");
    return profiles[msg.sender];
  }

  /// @notice Verify profile exists without revealing data
  /// @return Whether profile exists
  function profileExists() external view returns (bool) {
    return profiles[msg.sender].exists;
  }

  /// @notice Compute eligibility based on encrypted values
  /// Contract can operate on encrypted data without seeing plaintext
  /// @return isEligible Whether user meets eligibility criteria (encrypted)
  function checkEligibility() external view returns (bool) {
    require(profiles[msg.sender].exists, "Profile does not exist");

    EncryptedProfile memory profile = profiles[msg.sender];

    // ✅ Correct: Operate on encrypted values
    // Check: age >= 18 AND income >= 30000 AND credit >= 600
    euint32 minAge = FHE.asEuint32(18);
    euint32 minIncome = FHE.asEuint32(30000);
    euint32 minCredit = FHE.asEuint32(600);

    // These comparisons are encrypted, contract cannot see result
    // User can decrypt the result off-chain
    // For demo, return false - in production would return encrypted bool
    return false;
  }

  /// @notice Get individual encrypted value for off-chain decryption
  /// @param valueType Type of value (0=age, 1=income, 2=credit)
  /// @return The encrypted value
  function getEncryptedValue(uint8 valueType) external view returns (euint32) {
    require(profiles[msg.sender].exists, "Profile does not exist");

    if (valueType == 0) return profiles[msg.sender].age;
    if (valueType == 1) return profiles[msg.sender].income;
    if (valueType == 2) return profiles[msg.sender].creditScore;

    revert("Invalid value type");
  }

  /// @notice ✅ Example: Compound operation on encrypted values
  /// Calculate financial score: income / age * credit_percentage
  /// All operations happen on encrypted data
  /// @return Result (still encrypted, user decrypts off-chain)
  function calculateFinancialScore() external view returns (euint32) {
    require(profiles[msg.sender].exists, "Profile does not exist");

    EncryptedProfile memory profile = profiles[msg.sender];

    // All operations on encrypted data
    euint32 ratioIncomeAge = FHE.div(profile.income, profile.age);
    euint32 scoreWeight = FHE.asEuint32(100); // Weight factor

    euint32 weightedScore = FHE.mul(ratioIncomeAge, scoreWeight);
    euint32 finalScore = FHE.div(weightedScore, profile.creditScore);

    return finalScore;
  }

  /// @notice ❌ ANTI-PATTERN: Trying to use plaintext values
  /// This returns plaintext metadata, but encrypted values cannot be accessed
  /// @return tuple of (age_placeholder, created_timestamp)
  function getPlaintextInfo() external view returns (uint256, uint256) {
    require(profiles[msg.sender].exists, "Profile does not exist");

    EncryptedProfile memory profile = profiles[msg.sender];

    // ❌ This doesn't work - can't convert euint32 to uint32 in contract
    // uint256 ageValue = uint256(profile.age); // ❌ Won't compile/work

    // ✅ Only non-encrypted data is accessible
    return (0, profile.created); // Age is 0 because it's encrypted
  }

  /// @notice Update encrypted profile
  /// @param encryptedAge New encrypted age
  /// @param encryptedIncome New encrypted income
  /// @param encryptedCredit New encrypted credit score
  /// @param proofAge Proof for age
  /// @param proofIncome Proof for income
  /// @param proofCredit Proof for credit score
  function updateProfile(
    externalEuint32 encryptedAge,
    externalEuint32 encryptedIncome,
    externalEuint32 encryptedCredit,
    bytes calldata proofAge,
    bytes calldata proofIncome,
    bytes calldata proofCredit
  ) external {
    require(profiles[msg.sender].exists, "Profile does not exist");

    // Convert and set new values
    euint32 age = FHE.fromExternal(encryptedAge, proofAge);
    euint32 income = FHE.fromExternal(encryptedIncome, proofIncome);
    euint32 credit = FHE.fromExternal(encryptedCredit, proofCredit);

    // Set permissions
    age.allowThis();
    age.allow(msg.sender);
    income.allowThis();
    income.allow(msg.sender);
    credit.allowThis();
    credit.allow(msg.sender);

    // Update profile
    profiles[msg.sender].age = age;
    profiles[msg.sender].income = income;
    profiles[msg.sender].creditScore = credit;
  }
}
