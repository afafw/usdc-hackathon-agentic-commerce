const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying AgentOnramp with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Base Sepolia USDC address
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  const AgentOnramp = await hre.ethers.getContractFactory("AgentOnramp");
  const onramp = await AgentOnramp.deploy(USDC_ADDRESS);
  
  await onramp.waitForDeployment();
  const address = await onramp.getAddress();
  
  console.log("AgentOnramp deployed to:", address);
  console.log("USDC address:", USDC_ADDRESS);
  console.log("");
  console.log("BaseScan:", "https://sepolia.basescan.org/address/" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
