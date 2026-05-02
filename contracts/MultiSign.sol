// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSig {
    address[] public owners;
    mapping(address => bool) public isOwner;

    uint public constant REQUIRED = 2;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint approvalCount;
    }

    Transaction[] public transactions;

    // txId => owner => approved
    mapping(uint => mapping(address => bool)) public approved;

    // 🔥 Reentrancy Guard
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    // 🔥 Events
    event Proposed(uint txId, address proposer);
    event Approved(uint txId, address owner);
    event Executed(uint txId);

    constructor(address[] memory _owners) {
        require(_owners.length >= REQUIRED, "Not enough owners");

        for (uint i; i < _owners.length; i++) { // ✅ gas optimized
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");

            isOwner[owner] = true;
            owners.push(owner);
        }
    }

    // 1️⃣ Propose transaction (AUTO APPROVE FIX)
    function propose(address _to, uint _value, bytes calldata _data)
        external
        onlyOwner
    {
        uint txId = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                approvalCount: 1 // ✅ proposer auto-approves
            })
        );

        approved[txId][msg.sender] = true;

        emit Proposed(txId, msg.sender);
    }

    // 2️⃣ Approve transaction
    function approve(uint _txId) external onlyOwner {
        require(_txId < transactions.length, "Tx does not exist"); // ✅ fix

        Transaction storage txn = transactions[_txId];

        require(!txn.executed, "Already executed");
        require(!approved[_txId][msg.sender], "Already approved");

        approved[_txId][msg.sender] = true;
        txn.approvalCount += 1;

        emit Approved(_txId, msg.sender);
    }

    // 🔥 Optional: Revoke approval
    function revoke(uint _txId) external onlyOwner {
        require(_txId < transactions.length, "Tx does not exist");

        Transaction storage txn = transactions[_txId];

        require(!txn.executed, "Already executed");
        require(approved[_txId][msg.sender], "Not approved");

        approved[_txId][msg.sender] = false;
        txn.approvalCount -= 1;
    }

    // 3️⃣ Execute transaction
    function execute(uint _txId) external onlyOwner nonReentrant {
        require(_txId < transactions.length, "Tx does not exist"); // ✅ fix

        Transaction storage txn = transactions[_txId];

        require(!txn.executed, "Already executed");
        require(txn.approvalCount >= REQUIRED, "Not enough approvals");

        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Tx failed");

        emit Executed(_txId);
    }

    // accept ETH
    receive() external payable {}
}