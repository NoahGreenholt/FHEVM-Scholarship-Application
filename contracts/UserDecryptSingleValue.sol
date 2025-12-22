// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title User Decrypt Single Value
 * @notice Demonstrates user-decryption of a single encrypted value
 * @dev Chapter: Decryption - User Decryption
 *
 * User decryption allows the authorized user to decrypt their own encrypted values
 * through the gateway without the contract knowing the plaintext value.
 */
contract UserDecryptSingleValue is ZamaEthereumConfig {
  struct EncryptedRecord {
    euint32 secret;
    address owner;
    uint256 timestamp;
    bool exists;
  }

  /// @notice Storage for encrypted values
  mapping(uint256 => EncryptedRecord) public records;
  uint256 public recordCount;

  event SecretStored(uint256 indexed recordId, address indexed owner);
  event SecretDecrypted(uint256 indexed recordId, address indexed owner);

  /// @notice Store a secret value (encrypted)
  /// @param encryptedSecret The external encrypted secret
  /// @param inputProof The proof for the encrypted value
  function storeSecret(
    externalEuint32 encryptedSecret,
    bytes calldata inputProof
  ) external returns (uint256) {
    // Convert external encrypted value to internal
    euint32 internal_secret = FHE.fromExternal(encryptedSecret, inputProof);

    // Set permissions - only contract and owner can access
    internal_secret.allowThis();
    internal_secret.allow(msg.sender); // Owner can decrypt

    recordCount++;
    records[recordCount] = EncryptedRecord({
      secret: internal_secret,
      owner: msg.sender,
      timestamp: block.timestamp,
      exists: true
    });

    emit SecretStored(recordCount, msg.sender);
    return recordCount;
  }

  /// @notice The owner decrypts their own secret
  /// @param recordId The ID of the record to decrypt
  /// @dev In production, actual decryption happens through the gateway
  /// This contract just verifies permissions and emits events
  function decryptOwnSecret(uint256 recordId) external {
    require(records[recordId].exists, "Record does not exist");
    require(records[recordId].owner == msg.sender, "Not the owner");

    emit SecretDecrypted(recordId, msg.sender);
  }

  /// @notice ❌ ANTI-PATTERN: Attempting to decrypt in contract
  /// This is NOT how you should decrypt user data!
  /// Decryption must happen through the gateway, not in contracts
  /// @param recordId The record to attempt decryption
  function decryptInContractWrong(uint256 recordId) external view returns (uint32) {
    require(records[recordId].exists, "Record does not exist");

    // ❌ This doesn't actually decrypt - it returns an encrypted handle
    // Real decryption happens through the FHE gateway
    euint32 encrypted = records[recordId].secret;

    // This returns an encrypted value, not plaintext
    // You cannot decrypt euint32 inside a contract
    return uint32(0); // Placeholder - actual decryption is off-chain
  }

  /// @notice ✅ CORRECT: User decryption workflow
  /// Users retrieve the encrypted handle and decrypt through the gateway
  /// @param recordId The record to get
  /// @return The encrypted value handle (user decrypts off-chain)
  function getEncryptedSecret(uint256 recordId) external view returns (euint32) {
    require(records[recordId].exists, "Record does not exist");
    require(records[recordId].owner == msg.sender, "Not the owner");

    return records[recordId].secret;
  }

  /// @notice Get record metadata (does not reveal encrypted data)
  /// @param recordId The record ID
  /// @return owner The owner address
  /// @return timestamp When the record was created
  function getRecordMetadata(uint256 recordId)
    external
    view
    returns (address owner, uint256 timestamp)
  {
    require(records[recordId].exists, "Record does not exist");
    return (records[recordId].owner, records[recordId].timestamp);
  }

  /// @notice Perform operation on encrypted value (contract can do this)
  /// @param recordId The record ID
  /// @param operand Value to add to the secret
  /// @return Result of secret + operand (still encrypted)
  function addToSecret(uint256 recordId, euint32 operand) external view returns (euint32) {
    require(records[recordId].exists, "Record does not exist");
    require(records[recordId].owner == msg.sender, "Not the owner");

    return FHE.add(records[recordId].secret, operand);
  }
}
