//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeLockWallet{
    address public owner;
bool private locked;

struct LockInfo{
    uint256 balance;
    uint256 unlockTime;
}

mapping(address => LockInfo) public users;

modifier onlyOwner(){
    require(msg.sender == owner , "Not Owner");
    _;
}

modifier nonReentrant(){
    require(!locked, "Reentrancy Detected");
    locked = true;
    _;
    locked = false;
}

constructor(){
    owner = msg.sender;
}


function deposit(uint256 _durationTime) external payable{
    require(msg.value > 0 , "Send some ETH");
    require(_durationTime > 0 , "Invalid Time");

    LockInfo storage user = users[msg.sender];

    uint256 newUnlockTime = block.timestamp + _durationTime;

    if (newUnlockTime > user.unlockTime){
        user.unlockTime = newUnlockTime;
    }

    user.balance += msg.value;

}

function withdraw() external nonReentrant{
    LockInfo storage user = users[msg.sender];

    require(user.balance > 0, "No balance");
        require(block.timestamp >= user.unlockTime, "Still locked");

        uint256 amount = user.balance;
        user.balance = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
}

  function extendLock(address _user, uint256 _extraTime) external onlyOwner {
        require(_extraTime > 0, "Invalid time");

        LockInfo storage user = users[_user];
        require(user.unlockTime > 0, "User not found");

        user.unlockTime += _extraTime;
    }

       function getRemainingTime(address _user) external view returns (uint256) {
        if (block.timestamp >= users[_user].unlockTime) {
            return 0;
        }
        return users[_user].unlockTime - block.timestamp;
    }
}