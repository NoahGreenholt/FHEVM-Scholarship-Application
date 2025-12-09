import { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n" + "=".repeat(60));
  console.log("Deploying AnonymousScholarshipApplication Contract");
  console.log("=".repeat(60) + "\n");

  console.log(`Deployer address: ${deployer}`);
  console.log(`Network: ${hre.network.name}`);

  const deployment = await deploy("AnonymousScholarshipApplication", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 6 : 1,
  });

  console.log("\n" + "✅ ".repeat(30));
  console.log(`✅ Contract deployed successfully!`);
  console.log(`✅ Address: ${deployment.address}`);
  console.log(`✅ Transaction: ${deployment.transactionHash}`);
  console.log("✅ ".repeat(30) + "\n");

  // Verify on Etherscan if on Sepolia
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations before verification...");

    try {
      await hre.run("verify:verify", {
        address: deployment.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("Note: Contract verification skipped or failed");
      console.log("You can verify manually with:");
      console.log(`npx hardhat verify --network sepolia ${deployment.address}`);
    }
  }

  console.log("\nDeployment Summary:");
  console.log("━".repeat(60));
  console.log(`Contract Name: AnonymousScholarshipApplication`);
  console.log(`Contract Address: ${deployment.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer}`);
  console.log(`Gas Used: ${deployment.receipt?.gasUsed?.toString() || "N/A"}`);
  console.log("━".repeat(60) + "\n");

  console.log("Next steps:");
  console.log("1. Save the contract address for your frontend");
  console.log("2. Create scholarship programs using createProgram()");
  console.log("3. Test application submission with submitApplication()");
  console.log("4. Monitor events for ApplicationSubmitted\n");
};

func.tags = ["AnonymousScholarshipApplication", "scholarship"];
func.id = "deploy_scholarship_application";

export default func;
