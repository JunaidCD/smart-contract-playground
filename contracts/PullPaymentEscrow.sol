// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice PullPaymentEscrow - Buyer deposits, can refund before confirm, seller withdraws after buyer confirms
contract PullPaymentEscrow {
    // Custom errors
    error NotAuthorized();
    error AlreadyConfirmed();
    error AlreadyRefunded();
    error AlreadyWithdrawn();
    error InvalidAmount();
    error EscrowNotFound();
    error NothingToWithdraw();
    error TransferFailed();

    enum EscrowState { None, Deposited, Confirmed, Refunded, Withdrawn }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        EscrowState state;
    }

    uint256 private _nextId = 1;
    mapping(uint256 => Escrow) private _escrows;

    // pending withdrawals (pull payments)
    mapping(address => uint256) public pendingWithdrawals;

    // Events
    event Deposited(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event Confirmed(uint256 indexed escrowId);
    event Refunded(uint256 indexed escrowId);
    event Withdrawn(address indexed to, uint256 amount);

    /// @notice Create an escrow for a seller by sending ETH
    function createEscrow(address seller) external payable returns (uint256 escrowId) {
        if (msg.value == 0) revert InvalidAmount();
        if (seller == address(0)) revert NotAuthorized();

        escrowId = _nextId++;
        _escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            state: EscrowState.Deposited
        });

        emit Deposited(escrowId, msg.sender, seller, msg.value);
    }

    /// @notice Buyer confirms — credits seller's pending withdrawals
    function confirm(uint256 escrowId) external {
        Escrow storage e = _escrows[escrowId];
        if (e.state == EscrowState.None) revert EscrowNotFound();
        if (msg.sender != e.buyer) revert NotAuthorized();
        if (e.state == EscrowState.Confirmed) revert AlreadyConfirmed();
        if (e.state == EscrowState.Refunded) revert AlreadyRefunded();
        if (e.state == EscrowState.Withdrawn) revert AlreadyWithdrawn();

        // Effect
        e.state = EscrowState.Confirmed;
        pendingWithdrawals[e.seller] += e.amount;

        emit Confirmed(escrowId);
    }

    /// @notice Buyer refunds before confirmation — credits buyer's pending withdrawals
    function refund(uint256 escrowId) external {
        Escrow storage e = _escrows[escrowId];
        if (e.state == EscrowState.None) revert EscrowNotFound();
        if (msg.sender != e.buyer) revert NotAuthorized();
        if (e.state == EscrowState.Confirmed) revert AlreadyConfirmed();
        if (e.state == EscrowState.Refunded) revert AlreadyRefunded();
        if (e.state == EscrowState.Withdrawn) revert AlreadyWithdrawn();

        // Effect
        e.state = EscrowState.Refunded;
        pendingWithdrawals[e.buyer] += e.amount;

        emit Refunded(escrowId);
    }

    /// @notice Withdraw any pending payments (buyer or seller)
    function withdrawPayments() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // CEI: set to 0 before external call
        pendingWithdrawals[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) {
            // restore state on failure
            pendingWithdrawals[msg.sender] = amount;
            revert TransferFailed();
        }

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice View escrow details
    function getEscrow(uint256 escrowId) external view returns (address buyer, address seller, uint256 amount, EscrowState state) {
        Escrow storage e = _escrows[escrowId];
        if (e.state == EscrowState.None) revert EscrowNotFound();
        return (e.buyer, e.seller, e.amount, e.state);
    }

    /// @notice Contract ETH balance
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
