require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API = process.env.ETHERSCAN_API;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const COINMARKET_API = process.env.COINMARKET_API;

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 11155111,
        },
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
            blockConfirmations: 1,
        },
    },
    solidity: "0.8.18",
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.4.24",
            },
        ],
    },

    etherscan: {
        apiKey: ETHERSCAN_API,
    },

    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },

    gasReporter: {
        enabled: true,
        noColors: true,
        outputFile: "gasReport.txt",
        currency: "INR",
        coinmarketcap: COINMARKET_API,
    },
    mocha: {
        timeout: 300000,
    },
};
