// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Arithmetic Operations
 * @notice Demonstrates FHE arithmetic operations (add, subtract, multiply)
 * @dev Chapter: Basic Operations - Arithmetic
 */
contract Arithmetic is ZamaEthereumConfig {
  /// @notice Add two encrypted values
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return The sum of a + b (encrypted)
  function add(euint32 a, euint32 b) external pure returns (euint32) {
    return FHE.add(a, b);
  }

  /// @notice Subtract two encrypted values
  /// @param a First encrypted value (minuend)
  /// @param b Second encrypted value (subtrahend)
  /// @return The difference of a - b (encrypted)
  function subtract(euint32 a, euint32 b) external pure returns (euint32) {
    return FHE.sub(a, b);
  }

  /// @notice Multiply two encrypted values
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return The product of a * b (encrypted)
  function multiply(euint32 a, euint32 b) external pure returns (euint32) {
    return FHE.mul(a, b);
  }

  /// @notice Divide two encrypted values
  /// @param a First encrypted value (dividend)
  /// @param b Second encrypted value (divisor)
  /// @return The quotient of a / b (encrypted)
  function divide(euint32 a, euint32 b) external pure returns (euint32) {
    return FHE.div(a, b);
  }

  /// @notice Calculate remainder of two encrypted values
  /// @param a First encrypted value (dividend)
  /// @param b Second encrypted value (divisor)
  /// @return The remainder of a % b (encrypted)
  function remainder(euint32 a, euint32 b) external pure returns (euint32) {
    return FHE.rem(a, b);
  }

  /// @notice Perform complex arithmetic: (a + b) * c - d
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @param c Third encrypted value
  /// @param d Fourth encrypted value
  /// @return The result of (a + b) * c - d (encrypted)
  function complexOperation(
    euint32 a,
    euint32 b,
    euint32 c,
    euint32 d
  ) external pure returns (euint32) {
    euint32 sum = FHE.add(a, b);
    euint32 product = FHE.mul(sum, c);
    euint32 result = FHE.sub(product, d);
    return result;
  }
}
