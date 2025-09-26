import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

export default {
  solidity: "0.8.25",
  networks: {
    rootstock_testnet: {
      url: "https://public-node.testnet.rsk.co", // Rootstock testnet RPC
      chainId: 31,
      accounts: [process.env.PRIVATE_KEY], // your MetaMask private key
    },
    rootstock_mainnet: {
      url: "https://public-node.rsk.co", // Rootstock mainnet RPC
      chainId: 30,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
