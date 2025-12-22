// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Counter
 * @notice Demonstrates a simple encrypted counter using FHEVM
 * @dev Chapter: Basic Operations
 */
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  event CounterIncremented(uint32 indexed value);
  event CounterDecremented(uint32 indexed value);
  event CounterReset();

  /// @notice Initialize counter to 0
  constructor() {
    _count = FHE.asEuint32(0);
    _count.allowThis();
  }

  /// @notice Increment counter by specified encrypted value
  /// @dev This example omits overflow/underflow checks for simplicity
  /// @param inputEuint32 External encrypted value
  /// @param inputProof Input proof for the encrypted value
  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.add(_count, encryptedValue);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CounterIncremented(1);
  }

  /// @notice Decrement counter by specified encrypted value
  /// @param inputEuint32 External encrypted value
  /// @param inputProof Input proof for the encrypted value
  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.sub(_count, encryptedValue);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CounterDecremented(1);
  }

  /// @notice Reset counter to 0
  function reset() external {
    _count = FHE.asEuint32(0);
    _count.allowThis();
    FHE.allow(_count, msg.sender);

    emit CounterReset();
  }

  /// @notice Get encrypted count (handle)
  /// @return The encrypted counter value
  function getCount() external view returns (euint32) {
    return _count;
  }
}
