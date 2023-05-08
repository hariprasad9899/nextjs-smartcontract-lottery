const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
require("dotenv").config();
const { verify } = require("../utils/verify");
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionID;

    if (developmentChains.includes(network.name)) {
        log("Local network detected");
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transaction = await vrfCoordinatorV2Mock.createSubscription();
        const transactionResponse = await transaction.wait(1);
        subscriptionID = transactionResponse.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionID, VRF_SUB_FUND_AMOUNT);
    } else {
        log("Test network detected");
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinator"];
        subscriptionID = networkConfig[chainId]["subscriptionId"];
    }

    const entranceFee = networkConfig[chainId]["entranceFee"];
    const gasLane = networkConfig[chainId]["gasLane"];
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
    const interval = networkConfig[chainId]["interval"];

    const arguments = [vrfCoordinatorV2Address, entranceFee, gasLane, subscriptionID, callbackGasLimit, interval];

    log("Resolved VRF. Deploying Raffle");
    const raffle = await deploy("Raffle", {
        from: deployer,
        log: true,
        args: arguments,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    log("Raffle contract deployed");

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API) {
        await verify(raffle.address, arguments);
    }

    console.log(`Contract is now deployed at ${raffle.address}`);

    log("______________________________________________");
};

module.exports.tags = ["all", "raffle"];
