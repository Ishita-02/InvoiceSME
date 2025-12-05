require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // This enables the IR compilation pipeline
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts:
        ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/AqK-lMhLej1xV4uOTUDOKt724_JJsrwb",
      accounts:
        ["0xddc1aeec0aa629e7901f9854cbdf36a7b77c9c464773a6b87e63b89ae28a5613"],
    },
  },
};