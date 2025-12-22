// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title Example
 * @notice This is a template contract for FHEVM development.
 * @dev Replace this with your actual contract implementation.
 */
contract Example {
  /**
   * @notice Simple addition of two encrypted values
   * @param a The first encrypted value
   * @param b The second encrypted value
   * @return The sum of a and b
   */
  function add(euint32 a, euint32 b) external pure returns (euint32) {
    return FHE.add(a, b);
  }
}
