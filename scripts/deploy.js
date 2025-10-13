const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // IMPORTANT: Use the official PYUSD address for the target network
  const pyusdTokenAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"; // Example: Ethereum Mainnet
  console.log(`Using live PYUSD token at: ${pyusdTokenAddress}`);

  // Deploy the InvoiceSME contract with the real PYUSD address
  const InvoiceSME = await hre.ethers.getContractFactory("InvoiceSME");
  const invoiceSME = await InvoiceSME.deploy(pyusdTokenAddress, deployer.address);
  await invoiceSME.waitForDeployment();
  
  const invoiceSMEAddress = await invoiceSME.getAddress();
  console.log(`InvoiceSME contract deployed to: ${invoiceSMEAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});