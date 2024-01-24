//this being used so that the contract can switch networks easily and we don't have to hardcode these in deployement
const networkConfig = {
  31337: {
    name: "Hardhat",
  },
  11155111: {
    name: "Sepolia",
    ethPriceUsd: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  137: {
    name: "Polygon",
    ethPriceUsd: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
  },
};
//local chains where we will deploy our contract and mock contract to test
const developmentChains = ["hardhat", "localHost"];
module.exports = {
  //we use this so other scripts can use the objects and variable from this file
  networkConfig,
  developmentChains,
};
