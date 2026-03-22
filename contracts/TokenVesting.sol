// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Token Vesting Contract
- Locks ETH for a beneficiary
- Releases gradually over time
*/

contract TokenVesting {

    address public beneficiary;
    uint256 public start;
    uint256 public duration;
    uint256 public totalAmount;
    uint256 public released;

    event Released(uint256 amount);

    constructor(address _beneficiary, uint256 _duration) payable {
        require(_beneficiary != address(0), "Invalid address");

        beneficiary = _beneficiary;
        duration = _duration;
        start = block.timestamp;
        totalAmount = msg.value;
    }

    function releasable() public view returns (uint256) {
        uint256 elapsed = block.timestamp - start;

        if (elapsed >= duration) {
            return totalAmount - released;
        }

        return (totalAmount * elapsed) / duration - released;
    }

    function release() external {
        require(msg.sender == beneficiary, "Not beneficiary");

        uint256 amount = releasable();
        require(amount > 0, "Nothing to release");

        released += amount;
        payable(beneficiary).transfer(amount);

        emit Released(amount);
    }
}