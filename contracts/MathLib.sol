// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Tiny reusable math helper library
library MathLib {
    function addUint(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    function subUint(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "MathLib: underflow");
        return a - b;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }
}
