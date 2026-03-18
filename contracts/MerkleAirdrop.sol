// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {

    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;

    event Claimed(address indexed user, uint256 amount);

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {

        require(!claimed[msg.sender], "Already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));

        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "Invalid proof"
        );

        claimed[msg.sender] = true;

        payable(msg.sender).transfer(amount);

        emit Claimed(msg.sender, amount);
    }

    receive() external payable {}
}