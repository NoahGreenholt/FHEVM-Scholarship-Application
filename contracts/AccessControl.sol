// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Access Control
 * @notice Demonstrates access control patterns with FHE permissions
 * @dev Chapter: Access Control
 *
 * This contract shows:
 * - FHE.allowThis() - Contract access to encrypted values
 * - FHE.allow(address) - User access to encrypted values
 * - FHE.allowTransient() - Temporary access permissions
 * - Common access control mistakes and how to avoid them
 */
contract AccessControl is ZamaEthereumConfig {
  /// @notice Medical record with different access levels
  struct MedicalRecord {
    ebool hasCriticalCondition;
    euint32 bloodPressure;
    euint32 heartRate;
    address patient;
    address doctor;
    bool exists;
  }

  /// @notice Storage for medical records
  mapping(uint256 => MedicalRecord) public records;
  uint256 public recordCount;

  event RecordCreated(uint256 indexed recordId, address indexed patient, address indexed doctor);
  event RecordAccessed(uint256 indexed recordId, address indexed accessor);
  event PermissionGranted(uint256 indexed recordId, address indexed to);
  event PermissionRevoked(uint256 indexed recordId, address indexed from);

  /// @notice ✅ CORRECT: Create record with proper access control
  /// Patient and doctor can access, contract can operate on data
  function createMedicalRecord(
    bool criticalCondition,
    uint32 bloodPressure,
    uint32 heartRate,
    address doctor
  ) external returns (uint256) {
    // Encrypt plaintext values
    ebool criticalConditionE = FHE.asEbool(criticalCondition);
    euint32 bloodPressureE = FHE.asEuint32(bloodPressure);
    euint32 heartRateE = FHE.asEuint32(heartRate);

    // ✅ Set contract permission - contract can use these values
    criticalConditionE.allowThis();
    bloodPressureE.allowThis();
    heartRateE.allowThis();

    // ✅ Set patient permission - patient can decrypt their own data
    criticalConditionE.allow(msg.sender);
    bloodPressureE.allow(msg.sender);
    heartRateE.allow(msg.sender);

    // ✅ Set doctor permission - doctor can access patient's data
    criticalConditionE.allow(doctor);
    bloodPressureE.allow(doctor);
    heartRateE.allow(doctor);

    recordCount++;
    records[recordCount] = MedicalRecord({
      hasCriticalCondition: criticalConditionE,
      bloodPressure: bloodPressureE,
      heartRate: heartRateE,
      patient: msg.sender,
      doctor: doctor,
      exists: true
    });

    emit RecordCreated(recordCount, msg.sender, doctor);
    return recordCount;
  }

  /// @notice ❌ ANTI-PATTERN: Missing allowThis()
  /// Contract cannot use the encrypted value later
  function createRecordMissingAllowThis(bool condition) external {
    ebool conditionE = FHE.asEbool(condition);

    // ❌ Missing allowThis() - contract won't be able to use this value
    // conditionE.allowThis(); // <-- MISSING!

    conditionE.allow(msg.sender); // Only user can access

    // ❌ Later operations on this value will fail!
    // ebool result = FHE.and(conditionE, someOtherValue); // ❌ Will fail
  }

  /// @notice ❌ ANTI-PATTERN: Not setting user permission
  /// User cannot decrypt their own data
  function createRecordMissingUserPermission(uint32 value) external {
    euint32 valueE = FHE.asEuint32(value);

    valueE.allowThis(); // Contract can access

    // ❌ Missing allow(msg.sender) - user cannot decrypt their own data!
    // valueE.allow(msg.sender); // <-- MISSING!

    // User won't be able to decrypt valueE later
  }

  /// @notice ✅ CORRECT: Grant additional permissions
  /// Owner can grant specialist access to record
  function grantAccess(uint256 recordId, address specialist) external {
    require(records[recordId].exists, "Record does not exist");
    require(records[recordId].patient == msg.sender, "Not the patient");

    // Grant specialist access to all fields
    MedicalRecord storage record = records[recordId];
    record.hasCriticalCondition.allow(specialist);
    record.bloodPressure.allow(specialist);
    record.heartRate.allow(specialist);

    emit PermissionGranted(recordId, specialist);
  }

  /// @notice Access record (verifies permissions are set correctly)
  /// @param recordId The record to access
  function accessRecord(uint256 recordId) external {
    require(records[recordId].exists, "Record does not exist");

    MedicalRecord memory record = records[recordId];

    // Verify caller has access
    require(
      msg.sender == record.patient || msg.sender == record.doctor,
      "No permission to access"
    );

    emit RecordAccessed(recordId, msg.sender);
  }

  /// @notice ✅ Demonstrate transient permissions
  /// Temporary access that doesn't persist
  function useTransientPermission(euint32 encryptedData) external pure returns (euint32) {
    // ✅ allowTransient() - temporary permission for this transaction only
    // Useful for intermediate calculations that don't need persistent access
    encryptedData.allowTransient();

    // Perform operation
    euint32 result = FHE.mul(encryptedData, FHE.asEuint32(2));

    // Permission expires after this transaction
    return result;
  }

  /// @notice ✅ CORRECT: Perform calculations with proper permissions
  /// Contract can operate on encrypted data it has access to
  function calculateRiskScore(uint256 recordId) external view returns (euint32) {
    require(records[recordId].exists, "Record does not exist");

    MedicalRecord memory record = records[recordId];

    // ✅ Contract has allowThis(), can perform operations
    euint32 avgBloodPressure = FHE.div(record.bloodPressure, FHE.asEuint32(120));
    euint32 avgHeartRate = FHE.div(record.heartRate, FHE.asEuint32(70));

    // Combine metrics
    euint32 riskScore = FHE.add(avgBloodPressure, avgHeartRate);

    return riskScore;
  }

  /// @notice ❌ ANTI-PATTERN: View function with encrypted input
  /// View functions cannot modify state to set permissions
  function viewFunctionWithEncryptedInput(
    externalEuint32 encryptedInput,
    bytes calldata proof
  ) external pure returns (uint32) {
    // ❌ This pattern doesn't work properly
    // Converting external encrypted to internal requires state changes
    // which view/pure functions cannot do

    // euint32 internal_enc = FHE.fromExternal(encryptedInput, proof); // ❌

    return 0; // Placeholder
  }

  /// @notice ✅ CORRECT: Non-view function with encrypted input
  /// Can properly set permissions and store encrypted values
  function nonViewFunctionWithEncryptedInput(
    externalEuint32 encryptedInput,
    bytes calldata proof
  ) external returns (euint32) {
    // ✅ Correct: can convert and set permissions in non-view function
    euint32 internal_enc = FHE.fromExternal(encryptedInput, proof);
    internal_enc.allowThis();
    internal_enc.allow(msg.sender);

    return internal_enc;
  }

  /// @notice ✅ Example: Hierarchical access control
  /// Different roles have different levels of access
  mapping(address => uint8) public roles; // 0=none, 1=patient, 2=doctor, 3=admin

  event RoleAssigned(address indexed user, uint8 role);

  function assignRole(address user, uint8 role) external {
    require(role <= 3, "Invalid role");
    roles[user] = role;
    emit RoleAssigned(user, role);
  }

  /// @notice Access medical record based on role
  /// Admins can access all records, doctors can access their patients, patients can access their own
  function accessRecordByRole(uint256 recordId) external view returns (bool canAccess) {
    require(records[recordId].exists, "Record does not exist");

    MedicalRecord memory record = records[recordId];
    uint8 userRole = roles[msg.sender];

    // Admin can access all
    if (userRole == 3) return true;

    // Doctor can access their patients
    if (userRole == 2 && record.doctor == msg.sender) return true;

    // Patient can access their own
    if (userRole == 1 && record.patient == msg.sender) return true;

    return false;
  }

  /// @notice ❌ ANTI-PATTERN: Not checking permissions before operations
  /// Always verify caller has appropriate permissions
  function performOperationWithoutCheck(uint256 recordId) external view returns (euint32) {
    // ❌ Missing permission check!
    // Should verify msg.sender is authorized before accessing

    MedicalRecord memory record = records[recordId];
    return FHE.add(record.bloodPressure, record.heartRate);
  }

  /// @notice ✅ CORRECT: Check permissions before operations
  function performOperationWithCheck(uint256 recordId) external view returns (euint32) {
    require(records[recordId].exists, "Record does not exist");

    MedicalRecord memory record = records[recordId];

    // ✅ Verify caller has permission
    require(
      msg.sender == record.patient || msg.sender == record.doctor || roles[msg.sender] == 3,
      "No permission"
    );

    return FHE.add(record.bloodPressure, record.heartRate);
  }

  /// @notice Example: Batch permission grant
  /// Grant multiple users access to encrypted value efficiently
  function grantBatchAccess(uint256 recordId, address[] calldata users) external {
    require(records[recordId].exists, "Record does not exist");
    require(records[recordId].patient == msg.sender, "Not the patient");

    MedicalRecord storage record = records[recordId];

    // Grant all users access to all fields
    for (uint256 i = 0; i < users.length; i++) {
      record.hasCriticalCondition.allow(users[i]);
      record.bloodPressure.allow(users[i]);
      record.heartRate.allow(users[i]);

      emit PermissionGranted(recordId, users[i]);
    }
  }

  /// @notice Summary of access control best practices:
  /// ✅ Always call allowThis() for contract to use encrypted values
  /// ✅ Always call allow(user) for users to decrypt their own data
  /// ✅ Use allowTransient() for temporary permissions
  /// ✅ Verify permissions before operations
  /// ✅ Use role-based access control for complex scenarios
  /// ❌ Don't forget allowThis() - contract won't be able to use value
  /// ❌ Don't forget allow(user) - user won't be able to decrypt
  /// ❌ Don't use view functions with encrypted inputs that need conversion
  /// ❌ Don't skip permission checks before operations
}
