// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Encrypt Single Value
 * @notice Demonstrates encryption of a single value
 * @dev Chapter: Encryption
 */
contract EncryptSingleValue is ZamaEthereumConfig {
  /// @notice Store for encrypted values
  mapping(address => euint32) public encryptedValues;

  event ValueEncrypted(address indexed user);
  event ValueStored(address indexed user);

  /// @notice Encrypt and store a single external encrypted value
  /// @param encryptedInput The external encrypted value
  /// @param inputProof The input proof for the encrypted value
  function encryptAndStore(
    externalEuint32 encryptedInput,
    bytes calldata inputProof
  ) external {
    // Convert external encrypted value to internal encrypted value
    euint32 internalEncrypted = FHE.fromExternal(encryptedInput, inputProof);

    // Set permissions for the contract to use this value
    internalEncrypted.allowThis();

    // Allow the caller to access the encrypted value
    internalEncrypted.allow(msg.sender);

    // Store the encrypted value
    encryptedValues[msg.sender] = internalEncrypted;

    emit ValueEncrypted(msg.sender);
    emit ValueStored(msg.sender);
  }

  /// @notice Encrypt a plaintext value
  /// @param plainValue The plaintext value to encrypt
  function encryptPlainValue(uint32 plainValue) external {
    // Encrypt the plaintext value
    euint32 encrypted = FHE.asEuint32(plainValue);

    // Set permissions
    encrypted.allowThis();
    encrypted.allow(msg.sender);

    // Store the encrypted value
    encryptedValues[msg.sender] = encrypted;

    emit ValueEncrypted(msg.sender);
    emit ValueStored(msg.sender);
  }

  /// @notice Retrieve stored encrypted value
  /// @return The encrypted value (as a handle)
  function getEncryptedValue() external view returns (euint32) {
    return encryptedValues[msg.sender];
  }

  /// @notice Perform operation on encrypted value
  /// @param modifier Value to add to stored encrypted value
  /// @return Result of stored value + modifier (encrypted)
  function operateOnStored(euint32 modifier) external view returns (euint32) {
    euint32 stored = encryptedValues[msg.sender];
    return FHE.add(stored, modifier);
  }
}
