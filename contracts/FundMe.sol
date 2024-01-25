// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.8;
import "./PriceConverter.sol";

error FundMe__notOwner();

contract FundMe {
    using PriceConverter for uint256;
    uint256 public constant MINIMUM_USD = 50 * 1e18; //constant variables have different naming convention

    address[] Funders;
    mapping(address => uint256) addressToAmountFunded;

    address public immutable i_owner; //different naming convention _i for immutable variables
    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender; //msg.sender here the person who deploys the contract since it is in Constructor
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD, //getConversionRate() takes two parameters ethAmount and addrss, msg.value by default is the first paramaeter so we will pass address only in paranthesis
            "Didn't Send Enough"
        );
        // require(getConversionRate(msg.value) >= minimumUsd, "Didn't send enough");//1e18 = 1 * 10**28 gwei
        Funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (uint256 fundIndex = 0; fundIndex < Funders.length; fundIndex++) {
            address funder = Funders[fundIndex];
            addressToAmountFunded[funder] = 0;
        }
        //reset the array
        Funders = new address[](0);
        //to withdraw funds we have 3 methods, transfer, send and call
        //transfer
        payable(msg.sender).transfer(address(this).balance);

        //send
        bool paymentSuccess = payable(msg.sender).send(address(this).balance);
        require(paymentSuccess, "FAIL");

        //call(recommended)
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }(""); //returns 2 variable b ut we only need one
        require(callSuccess, "fail");
    }

    modifier onlyOwner() {
        // require(msg.sender==i_owner);
        if (msg.sender != i_owner) {
            revert FundMe__notOwner();
        } // both do same thing, but ths is more gas efficient
        _;
    }

    //What if someone sends ETH to the contract address without calling FUND fucntion?

    //solidity has two special functions for this 1)recieve() 2)fallback()

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
