import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * Example Test Suite
 *
 * This test file serves as a template for testing FHEVM contracts.
 * Replace this with tests for your actual contract implementation.
 */
describe("Example Contract", function () {
  let example: any;

  beforeEach(async function () {
    const Example = await ethers.getContractFactory("Example");
    example = await Example.deploy();
    await example.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await example.getAddress()).to.be.properAddress;
    });
  });

  describe("Basic Operations", function () {
    it("Should exist", async function () {
      const address = await example.getAddress();
      expect(address).to.not.equal(ethers.ZeroAddress);
    });
  });
});
