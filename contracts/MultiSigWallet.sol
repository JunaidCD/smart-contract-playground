// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
MultiSig Wallet
- Multiple owners approve transactions
- Requires minimum confirmations
*/

contract MultiSigWallet {

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    struct Transaction {
        address to;
        uint256 value;
        bool executed;
        uint256 confirmations;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    event Submit(uint256 txId);
    event Approve(address owner, uint256 txId);
    event Execute(uint256 txId);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "No owners");
        require(_required <= _owners.length, "Invalid required");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    function submit(address _to, uint256 _value) external onlyOwner {
        transactions.push(Transaction({
            to: _to,
            value: _value,
            executed: false,
            confirmations: 0
        }));

        emit Submit(transactions.length - 1);
    }

    function approve(uint256 txId) external onlyOwner {
        Transaction storage txn = transactions[txId];

        require(!txn.executed, "Executed");
        require(!approved[txId][msg.sender], "Already approved");

        approved[txId][msg.sender] = true;
        txn.confirmations++;

        emit Approve(msg.sender, txId);
    }

    function execute(uint256 txId) external onlyOwner {
        Transaction storage txn = transactions[txId];

        require(!txn.executed, "Executed");
        require(txn.confirmations >= required, "Not enough approvals");

        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}("");
        require(success, "Tx failed");

        emit Execute(txId);
    }

    receive() external payable {}
}