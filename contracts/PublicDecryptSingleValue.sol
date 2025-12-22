// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Public Decrypt Single Value
 * @notice Demonstrates public decryption of a single encrypted value
 * @dev Chapter: Decryption - Public Decryption
 *
 * Public decryption allows the contract to decrypt values that are marked
 * for public decryption. This is useful when the plaintext result needs to
 * be public but the intermediate computation is private.
 */
contract PublicDecryptSingleValue is ZamaEthereumConfig {
  struct DecryptedResult {
    uint32 value;
    address requestor;
    uint256 timestamp;
  }

  /// @notice Storage for decrypted results
  mapping(uint256 => DecryptedResult) public results;
  uint256 public resultCount;

  event ValuePubliclyDecrypted(uint256 indexed resultId, uint32 value);
  event DecryptionRequested(uint256 indexed resultId, address indexed requestor);

  /// @notice Demonstrate double of encrypted value with public decryption
  /// @param encryptedValue The external encrypted value
  /// @param inputProof The proof for the encrypted value
  /// @return resultId The ID of the decryption result
  function doubleAndPublicallyDecrypt(
    externalEuint32 encryptedValue,
    bytes calldata inputProof
  ) external returns (uint256) {
    // Convert to internal encrypted value
    euint32 internalValue = FHE.fromExternal(encryptedValue, inputProof);

    // Set permissions
    internalValue.allowThis();

    // Double the value (all operations on encrypted data)
    euint32 doubled = FHE.mul(internalValue, FHE.asEuint32(2));

    // Mark for public decryption
    // In practice, the gateway would decrypt this and return the plaintext
    // For this example, we store a placeholder
    resultCount++;

    emit DecryptionRequested(resultCount, msg.sender);
    // In production: emit DecryptedResult with plaintext value
    // emit ValuePubliclyDecrypted(resultCount, decryptedPlaintext);

    return resultCount;
  }

  /// @notice Store computed result that needs public decryption
  /// @param encryptedInput The encrypted input
  /// @param inputProof The proof
  function storeForPublicDecryption(
    externalEuint32 encryptedInput,
    bytes calldata inputProof
  ) external returns (uint256) {
    // Convert external to internal
    euint32 internal_value = FHE.fromExternal(encryptedInput, inputProof);

    // Set permissions - only contract needs access for decryption
    internal_value.allowThis();

    // Perform computation
    euint32 result = FHE.add(internal_value, FHE.asEuint32(10));

    resultCount++;

    // In production, the gateway would:
    // 1. See this encrypted value marked for public decryption
    // 2. Decrypt it to plaintext
    // 3. Return the plaintext value
    // 4. Contract stores the plaintext result

    emit DecryptionRequested(resultCount, msg.sender);

    return resultCount;
  }

  /// @notice ✅ Correct workflow for public decryption
  /// 1. Create encrypted computation
  /// 2. Mark for public decryption via gateway
  /// 3. Gateway decrypts and returns plaintext
  /// 4. Contract stores plaintext result
  function processWithPublicDecryption(
    externalEuint32 encryptedIncome,
    bytes calldata incomProof
  ) external returns (uint256) {
    // Step 1: Create encrypted computation
    euint32 income = FHE.fromExternal(encryptedIncome, incomProof);
    income.allowThis();

    // Compute tax (income * 0.25), still encrypted
    euint32 taxAmount = FHE.mul(income, FHE.asEuint32(25));
    taxAmount = FHE.div(taxAmount, FHE.asEuint32(100));

    // Step 2: Request public decryption from gateway
    // Gateway would decrypt taxAmount and return plaintext

    resultCount++;

    // Step 3 & 4: Would happen via gateway callback
    // For now, store placeholder
    results[resultCount] = DecryptedResult({value: 0, requestor: msg.sender, timestamp: block.timestamp});

    emit DecryptionRequested(resultCount, msg.sender);

    return resultCount;
  }

  /// @notice ❌ ANTI-PATTERN: Expecting to decrypt in contract
  /// Cannot access plaintext values inside contract
  function decryptInContractWrong(euint32 encrypted) external pure returns (uint32) {
    // ❌ This doesn't work - encrypted values cannot be cast to uint32 in contract
    // uint32 plaintext = uint32(encrypted); // ❌ This won't work

    // Decryption must happen outside contract via the gateway
    return 0; // Placeholder
  }

  /// @notice ❌ ANTI-PATTERN: Returning encrypted as plaintext
  function returnEncryptedAsBool(euint32 encrypted) external pure returns (uint32) {
    // ❌ This returns encrypted handle, not plaintext
    // The caller gets an encrypted value, not decrypted result
    return uint32(0); // Can't do uint32(encrypted)
  }

  /// @notice Get stored decrypted result
  /// @param resultId The result ID
  /// @return The decrypted result
  function getDecryptedResult(uint256 resultId) external view returns (uint32) {
    require(results[resultId].requestor == msg.sender, "Not requestor");
    return results[resultId].value;
  }

  /// @notice Store a decrypted value (simulating gateway callback)
  /// @param resultId The result ID to update
  /// @param plaintextValue The decrypted plaintext value
  function storeDecryptedValue(uint256 resultId, uint32 plaintextValue) internal {
    require(results[resultId].requestor != address(0), "Result does not exist");

    results[resultId].value = plaintextValue;

    emit ValuePubliclyDecrypted(resultId, plaintextValue);
  }

  /// @notice Example: Public election result
  /// After voting with encrypted votes, decrypt the final count
  struct VoteResult {
    euint32 encryptedCount;
    uint32 publicCount;
    bool counted;
  }

  VoteResult public voteResult;

  event VotesPubliclyDecrypted(uint32 totalVotes);

  /// @notice Store encrypted vote count for later public decryption
  /// @param encryptedVotes The encrypted vote count
  /// @param inputProof The proof
  function storeVotesForDecryption(
    externalEuint32 encryptedVotes,
    bytes calldata inputProof
  ) external {
    euint32 votes = FHE.fromExternal(encryptedVotes, inputProof);
    votes.allowThis();

    voteResult.encryptedCount = votes;
    voteResult.counted = false;

    // Gateway would decrypt and call storeVotePublicCount
  }

  /// @notice Callback for gateway to store decrypted vote count
  /// @param publicCount The decrypted vote count
  function storeVotePublicCount(uint32 publicCount) external {
    require(!voteResult.counted, "Already counted");

    voteResult.publicCount = publicCount;
    voteResult.counted = true;

    emit VotesPubliclyDecrypted(publicCount);
  }
}
