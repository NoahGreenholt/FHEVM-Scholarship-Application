// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Public Decrypt Multiple Values
 * @notice Demonstrates public decryption of multiple encrypted values
 * @dev Chapter: Decryption - Public Decryption
 */
contract PublicDecryptMultipleValues is ZamaEthereumConfig {
  struct TaxCalculation {
    euint32 encryptedIncome;
    euint32 encryptedExpenses;
    uint32 decryptedTaxOwed;
    address taxpayer;
    bool calculated;
  }

  /// @notice Storage for tax calculations
  mapping(address => TaxCalculation) public taxRecords;

  event TaxCalculationRequested(address indexed taxpayer);
  event TaxCalculationCompleted(address indexed taxpayer, uint32 taxOwed);

  /// @notice Submit encrypted income and expenses for tax calculation
  /// @param encryptedIncome External encrypted income
  /// @param encryptedExpenses External encrypted expenses
  /// @param incomeProof Proof for income
  /// @param expensesProof Proof for expenses
  function submitTaxData(
    externalEuint32 encryptedIncome,
    externalEuint32 encryptedExpenses,
    bytes calldata incomeProof,
    bytes calldata expensesProof
  ) external {
    // Convert encrypted values
    euint32 income = FHE.fromExternal(encryptedIncome, incomeProof);
    euint32 expenses = FHE.fromExternal(encryptedExpenses, expensesProof);

    // Set permissions
    income.allowThis();
    expenses.allowThis();

    // Calculate taxable income (all on encrypted data)
    euint32 taxableIncome = FHE.sub(income, expenses);

    // Calculate tax (25% of taxable income)
    euint32 taxRate = FHE.asEuint32(25);
    euint32 taxOwed = FHE.mul(taxableIncome, taxRate);
    taxOwed = FHE.div(taxOwed, FHE.asEuint32(100));

    // Store encrypted calculation
    taxRecords[msg.sender] = TaxCalculation({
      encryptedIncome: income,
      encryptedExpenses: expenses,
      decryptedTaxOwed: 0, // Will be set after decryption
      taxpayer: msg.sender,
      calculated: false
    });

    emit TaxCalculationRequested(msg.sender);

    // Gateway would:
    // 1. Decrypt taxOwed
    // 2. Call completeTaxCalculation with plaintext tax amount
  }

  /// @notice Callback for gateway to store decrypted tax amount
  /// @param taxAmount The decrypted tax amount
  function completeTaxCalculation(uint32 taxAmount) external {
    require(taxRecords[msg.sender].taxpayer == msg.sender, "Not your record");
    require(!taxRecords[msg.sender].calculated, "Already calculated");

    taxRecords[msg.sender].decryptedTaxOwed = taxAmount;
    taxRecords[msg.sender].calculated = true;

    emit TaxCalculationCompleted(msg.sender, taxAmount);
  }

  /// @notice Get decrypted tax calculation
  /// @return The tax owed (plaintext)
  function getTaxCalculation() external view returns (uint32) {
    require(taxRecords[msg.sender].calculated, "Not calculated yet");
    return taxRecords[msg.sender].decryptedTaxOwed;
  }

  /// @notice Example: Budget approval based on encrypted values
  /// Determine if budget is approved without revealing the amounts
  struct BudgetRequest {
    euint32 requestedAmount;
    euint32 availableBudget;
    uint32 approvalAmount;
    bool approved;
    bool processed;
  }

  mapping(address => BudgetRequest) public budgets;

  event BudgetApprovalRequested(address indexed requester);
  event BudgetApprovalProcessed(address indexed requester, uint32 approvedAmount);

  /// @notice Request budget approval with encrypted amounts
  /// @param encryptedRequest External encrypted requested amount
  /// @param encryptedAvailable External encrypted available budget
  /// @param requestProof Proof for request
  /// @param availableProof Proof for available budget
  function requestBudgetApproval(
    externalEuint32 encryptedRequest,
    externalEuint32 encryptedAvailable,
    bytes calldata requestProof,
    bytes calldata availableProof
  ) external {
    // Convert encrypted values
    euint32 requested = FHE.fromExternal(encryptedRequest, requestProof);
    euint32 available = FHE.fromExternal(encryptedAvailable, availableProof);

    // Set permissions
    requested.allowThis();
    available.allowThis();

    // Determine if request fits in budget (encrypted comparison)
    euint32 difference = FHE.sub(available, requested);
    // If difference >= 0, approved; if < 0, denied

    // For multiple values, compute approval amount
    // (minimum of requested and available)
    euint32 approvalAmount = FHE.sub(available, difference);

    // Store encrypted budget data
    budgets[msg.sender] = BudgetRequest({
      requestedAmount: requested,
      availableBudget: available,
      approvalAmount: 0, // Will be set after decryption
      approved: false,
      processed: false
    });

    emit BudgetApprovalRequested(msg.sender);

    // Gateway would decrypt approvalAmount and call completeBudgetApproval
  }

  /// @notice Callback for gateway to store decrypted approval amount
  /// @param approvedAmount The decrypted approved amount
  function completeBudgetApproval(uint32 approvedAmount) external {
    require(budgets[msg.sender].processed == false, "Already processed");

    budgets[msg.sender].approvalAmount = approvedAmount;
    budgets[msg.sender].approved = approvedAmount > 0;
    budgets[msg.sender].processed = true;

    emit BudgetApprovalProcessed(msg.sender, approvedAmount);
  }

  /// @notice Get budget approval result
  /// @return approved Whether budget was approved
  /// @return amount The approved amount (plaintext)
  function getBudgetApproval() external view returns (bool approved, uint32 amount) {
    require(budgets[msg.sender].processed, "Not processed yet");
    return (budgets[msg.sender].approved, budgets[msg.sender].approvalAmount);
  }

  /// @notice ✅ Complex scenario: Calculate multiple metrics for decryption
  /// 1. Compute on encrypted data
  /// 2. Request public decryption of multiple results
  /// 3. Gateway decrypts and returns all plaintext values
  function calculateFinancialMetrics(
    externalEuint32 salary,
    externalEuint32 expenses,
    externalEuint32 savings,
    bytes calldata salaryProof,
    bytes calldata expensesProof,
    bytes calldata savingsProof
  ) external returns (uint256 batchId) {
    // Convert encrypted values
    euint32 salaryE = FHE.fromExternal(salary, salaryProof);
    euint32 expensesE = FHE.fromExternal(expenses, expensesProof);
    euint32 savingsE = FHE.fromExternal(savings, savingsProof);

    // Set permissions
    salaryE.allowThis();
    expensesE.allowThis();
    savingsE.allowThis();

    // Calculate multiple metrics (all encrypted)
    euint32 netIncome = FHE.sub(salaryE, expensesE);
    euint32 savingsRate = FHE.mul(savingsE, FHE.asEuint32(100));
    savingsRate = FHE.div(savingsRate, salaryE);

    // Request public decryption of multiple results
    // Gateway would:
    // 1. Decrypt netIncome
    // 2. Decrypt savingsRate
    // 3. Call completeFinancialMetrics with both plaintext values

    return 1; // Batch ID
  }

  /// @notice Callback to store decrypted financial metrics
  /// @param netIncome Decrypted net income
  /// @param savingsRate Decrypted savings rate percentage
  function completeFinancialMetrics(uint32 netIncome, uint32 savingsRate) external {
    // Store decrypted metrics
    // Implementation depends on storage structure
  }
}
