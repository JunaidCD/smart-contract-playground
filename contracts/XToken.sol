// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract XToken is ERC20, AccessControl, Pausable {

    // Define roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Constructor: set token name, symbol and grant deployer all roles
    constructor() ERC20("XToken", "XTK") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); // admin can manage roles
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
    }

    // Mint function: only MINTER_ROLE can call
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // Burn function: only BURNER_ROLE can call
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    // Pause token transfers: only PAUSER_ROLE can call
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    // Unpause token transfers: only PAUSER_ROLE can call
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Override _beforeTokenTransfer to respect pause
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token is paused");
    }
}
