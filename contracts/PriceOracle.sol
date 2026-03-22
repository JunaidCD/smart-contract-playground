// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Simple Price Oracle
- Admin updates price
- Other contracts can read price
*/

contract PriceOracle {

    address public owner;
    uint256 public price; // example: ETH price in USD (scaled)

    event PriceUpdated(uint256 newPrice);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint256 initialPrice) {
        owner = msg.sender;
        price = initialPrice;
    }

    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");

        price = newPrice;

        emit PriceUpdated(newPrice);
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}