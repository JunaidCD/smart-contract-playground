// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error NotOwner(address caller); // custom error (cheaper than string)

contract SimpleStorage {
    uint256 private value;
    address public immutable owner;

    // Event emitted when value is stored
    event Stored(address indexed sender, uint256 newVal);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner(msg.sender);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // store: only owner can call (uses custom error)
    function store(uint256 newVal) external onlyOwner {
        value = newVal;
        emit Stored(msg.sender, newVal);
    }

    // getter
    function get() external view returns (uint256) {
        return value;
    }
}
