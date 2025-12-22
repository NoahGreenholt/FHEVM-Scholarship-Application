import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deployment Script Template
 *
 * This script deploys the Example contract.
 * Modify this to deploy your actual contracts.
 */
const deployFunc: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  log("Deploying Example contract...");

  const deployment = await deploy("Example", {
    from: deployer,
    log: true,
  });

  log(`Example contract deployed to: ${deployment.address}`);
};

deployFunc.tags = ["Example"];
export default deployFunc;
