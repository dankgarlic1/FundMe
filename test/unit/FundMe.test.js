/*
In computer programming, unit testing is a software testing method by which individual units of source 
code—sets of one or more computer program modules together with associated control data, usage procedures,
and operating procedures—are tested to determine whether they are fit for use.
BASICALLY TESTING EACH FUNCTION 
IT IS TESTED IN LOCAL ENVIRONMENT ie : 1)Hardhat 2)Forked Hardhat network
 */

const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

// deploy fundme contract on our local Hardhat Network

describe("FundMe", async function () {
  let fundMe;
  let mockV3Aggregator;
  let deployer;
  const sendValue = ethers.parseEther("1");
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    /*By calling await deployments.fixture(['MyContract']) in your test, the same deployment is used for all tests, which eliminates the need to replicate the deployment procedure.
    The MyContract (or the all in your example) reference a tag that is added in the deployment scripts. So all the deployment scripts that have the given tag (MyContract) are going to be deployed before the test and that exact deployment is going to be used for all tests.
    For example, a deployment script with these tags:
    module.exports.tag = ["all", "MyContract"]
    will be deployed once if we do await deployments.fixture(['MyContract']) or await deployments.fixture(['all']) but will be deployed for each test if we do await deployments.fixture(['someOtherTag']) because it doesn't have that someOtherTag tag */
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer); // gets the most recently deployed contract, deployer here because we will use same account for deploying
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  }),
    describe("constructor", async function () {
      it("Sets the aggregator address correctly", async function () {
        const realChainValue = await fundMe.priceFeed();
        const mockV3Address = await mockV3Aggregator.getAddress();
        // console.log(`Price Feed: ${realChainValue} `);
        // console.log(`address of mock v3: ${mockV3Address} `);
        assert.equal(realChainValue, mockV3Address);
      });
    });

  describe("fund", async function () {
    it("reverts if enough eth is not sent", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't Send Enough");
    });

    it("updated the amount fund data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer);
      //   console.log(response);
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Adds funder to the array of Funders", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getFunders(0);
      assert.equal(response, deployer);
    });

    describe("withdraw", function () {
      beforeEach(async () => {
        await fundMe.fund({ value: sendValue });
      });
      it("withdraws ETH from a single funder", async () => {
        // Arrange
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.getAddress()
        );
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        // Act
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait();
        const { gasUsed, effectiveGasPrice } = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.getAddress()
        );
        const endingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        // Assert
        // Maybe clean up to understand the testing
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost).toString()
        );
      });
    });
  });
});
