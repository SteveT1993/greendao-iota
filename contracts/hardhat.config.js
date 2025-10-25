require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('hardhat-deploy');


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  mocha: {
    timeout: 3600000,
  },
  solidity: {
    version: "0.8.9",
   
  },
  //Specifing Account to choose for deploying
	namedAccounts: {
		deployer: 0,
	},
  // This specifies network configurations used when running Hardhat tasks
  defaultNetwork: "hedera",
  networks: {
    hedera: {
      // HashIO testnet endpoint from the TESTNET_ENDPOINT variable in the .env file
      url: "https://testnet.hashio.io/api",
      // Your ECDSA account private key pulled from the .env file
      accounts: ["0x8fad5a380415bb8fd5f3620a7f883c6d4fd07f245b54e8d4bdc374a8f5f9918b"],
    },

  },
};