// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Encrypt Multiple Values
 * @notice Demonstrates encryption and storage of multiple values
 * @dev Chapter: Encryption
 */
contract EncryptMultipleValues is ZamaEthereumConfig {
  struct EncryptedData {
    euint32 value1;
    euint32 value2;
    euint32 value3;
    uint256 timestamp;
  }

  /// @notice Store for multiple encrypted values
  mapping(address => EncryptedData) public encryptedDataMap;
  uint256 public recordCount;

  event MultipleValuesEncrypted(address indexed user, uint256 recordId);

  /// @notice Encrypt and store multiple values
  /// @param input1 First external encrypted value
  /// @param input2 Second external encrypted value
  /// @param input3 Third external encrypted value
  /// @param proof1 Proof for first value
  /// @param proof2 Proof for second value
  /// @param proof3 Proof for third value
  function encryptMultiple(
    externalEuint32 input1,
    externalEuint32 input2,
    externalEuint32 input3,
    bytes calldata proof1,
    bytes calldata proof2,
    bytes calldata proof3
  ) external {
    // Convert all external encrypted values to internal
    euint32 enc1 = FHE.fromExternal(input1, proof1);
    euint32 enc2 = FHE.fromExternal(input2, proof2);
    euint32 enc3 = FHE.fromExternal(input3, proof3);

    // Set permissions for all values
    enc1.allowThis();
    enc1.allow(msg.sender);

    enc2.allowThis();
    enc2.allow(msg.sender);

    enc3.allowThis();
    enc3.allow(msg.sender);

    // Store all encrypted values together
    encryptedDataMap[msg.sender] = EncryptedData({
      value1: enc1,
      value2: enc2,
      value3: enc3,
      timestamp: block.timestamp
    });

    recordCount++;
    emit MultipleValuesEncrypted(msg.sender, recordCount);
  }

  /// @notice Perform aggregate operation on all encrypted values
  /// @return Result of value1 + value2 + value3 (encrypted)
  function sumAllValues() external view returns (euint32) {
    EncryptedData memory data = encryptedDataMap[msg.sender];
    euint32 sum = FHE.add(data.value1, data.value2);
    return FHE.add(sum, data.value3);
  }

  /// @notice Calculate average of three encrypted values
  /// @return Average result (encrypted)
  function averageValues() external view returns (euint32) {
    EncryptedData memory data = encryptedDataMap[msg.sender];
    euint32 sum = FHE.add(data.value1, data.value2);
    sum = FHE.add(sum, data.value3);
    return FHE.div(sum, FHE.asEuint32(3));
  }

  /// @notice Get all encrypted values
  /// @return The stored encrypted data
  function getEncryptedData() external view returns (EncryptedData memory) {
    return encryptedDataMap[msg.sender];
  }
}
