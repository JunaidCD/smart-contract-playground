// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract XToken is ERC20 {
    constructor() ERC20("XToken", "XT") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // 1 million tokens to owner
    }
}
