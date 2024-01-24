const { network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

async function deployFunc(hre) {
  const { deploy } = hre.deployments;
  const { deployer } = hre.getNamedAccounts();
  const chainId = network.config.chainId;

  //if contract doesn't exist on chain(eg pricefeed on out local hardhat network),
  // we deploy a minimal smart contract(like pricefeed) on our local hardhat network
  //which will simulates as if we are intrtating on a testnet or a mainnet
  const ethUsdPriceFeedAddress = networkConfig[chainId]["ethPriceUsd"];
}

module.exports = deployFunc;

// module.exports = async ({ getNamedAccounts, deployments }) => {
//   const { deploy, log } = deployments;
//   const { deployer } = await getNamedAccounts();
//   const chainId = network.config.chainId;

//   const ethUsdPriceFeedAddress = networkConfig[chainId]["ethPriceUsd"];

//
// };
