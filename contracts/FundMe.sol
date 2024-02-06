// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.8;
import "./PriceConverter.sol";

error FundMe__notOwner();
error FundMe__notEnoughETH();

contract FundMe {
    using PriceConverter for uint256;
    uint256 public constant MINIMUM_USD = 50 * 1e18; //constant variables have different naming convention
    address[] private s_Funders; //all vaiables which are storage variable, we have different naming convention of s_
    mapping(address => uint256) private s_addressToAmountFunded; //all vaiables which are storage variable, we have different naming convention of s_
    address private immutable i_owner; //different naming convention _i for immutable variables
    AggregatorV3Interface private s_priceFeed; //all vaiables which are storage variable, we have different naming convention of s_

    modifier onlyOwner() {
        // require(msg.sender==i_owner);
        if (msg.sender != i_owner) {
            revert FundMe__notOwner();
        } // both do same thing, but ths is more gas efficient
        _;
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender; //msg.sender here the person who deploys the contract since it is in Constructor
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    function fund() public payable {
        if (msg.value.getConversionRate(s_priceFeed) <= MINIMUM_USD) {
            revert FundMe__notEnoughETH();
        }
        // require(getConversionRate(msg.value) >= minimumUsd, "Didn't send enough");//1e18 = 1 * 10**28 gwei
        s_Funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (uint256 fundIndex = 0; fundIndex < s_Funders.length; fundIndex++) {
            address funder = s_Funders[fundIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //reset the array
        s_Funders = new address[](0);

        //to withdraw funds we have 3 methods, transfer, send and call
        //transfer
        payable(msg.sender).transfer(address(this).balance);

        //send
        bool paymentSuccess = payable(msg.sender).send(address(this).balance);
        require(paymentSuccess, "FAIL");

        //call(recommended)
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }(""); //returns 2 variable but we only need one
        require(callSuccess, "fail");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_Funders;
        for (uint256 fundIndex = 0; fundIndex < funders.length; fundIndex++) {
            address funder = funders[fundIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_Funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    //What if someone sends ETH to the contract address without calling FUND fucntion?

    //solidity has two special functions for this 1)recieve() 2)fallback()

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    function getAddressToAmountFunded(
        address fundingAddress
    ) public view returns (uint256) {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_Funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
