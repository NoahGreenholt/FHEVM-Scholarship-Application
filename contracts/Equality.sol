// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Equality Comparison
 * @notice Demonstrates FHE equality and comparison operations
 * @dev Chapter: Basic Operations - Comparisons
 */
contract Equality is ZamaEthereumConfig {
  /// @notice Check if two encrypted values are equal
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return Boolean result (encrypted) - true if a == b
  function isEqual(euint32 a, euint32 b) external pure returns (ebool) {
    return FHE.eq(a, b);
  }

  /// @notice Check if two encrypted values are not equal
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return Boolean result (encrypted) - true if a != b
  function isNotEqual(euint32 a, euint32 b) external pure returns (ebool) {
    return FHE.ne(a, b);
  }

  /// @notice Check if first value is less than second
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return Boolean result (encrypted) - true if a < b
  function isLessThan(euint32 a, euint32 b) external pure returns (ebool) {
    return FHE.lt(a, b);
  }

  /// @notice Check if first value is less than or equal to second
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return Boolean result (encrypted) - true if a <= b
  function isLessThanOrEqual(euint32 a, euint32 b) external pure returns (ebool) {
    return FHE.le(a, b);
  }

  /// @notice Check if first value is greater than second
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return Boolean result (encrypted) - true if a > b
  function isGreaterThan(euint32 a, euint32 b) external pure returns (ebool) {
    return FHE.gt(a, b);
  }

  /// @notice Check if first value is greater than or equal to second
  /// @param a First encrypted value
  /// @param b Second encrypted value
  /// @return Boolean result (encrypted) - true if a >= b
  function isGreaterThanOrEqual(euint32 a, euint32 b) external pure returns (ebool) {
    return FHE.ge(a, b);
  }

  /// @notice Check if value is within range [min, max]
  /// @param value The encrypted value to check
  /// @param min Minimum encrypted value
  /// @param max Maximum encrypted value
  /// @return Boolean result (encrypted) - true if min <= value <= max
  function isInRange(euint32 value, euint32 min, euint32 max) external pure returns (ebool) {
    ebool greaterThanMin = FHE.ge(value, min);
    ebool lessThanMax = FHE.le(value, max);
    return FHE.and(greaterThanMin, lessThanMax);
  }
}
