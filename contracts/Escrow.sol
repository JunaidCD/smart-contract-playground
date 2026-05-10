// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow{
    address public buyer;
    address public owner;
    address public seller;

    uint256 public amount;
    uint256 public deadline;

    bool private locked;

    enum state {AWATING_DELIVERY , AWATING_PAYMENT , COMPLETE , REFUND , DISPUTE}
    state public currentState;

    event Deposited(address indexed buyer , uint256 amount);
    event Released(address indexed seller, uint256 amount);
    event Refunded(address indexed buyer, uint256 amount);
    event DisputeResolved(address indexed winner, uint256 amount);

    modifier nonReentrant(){
        require(!locked , "Reentrancy Detected");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyBuyer(){
        require(msg.sender == buyer , "Not Buyer");
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == owner , "Not owner");
        _;
    }

    modifier inState(state expectedState){
        require(currentState == expectedState , "Invalid state");
        _;
    }

    constructor(address _buyer , address _seller , uint256 _duration){
        buyer = _buyer;
        seller = _seller;
        owner = msg.sender;
        deadline = block.timestamp + _duration;
        currentState = state.AWATING_DELIVERY;
    }

    function deposit() external  payable  onlyBuyer inState(state.AWATING_DELIVERY){
    require(msg.value > 0 , "Send Some ETH");
    amount = msg.value;
    currentState = state.AWATING_DELIVERY;
    emit Deposited(msg.sender , msg.value);
    }

    function confirmDelivery() external onlyBuyer nonReentrant inState(state.AWATING_DELIVERY){
     currentState = state.COMPLETE;
     uint256 payment = amount;
     amount = 0;
     (bool success ,) = seller.call{value: payment}("");
     require(success , "Transaction Failed");
     emit Released(seller, payment);
    }

    function resolveDispute(bool releaseToSeller) external onlyOwner nonReentrant inState(state.DISPUTE){
        uint256 payment = amount;
        amount = 0;

        if(releaseToSeller){
            currentState = state.COMPLETE;
            (bool success ,) = seller.call{value: payment}("");
            require(success , "Transaction Failed");
            emit DisputeResolved(seller , payment);
        }

        else{
             currentState = state.REFUND;
            (bool success ,) = buyer.call{value: payment}("");
            require(success , "Transaction Failed");
            emit DisputeResolved(buyer , payment);
        }
    }

    function openDispute() external onlyBuyer inState(state.AWATING_DELIVERY){
        currentState = state.DISPUTE;
    }

    function timeOutRefund () external onlyBuyer nonReentrant inState(state.AWATING_DELIVERY){
    require(block.timestamp >= deadline , "Deadline Not Reached");
    currentState = state.REFUND;
    uint256 refundAmount = amount;
    amount = 0;
    (bool success ,) = buyer.call{value: refundAmount}("");
    require(success , "Transaction Failed");
    emit Refunded(buyer, refundAmount);

    }
}