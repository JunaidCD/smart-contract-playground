// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BountyBoard - Poster funds bounty, hunters submit, poster approves, hunter withdraws (pull)
contract BountyBoard {
    // Custom errors
    error InvalidAmount();
    error NotPoster();
    error BountyNotFound();
    error InvalidState();
    error NothingToWithdraw();
    error TransferFailed();
    error AlreadyApproved();

    enum State { Funding, Active, Closed }

    struct Bounty {
        address poster;
        uint256 amount;
        State state;
        address acceptedHunter;
    }

    uint256 private _nextId = 1;
    mapping(uint256 => Bounty) private _bounties;

    // submissions stored as mapping: bountyId => hunter => submission string (could be IPFS hash)
    mapping(uint256 => mapping(address => string)) public submissions;

    // pull payments
    mapping(address => uint256) public pendingWithdrawals;

    // Events
    event Posted(uint256 indexed bountyId, address indexed poster, uint256 amount);
    event Submitted(uint256 indexed bountyId, address indexed hunter, string submission);
    event Approved(uint256 indexed bountyId, address indexed hunter);
    event Withdrawn(address indexed to, uint256 amount);

    /// @notice Poster posts & funds a bounty. Moves bounty to Active immediately.
    function postBounty() external payable returns (uint256 bountyId) {
        if (msg.value == 0) revert InvalidAmount();

        bountyId = _nextId++;
        _bounties[bountyId] = Bounty({
            poster: msg.sender,
            amount: msg.value,
            state: State.Active,
            acceptedHunter: address(0)
        });

        emit Posted(bountyId, msg.sender, msg.value);
    }

    /// @notice Hunter submits a solution reference (e.g., IPFS hash). Allowed only in Active state.
    function submitSolution(uint256 bountyId, string calldata submission) external {
        Bounty storage b = _bounties[bountyId];
        if (b.state == State(0) && b.poster == address(0)) revert BountyNotFound();
        if (b.state != State.Active) revert InvalidState();

        submissions[bountyId][msg.sender] = submission;
        emit Submitted(bountyId, msg.sender, submission);
    }

    /// @notice Poster approves a hunter's submission — credits hunter's pending withdrawal and closes bounty.
    function approve(uint256 bountyId, address hunter) external {
        Bounty storage b = _bounties[bountyId];
        if (b.state == State(0) && b.poster == address(0)) revert BountyNotFound();
        if (msg.sender != b.poster) revert NotPoster();
        if (b.state != State.Active) revert InvalidState();
        if (b.acceptedHunter != address(0)) revert AlreadyApproved();
        // Optionally ensure hunter has submitted; skipping strict check to allow off-chain agreement.
        // Effect: close bounty and credit hunter
        b.state = State.Closed;
        b.acceptedHunter = hunter;
        pendingWithdrawals[hunter] += b.amount;

        emit Approved(bountyId, hunter);
    }

    /// @notice Pull-style withdraw for hunters/posters (anyone with pending balance)
    function withdrawPayments() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // CEI: set to 0 before external call
        pendingWithdrawals[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        if (!sent) {
            pendingWithdrawals[msg.sender] = amount;
            revert TransferFailed();
        }

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice View bounty details
    function getBounty(uint256 bountyId) external view returns (address poster, uint256 amount, State state, address acceptedHunter) {
        Bounty storage b = _bounties[bountyId];
        if (b.state == State(0) && b.poster == address(0)) revert BountyNotFound();
        return (b.poster, b.amount, b.state, b.acceptedHunter);
    }
}
