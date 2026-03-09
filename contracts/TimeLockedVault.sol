// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeLockedVault {

    struct Deposit {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => Deposit) public deposits;

    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount);

    function deposit(uint256 lockDuration) external payable {

        require(msg.value > 0, "No ETH sent");

        deposits[msg.sender] = Deposit({
            amount: msg.value,
            unlockTime: block.timestamp + lockDuration
        });

        emit Deposited(msg.sender, msg.value, block.timestamp + lockDuration);
    }

    function withdraw() external {

        Deposit storage userDeposit = deposits[msg.sender];

        require(userDeposit.amount > 0, "No deposit");
        require(block.timestamp >= userDeposit.unlockTime, "Funds locked");

        uint256 amount = userDeposit.amount;

        userDeposit.amount = 0;

        payable(msg.sender).transfer(amount);

        emit Withdrawn(msg.sender, amount);
    }
}