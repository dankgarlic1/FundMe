/*
In computer programming, unit testing is a software testing method by which individual units of source 
code—sets of one or more computer program modules together with associated control data, usage procedures,
and operating procedures—are tested to determine whether they are fit for use.
BASICALLY TESTING EACH FUNCTION 
IT IS TESTED IN LOCAL ENVIRONMENT ie : 1)Hardhat 2)Forked Hardhat network
 */

const { assert, expect } = require("chai");
const { Contract } = require("ethers");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
// const provider = waffle.provider;

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
        const realChainValue = await fundMe.s_priceFeed();
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
        const startingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        // console.log(startingFundMeBalance);
        const startingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );
        // console.log(startingDeployerBalance);

        // Act
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait(1);

        // console.log(transactionReceipt);
        const { gasUsed, gasPrice } = transactionReceipt; // we are pulling objects gasUsed, gasPrice from transaction receipt
        const gasCost = gasUsed * gasPrice;
        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        // console.log(endingFundMeBalance);
        const endingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );
        // console.log(endingDeployerBalance);

        // Assert
        // Maybe clean up to understand the testing
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance + startingDeployerBalance,
          endingDeployerBalance + gasCost
        );
      });
      it("Withdrawing from multiple Funders", async function () {
        // Arrange
        const accounts = await ethers.getSigners();
        // console.log(accounts);
        for (i = 1; i < 6; i++) {
          const fundMeConnectedContract = await fundMe.connect(accounts[i]);
          await fundMeConnectedContract.fund({ value: sendValue });
        }
        const startingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        const startingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );

        // Act
        const transactionResponse = await fundMe.withdraw();
        // Let's comapre gas costs :)
        const transactionReceipt = await transactionResponse.wait(1);
        const { gasUsed, gasPrice } = transactionReceipt;
        const withdrawGasCost = gasUsed * gasPrice;
        // console.log(`GasCost: ${withdrawGasCost}`);
        // console.log(`GasUsed: ${gasUsed}`);
        // console.log(`GasPrice: ${gasPrice}`);
        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        const endingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );
        // Assert
        assert.equal(
          startingFundMeBalance + startingDeployerBalance,
          endingDeployerBalance + withdrawGasCost
        );
        // Make a getter for storage variables
        await expect(fundMe.getFunders(0)).to.be.reverted;

        for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(accounts[i].address),
            0
          );
        }
      });
      it("Only allows owner to withdraw", async function () {
        const accounts = await ethers.getSigners();
        const attacker = await fundMe.connect(accounts[1]);

        await expect(attacker.withdraw()).to.be.revertedWithCustomError(
          fundMe,
          "FundMe__notOwner"
        );
      });
      it("cheaperwithdraw ETH from a single funder", async () => {
        // Arrange
        const startingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        // console.log(startingFundMeBalance);
        const startingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );
        // console.log(startingDeployerBalance);

        // Act
        const transactionResponse = await fundMe.cheaperWithdraw();
        const transactionReceipt = await transactionResponse.wait(1);

        // console.log(transactionReceipt);
        const { gasUsed, gasPrice } = transactionReceipt; // we are pulling objects gasUsed, gasPrice from transaction receipt
        const gasCost = gasUsed * gasPrice;
        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        // console.log(endingFundMeBalance);
        const endingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );
        // console.log(endingDeployerBalance);

        // Assert
        // Maybe clean up to understand the testing
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance + startingDeployerBalance,
          endingDeployerBalance + gasCost
        );
      });
      it("CheaperWithdraw from multiple Funders", async function () {
        // Arrange
        const accounts = await ethers.getSigners();
        // console.log(accounts);
        for (i = 1; i < 6; i++) {
          const fundMeConnectedContract = await fundMe.connect(accounts[i]);
          await fundMeConnectedContract.fund({ value: sendValue });
        }
        const startingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        const startingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );

        // Act
        const transactionResponse = await fundMe.cheaperWithdraw();
        // Let's comapre gas costs :)
        const transactionReceipt = await transactionResponse.wait(1);
        const { gasUsed, gasPrice } = transactionReceipt;
        const withdrawGasCost = gasUsed * gasPrice;
        // console.log(`GasCost: ${withdrawGasCost}`);
        // console.log(`GasUsed: ${gasUsed}`);
        // console.log(`GasPrice: ${gasPrice}`);
        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        const endingDeployerBalance = await ethers.provider.getBalance(
          deployer
        );
        // Assert
        assert.equal(
          startingFundMeBalance + startingDeployerBalance,
          endingDeployerBalance + withdrawGasCost
        );
        // Make a getter for storage variables
        await expect(fundMe.getFunders(0)).to.be.reverted;

        for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(accounts[i].address),
            0
          );
        }
      });
    });
  });
});
