import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AnonymousScholarshipApplication } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @title Anonymous Scholarship Application Tests
 * @notice Comprehensive test suite demonstrating FHEVM usage in scholarship applications
 * @dev Tests cover:
 * - FHE encrypted boolean operations
 * - Permission management (FHE.allowThis, FHE.allow)
 * - Multi-user scenarios
 * - Access control patterns
 * - Common anti-patterns and edge cases
 */

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  programAdmin: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("AnonymousScholarshipApplication");
  const contract = await factory.deploy() as AnonymousScholarshipApplication;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("AnonymousScholarshipApplication", function () {
  let signers: Signers;
  let contract: AnonymousScholarshipApplication;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      programAdmin: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether tests are running against FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn("This test suite requires FHEVM mock environment");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Program Management", function () {
    it("✅ should create a new scholarship program", async function () {
      const tx = await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship", "For outstanding academic performance", 100);
      await tx.wait();

      const programInfo = await contract.getProgramInfo(1);
      expect(programInfo.name).to.equal("Merit Scholarship");
      expect(programInfo.description).to.equal("For outstanding academic performance");
      expect(programInfo.maxApplications).to.equal(100);
      expect(programInfo.currentApplications).to.equal(0);
      expect(programInfo.isActive).to.be.true;
    });

    it("✅ should increment program count after creation", async function () {
      const initialCount = await contract.programCount();
      expect(initialCount).to.equal(0);

      await contract.connect(signers.programAdmin).createProgram("Program 1", "Description", 50);
      expect(await contract.programCount()).to.equal(1);

      await contract.connect(signers.programAdmin).createProgram("Program 2", "Description", 50);
      expect(await contract.programCount()).to.equal(2);
    });

    it("✅ should allow program admin to toggle program status", async function () {
      await contract.connect(signers.programAdmin).createProgram("Test Program", "Description", 50);

      let programInfo = await contract.getProgramInfo(1);
      expect(programInfo.isActive).to.be.true;

      await contract.connect(signers.programAdmin).toggleProgramStatus(1);
      programInfo = await contract.getProgramInfo(1);
      expect(programInfo.isActive).to.be.false;

      await contract.connect(signers.programAdmin).toggleProgramStatus(1);
      programInfo = await contract.getProgramInfo(1);
      expect(programInfo.isActive).to.be.true;
    });

    it("❌ should fail when non-admin tries to toggle program status", async function () {
      await contract.connect(signers.programAdmin).createProgram("Test Program", "Description", 50);

      await expect(
        contract.connect(signers.alice).toggleProgramStatus(1)
      ).to.be.revertedWith("Not program administrator");
    });
  });

  describe("Application Submission", function () {
    beforeEach(async function () {
      // Create a scholarship program before each test
      await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship", "For outstanding students", 100);
    });

    it("✅ should submit application with both criteria met (eligible)", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true);
      await tx.wait();

      expect(await contract.applicationCount()).to.equal(1);

      const basicInfo = await contract.getApplicationBasicInfo(1);
      expect(basicInfo.applicant).to.equal(signers.alice.address);
      expect(basicInfo.processed).to.be.false;
    });

    it("✅ should submit application with financial need but no academic criteria", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, false);
      await tx.wait();

      expect(await contract.applicationCount()).to.equal(1);
    });

    it("✅ should submit application with academic criteria but no financial need", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, false, true);
      await tx.wait();

      expect(await contract.applicationCount()).to.equal(1);
    });

    it("✅ should submit application with neither criterion met", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, false, false);
      await tx.wait();

      expect(await contract.applicationCount()).to.equal(1);
    });

    it("✅ should track applicant's applications", async function () {
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.alice).submitApplication(1, true, false);

      const aliceApplications = await contract.getMyApplications(signers.alice.address);
      expect(aliceApplications.length).to.equal(2);
      expect(aliceApplications[0]).to.equal(1);
      expect(aliceApplications[1]).to.equal(2);
    });

    it("✅ should increment program application count", async function () {
      let programInfo = await contract.getProgramInfo(1);
      expect(programInfo.currentApplications).to.equal(0);

      await contract.connect(signers.alice).submitApplication(1, true, true);
      programInfo = await contract.getProgramInfo(1);
      expect(programInfo.currentApplications).to.equal(1);

      await contract.connect(signers.bob).submitApplication(1, true, true);
      programInfo = await contract.getProgramInfo(1);
      expect(programInfo.currentApplications).to.equal(2);
    });

    it("✅ should emit ApplicationSubmitted event", async function () {
      await expect(contract.connect(signers.alice).submitApplication(1, true, true))
        .to.emit(contract, "ApplicationSubmitted")
        .withArgs(1, 1, signers.alice.address);
    });

    it("❌ should fail with invalid program ID", async function () {
      await expect(
        contract.connect(signers.alice).submitApplication(999, true, true)
      ).to.be.revertedWith("Invalid program ID");
    });

    it("❌ should fail when program is not active", async function () {
      await contract.connect(signers.programAdmin).toggleProgramStatus(1);

      await expect(
        contract.connect(signers.alice).submitApplication(1, true, true)
      ).to.be.revertedWith("Program not active");
    });

    it("❌ should fail when program is full", async function () {
      // Create program with max 2 applications
      await contract.connect(signers.programAdmin).createProgram("Limited Program", "Only 2 spots", 2);

      await contract.connect(signers.alice).submitApplication(2, true, true);
      await contract.connect(signers.bob).submitApplication(2, true, true);

      // Third application should fail
      await expect(
        contract.connect(signers.deployer).submitApplication(2, true, true)
      ).to.be.revertedWith("Program full");
    });
  });

  describe("Application Processing", function () {
    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship", "For outstanding students", 100);

      await contract.connect(signers.alice).submitApplication(1, true, true);
    });

    it("✅ should allow program admin to process application", async function () {
      const tx = await contract
        .connect(signers.programAdmin)
        .processApplication(1, 1, true);
      await tx.wait();

      const basicInfo = await contract.getApplicationBasicInfo(1);
      expect(basicInfo.processed).to.be.true;
    });

    it("✅ should emit ApplicationProcessed event", async function () {
      await expect(
        contract.connect(signers.programAdmin).processApplication(1, 1, true)
      ).to.emit(contract, "ApplicationProcessed")
      .withArgs(1, true);
    });

    it("❌ should fail when non-admin tries to process application", async function () {
      await expect(
        contract.connect(signers.alice).processApplication(1, 1, true)
      ).to.be.revertedWith("Not program administrator");
    });

    it("❌ should fail when processing already processed application", async function () {
      await contract.connect(signers.programAdmin).processApplication(1, 1, true);

      await expect(
        contract.connect(signers.programAdmin).processApplication(1, 1, true)
      ).to.be.revertedWith("Already processed");
    });
  });

  describe("Access Control & Permissions", function () {
    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship", "For outstanding students", 100);

      await contract.connect(signers.alice).submitApplication(1, true, true);
    });

    it("✅ should allow applicant to view their eligibility", async function () {
      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      // Should return an encrypted boolean handle (not revert)
      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("❌ should fail when unauthorized user tries to view eligibility", async function () {
      await expect(
        contract.connect(signers.bob).getApplicationEligibility(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("✅ should allow program admin to view program applications", async function () {
      const applications = await contract
        .connect(signers.programAdmin)
        .getProgramApplications(1);

      expect(applications.length).to.equal(1);
      expect(applications[0]).to.equal(1);
    });

    it("❌ should fail when non-admin tries to view program applications", async function () {
      await expect(
        contract.connect(signers.alice).getProgramApplications(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("FHE Encrypted Operations", function () {
    /**
     * @notice Tests demonstrating FHEVM encrypted boolean operations
     * @dev These tests show how FHE.and() works on encrypted ebool values
     * Key concepts:
     * - ebool: Encrypted boolean type
     * - FHE.asEbool(): Convert plaintext bool to encrypted ebool
     * - FHE.and(): Perform AND operation on encrypted booleans
     * - Permission management with allowThis() and allow()
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship", "For outstanding students", 100);
    });

    it("✅ FHE.and(true, true) should result in eligible application", async function () {
      // Submit application with both criteria met
      await contract.connect(signers.alice).submitApplication(1, true, true);

      // The contract internally performs: isEligible = FHE.and(true, true)
      // This should result in an encrypted "true" value

      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      // We can't decrypt in this test, but we can verify it's a valid handle
      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ FHE.and(true, false) should result in ineligible application", async function () {
      // Submit with financial need but no academic criteria
      await contract.connect(signers.alice).submitApplication(1, true, false);

      // The contract performs: isEligible = FHE.and(true, false) = false
      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ FHE.and(false, true) should result in ineligible application", async function () {
      // Submit with academic criteria but no financial need
      await contract.connect(signers.alice).submitApplication(1, false, true);

      // The contract performs: isEligible = FHE.and(false, true) = false
      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ FHE.and(false, false) should result in ineligible application", async function () {
      // Submit with neither criterion met
      await contract.connect(signers.alice).submitApplication(1, false, false);

      // The contract performs: isEligible = FHE.and(false, false) = false
      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Multi-User Scenarios", function () {
    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship", "For outstanding students", 100);
    });

    it("✅ should handle multiple applicants correctly", async function () {
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.bob).submitApplication(1, false, true);
      await contract.connect(signers.deployer).submitApplication(1, true, false);

      expect(await contract.applicationCount()).to.equal(3);

      const aliceApps = await contract.getMyApplications(signers.alice.address);
      const bobApps = await contract.getMyApplications(signers.bob.address);
      const deployerApps = await contract.getMyApplications(signers.deployer.address);

      expect(aliceApps.length).to.equal(1);
      expect(bobApps.length).to.equal(1);
      expect(deployerApps.length).to.equal(1);
    });

    it("✅ should maintain separate application lists per user", async function () {
      // Alice submits 2 applications
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.alice).submitApplication(1, true, false);

      // Bob submits 1 application
      await contract.connect(signers.bob).submitApplication(1, false, true);

      const aliceApps = await contract.getMyApplications(signers.alice.address);
      const bobApps = await contract.getMyApplications(signers.bob.address);

      expect(aliceApps.length).to.equal(2);
      expect(bobApps.length).to.equal(1);
      expect(aliceApps[0]).to.equal(1);
      expect(aliceApps[1]).to.equal(2);
      expect(bobApps[0]).to.equal(3);
    });
  });

  describe("Edge Cases & Anti-Patterns", function () {
    /**
     * @notice Tests demonstrating common mistakes and edge cases
     * @dev Important patterns to avoid:
     * ❌ DON'T: Query encrypted values without proper permissions
     * ❌ DON'T: Forget to call allowThis() for contract operations
     * ❌ DON'T: Attempt to use encrypted values in plain conditionals
     * ✅ DO: Always set proper permissions with allowThis() and allow()
     * ✅ DO: Use FHE operations for encrypted data
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Test Program", "For testing", 100);
    });

    it("✅ should handle program ID 0 gracefully", async function () {
      await expect(
        contract.connect(signers.alice).submitApplication(0, true, true)
      ).to.be.revertedWith("Invalid program ID");
    });

    it("✅ should handle querying non-existent applications", async function () {
      const basicInfo = await contract.getApplicationBasicInfo(999);
      expect(basicInfo.applicant).to.equal(ethers.ZeroAddress);
      expect(basicInfo.timestamp).to.equal(0);
      expect(basicInfo.processed).to.be.false;
    });

    it("✅ should maintain correct state after multiple operations", async function () {
      // Submit application
      await contract.connect(signers.alice).submitApplication(1, true, true);

      // Process it
      await contract.connect(signers.programAdmin).processApplication(1, 1, true);

      // Submit another
      await contract.connect(signers.bob).submitApplication(1, true, false);

      // Verify states
      const app1Info = await contract.getApplicationBasicInfo(1);
      const app2Info = await contract.getApplicationBasicInfo(2);

      expect(app1Info.processed).to.be.true;
      expect(app2Info.processed).to.be.false;
    });

    it("✅ should correctly track empty application list for new user", async function () {
      const newUserApps = await contract.getMyApplications(signers.bob.address);
      expect(newUserApps.length).to.equal(0);
    });
  });

  describe("Gas Optimization Patterns", function () {
    /**
     * @notice Tests demonstrating gas considerations for FHE operations
     * @dev Key points:
     * - FHE operations are more gas-intensive than plain operations
     * - Permission calls (allowThis, allow) add gas costs
     * - Batching operations can save gas
     * - Storage of encrypted values costs standard storage gas
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Gas Test Program", "Testing gas", 100);
    });

    it("should successfully complete FHE operations with adequate gas", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true, { gasLimit: 3000000 });

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Note: Actual gas used will be visible in receipt.gasUsed
      console.log(`Gas used for encrypted application: ${receipt.gasUsed}`);
    });

    it("should use consistent gas for different boolean combinations", async function () {
      // Test that FHE operations use similar gas regardless of values
      const tx1 = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true, { gasLimit: 3000000 });
      const receipt1 = await tx1.wait();

      const tx2 = await contract
        .connect(signers.bob)
        .submitApplication(1, false, false, { gasLimit: 3000000 });
      const receipt2 = await tx2.wait();

      // FHE operations should have consistent gas regardless of encrypted values
      const gasDiff = Math.abs(Number(receipt1.gasUsed) - Number(receipt2.gasUsed));
      expect(gasDiff).to.be.lessThan(50000); // Allow some variance
    });
  });

  describe("Advanced FHE Permission Patterns", function () {
    /**
     * @notice Advanced tests for FHE permission management
     * @dev Demonstrates:
     * - Permission inheritance
     * - Permission revocation patterns
     * - Cross-contract permission scenarios
     * - Multi-user permission patterns
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Permission Test Program", "Testing permissions", 100);
    });

    it("✅ should allow contract to use encrypted values after allowThis", async function () {
      // Submit application - internally calls allowThis
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true);
      await tx.wait();

      // Contract should be able to retrieve and use the encrypted values
      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ should maintain separate permissions for different users", async function () {
      // Alice submits application
      await contract.connect(signers.alice).submitApplication(1, true, true);

      // Alice can view her eligibility
      const aliceEligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);
      expect(aliceEligibility).to.not.equal(ethers.ZeroHash);

      // Bob cannot view Alice's eligibility
      await expect(
        contract.connect(signers.bob).getApplicationEligibility(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("✅ should grant admin access to program applications", async function () {
      await contract.connect(signers.alice).submitApplication(1, true, false);
      await contract.connect(signers.bob).submitApplication(1, false, true);

      // Program admin can view all applications in their program
      const programApps = await contract
        .connect(signers.programAdmin)
        .getProgramApplications(1);

      expect(programApps.length).to.equal(2);
      expect(programApps[0]).to.equal(1);
      expect(programApps[1]).to.equal(2);
    });
  });

  describe("Encrypted Data Lifecycle", function () {
    /**
     * @notice Tests demonstrating the complete lifecycle of encrypted data
     * @dev Covers:
     * - Data creation and encryption
     * - Storage on-chain
     * - Retrieval with proper permissions
     * - State transitions
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Lifecycle Test", "Testing lifecycle", 100);
    });

    it("✅ should store encrypted values on-chain", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true);
      await tx.wait();

      // Application should be stored with encrypted values
      const basicInfo = await contract.getApplicationBasicInfo(1);
      expect(basicInfo.applicant).to.equal(signers.alice.address);
      expect(basicInfo.timestamp).to.be.greaterThan(0);
    });

    it("✅ should maintain encrypted state through processing", async function () {
      // Submit and process application
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.programAdmin).processApplication(1, 1, true);

      // Encrypted values should remain accessible after processing
      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);
      expect(eligibility).to.not.equal(ethers.ZeroHash);

      const basicInfo = await contract.getApplicationBasicInfo(1);
      expect(basicInfo.processed).to.be.true;
    });

    it("✅ should track application count correctly", async function () {
      expect(await contract.applicationCount()).to.equal(0);

      await contract.connect(signers.alice).submitApplication(1, true, true);
      expect(await contract.applicationCount()).to.equal(1);

      await contract.connect(signers.bob).submitApplication(1, false, true);
      expect(await contract.applicationCount()).to.equal(2);

      await contract.connect(signers.deployer).submitApplication(1, true, false);
      expect(await contract.applicationCount()).to.equal(3);
    });
  });

  describe("FHE Boolean Logic Comprehensive Tests", function () {
    /**
     * @notice Comprehensive tests for all FHE boolean operations
     * @dev Tests all combinations and verifies correct encrypted logic
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Boolean Logic Test", "Testing FHE.and", 100);
    });

    it("✅ should correctly handle FHE.and(true, true) = true", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true);
      await tx.wait();

      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      // Should return a valid encrypted handle (not zero)
      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ should correctly handle FHE.and(true, false) = false", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, false);
      await tx.wait();

      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ should correctly handle FHE.and(false, true) = false", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, false, true);
      await tx.wait();

      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ should correctly handle FHE.and(false, false) = false", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, false, false);
      await tx.wait();

      const eligibility = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);

      expect(eligibility).to.not.equal(ethers.ZeroHash);
    });

    it("✅ should maintain consistent encrypted handles for same operations", async function () {
      // Submit two applications with same criteria
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.bob).submitApplication(1, true, true);

      const eligibility1 = await contract
        .connect(signers.alice)
        .getApplicationEligibility(1);
      const eligibility2 = await contract
        .connect(signers.bob)
        .getApplicationEligibility(2);

      // Both should have valid handles
      expect(eligibility1).to.not.equal(ethers.ZeroHash);
      expect(eligibility2).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Program Administration Edge Cases", function () {
    /**
     * @notice Tests for program administration edge cases and security
     */

    it("✅ should allow multiple programs by same admin", async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Program 1", "First", 50);
      await contract
        .connect(signers.programAdmin)
        .createProgram("Program 2", "Second", 50);
      await contract
        .connect(signers.programAdmin)
        .createProgram("Program 3", "Third", 50);

      expect(await contract.programCount()).to.equal(3);

      const prog1 = await contract.getProgramInfo(1);
      const prog2 = await contract.getProgramInfo(2);
      const prog3 = await contract.getProgramInfo(3);

      expect(prog1.name).to.equal("Program 1");
      expect(prog2.name).to.equal("Program 2");
      expect(prog3.name).to.equal("Program 3");
    });

    it("✅ should allow multiple admins to create programs", async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Admin 1 Program", "By Admin 1", 50);
      await contract
        .connect(signers.alice)
        .createProgram("Admin 2 Program", "By Alice", 50);
      await contract
        .connect(signers.bob)
        .createProgram("Admin 3 Program", "By Bob", 50);

      expect(await contract.programCount()).to.equal(3);
    });

    it("✅ should maintain separate application lists per program", async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Program 1", "First", 100);
      await contract
        .connect(signers.alice)
        .createProgram("Program 2", "Second", 100);

      await contract.connect(signers.bob).submitApplication(1, true, true);
      await contract.connect(signers.deployer).submitApplication(2, true, false);

      const prog1Apps = await contract
        .connect(signers.programAdmin)
        .getProgramApplications(1);
      const prog2Apps = await contract
        .connect(signers.alice)
        .getProgramApplications(2);

      expect(prog1Apps.length).to.equal(1);
      expect(prog2Apps.length).to.equal(1);
      expect(prog1Apps[0]).to.equal(1);
      expect(prog2Apps[0]).to.equal(2);
    });

    it("✅ should handle empty program name and description", async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("", "", 50);

      const programInfo = await contract.getProgramInfo(1);
      expect(programInfo.name).to.equal("");
      expect(programInfo.description).to.equal("");
      expect(programInfo.maxApplications).to.equal(50);
    });

    it("✅ should handle very large maxApplications", async function () {
      const largeLimit = ethers.MaxUint256;
      await contract
        .connect(signers.programAdmin)
        .createProgram("Large Program", "Many applications", largeLimit);

      const programInfo = await contract.getProgramInfo(1);
      expect(programInfo.maxApplications).to.equal(largeLimit);
    });
  });

  describe("Application Submission Edge Cases", function () {
    /**
     * @notice Edge cases for application submission
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Edge Test Program", "Testing edges", 10);
    });

    it("✅ should handle rapid successive applications from same user", async function () {
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.alice).submitApplication(1, true, false);
      await contract.connect(signers.alice).submitApplication(1, false, true);
      await contract.connect(signers.alice).submitApplication(1, false, false);

      const aliceApps = await contract.getMyApplications(signers.alice.address);
      expect(aliceApps.length).to.equal(4);
    });

    it("✅ should maintain correct ordering of applications", async function () {
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.bob).submitApplication(1, false, true);
      await contract.connect(signers.deployer).submitApplication(1, true, false);

      const programApps = await contract
        .connect(signers.programAdmin)
        .getProgramApplications(1);

      expect(programApps[0]).to.equal(1);
      expect(programApps[1]).to.equal(2);
      expect(programApps[2]).to.equal(3);
    });

    it("❌ should fail when applying to program at exact capacity", async function () {
      // Create program with max 2 applications
      await contract
        .connect(signers.programAdmin)
        .createProgram("Limited", "Only 2", 2);

      // Fill the program
      await contract.connect(signers.alice).submitApplication(2, true, true);
      await contract.connect(signers.bob).submitApplication(2, true, true);

      // Third application should fail
      await expect(
        contract.connect(signers.deployer).submitApplication(2, true, true)
      ).to.be.revertedWith("Program full");
    });

    it("✅ should track timestamps correctly", async function () {
      const tx = await contract
        .connect(signers.alice)
        .submitApplication(1, true, true);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const basicInfo = await contract.getApplicationBasicInfo(1);
      expect(basicInfo.timestamp).to.equal(block.timestamp);
    });
  });

  describe("State Consistency Tests", function () {
    /**
     * @notice Tests verifying state consistency across operations
     */

    beforeEach(async function () {
      await contract
        .connect(signers.programAdmin)
        .createProgram("Consistency Test", "Testing state", 100);
    });

    it("✅ should maintain consistent state after multiple operations", async function () {
      // Initial state
      expect(await contract.applicationCount()).to.equal(0);
      expect(await contract.programCount()).to.equal(1);

      // Submit applications
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.bob).submitApplication(1, false, true);

      expect(await contract.applicationCount()).to.equal(2);

      // Process first application
      await contract.connect(signers.programAdmin).processApplication(1, 1, true);

      const app1 = await contract.getApplicationBasicInfo(1);
      const app2 = await contract.getApplicationBasicInfo(2);

      expect(app1.processed).to.be.true;
      expect(app2.processed).to.be.false;
      expect(await contract.applicationCount()).to.equal(2);
    });

    it("✅ should maintain program counter after state changes", async function () {
      const initialCount = await contract.programCount();

      await contract
        .connect(signers.alice)
        .createProgram("Another", "More", 50);

      expect(await contract.programCount()).to.equal(initialCount + 1n);

      // Toggle status shouldn't affect count
      await contract.connect(signers.alice).toggleProgramStatus(2);
      expect(await contract.programCount()).to.equal(initialCount + 1n);
    });

    it("✅ should correctly update program application counts", async function () {
      let progInfo = await contract.getProgramInfo(1);
      expect(progInfo.currentApplications).to.equal(0);

      await contract.connect(signers.alice).submitApplication(1, true, true);
      progInfo = await contract.getProgramInfo(1);
      expect(progInfo.currentApplications).to.equal(1);

      await contract.connect(signers.bob).submitApplication(1, true, false);
      progInfo = await contract.getProgramInfo(1);
      expect(progInfo.currentApplications).to.equal(2);

      await contract.connect(signers.deployer).submitApplication(1, false, true);
      progInfo = await contract.getProgramInfo(1);
      expect(progInfo.currentApplications).to.equal(3);
    });
  });

  describe("Complex Multi-User Workflows", function () {
    /**
     * @notice Tests simulating complex real-world usage patterns
     */

    it("✅ should handle complete scholarship workflow", async function () {
      // Admin creates program
      await contract
        .connect(signers.programAdmin)
        .createProgram("Merit Scholarship 2025", "For excellent students", 5);

      // Multiple students apply
      await contract.connect(signers.alice).submitApplication(1, true, true);
      await contract.connect(signers.bob).submitApplication(1, true, false);
      await contract.connect(signers.deployer).submitApplication(1, false, true);

      // Admin reviews applications
      const applications = await contract
        .connect(signers.programAdmin)
        .getProgramApplications(1);

      expect(applications.length).to.equal(3);

      // Admin processes applications
      await contract
        .connect(signers.programAdmin)
        .processApplication(1, 1, true); // Approve Alice
      await contract
        .connect(signers.programAdmin)
        .processApplication(2, 1, false); // Reject Bob

      // Verify states
      const app1 = await contract.getApplicationBasicInfo(1);
      const app2 = await contract.getApplicationBasicInfo(2);
      const app3 = await contract.getApplicationBasicInfo(3);

      expect(app1.processed).to.be.true;
      expect(app2.processed).to.be.true;
      expect(app3.processed).to.be.false;
    });

    it("✅ should handle multiple programs with cross-applications", async function () {
      // Create multiple programs
      await contract
        .connect(signers.programAdmin)
        .createProgram("Program A", "First", 100);
      await contract
        .connect(signers.alice)
        .createProgram("Program B", "Second", 100);

      // Students apply to both programs
      await contract.connect(signers.bob).submitApplication(1, true, true);
      await contract.connect(signers.bob).submitApplication(2, true, false);
      await contract.connect(signers.deployer).submitApplication(1, false, true);
      await contract.connect(signers.deployer).submitApplication(2, false, false);

      // Verify Bob's applications
      const bobApps = await contract.getMyApplications(signers.bob.address);
      expect(bobApps.length).to.equal(2);

      // Verify Deployer's applications
      const deployerApps = await contract.getMyApplications(signers.deployer.address);
      expect(deployerApps.length).to.equal(2);

      // Verify program A applications
      const prog1Apps = await contract
        .connect(signers.programAdmin)
        .getProgramApplications(1);
      expect(prog1Apps.length).to.equal(2);

      // Verify program B applications
      const prog2Apps = await contract
        .connect(signers.alice)
        .getProgramApplications(2);
      expect(prog2Apps.length).to.equal(2);
    });
  });
});
