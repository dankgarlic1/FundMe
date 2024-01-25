const { network, run } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config;
const { verify } = require("../utils/verify");

// async function deployFunc(hre) {
//   const { deploy } = hre.deployments;
//   const { deployer } = hre.getNamedAccounts();
//   const chainId = network.config.chainId;

//   const ethUsdPriceFeedAddress = networkConfig[chainId]["ethPriceUsd"];
// }

// module.exports = deployFunc;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //if contract doesn't exist on chain(eg pricefeed on out local hardhat network),
  // we deploy a minimal smart contract(like pricefeed) on our local hardhat network
  //which will simulates as if we are intrtating on a testnet or a mainnet

  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethPriceUsd"];

  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethPriceUsd"];
  }
  log("Deploying FundMe and waiting for confirmations...");
  const FundMe = await deploy("FundMe", {
    contract: "FundMe",
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`FundMe deployed at ${FundMe.address}`);
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(FundMe.address, [ethUsdPriceFeedAddress]);
  }
  log("__________________________________________");
};
module.exports.tags = ["all", "fundme"];
