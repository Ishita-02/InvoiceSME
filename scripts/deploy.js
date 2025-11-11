const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // // --- 1️⃣ Deploy Mock PYUSD token ---
  // const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  // const mockPYUSD = await MockERC20.deploy();
  // await mockPYUSD.waitForDeployment();
  // const mockPYUSDAddress = await mockPYUSD.getAddress();
  // console.log(`Mock PYUSD deployed to: ${mockPYUSDAddress}`);

  // // --- 2️⃣ Mint some tokens to deployer ---
  // const mintAmount = hre.ethers.parseUnits("1000", 18);
  // const mintTx = await mockPYUSD.mint(deployer.address, mintAmount);
  // await mintTx.wait();
  // console.log(`Minted 1000 mPYUSD to: ${deployer.address}`);

  // --- 3️⃣ Deploy InvoiceSME contract using mock PYUSD ---
  const InvoiceSME = await hre.ethers.getContractFactory("InvoiceSME");
  const invoiceSME = await InvoiceSME.deploy("0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", deployer.address);
  await invoiceSME.waitForDeployment();

  const invoiceSMEAddress = await invoiceSME.getAddress();
  console.log(`InvoiceSME contract deployed to: ${invoiceSMEAddress}`);

  // --- 4️⃣ Add verified seller ---
  const sellerAddress = "0xdc984157f54f2e186cb6e9082bb998cbe7c44c23";
  const addSellerTx = await invoiceSME.addVerifiedSeller(sellerAddress);
  await addSellerTx.wait();
  console.log(`Verified seller added: ${sellerAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
