pragma solidity ^0.4.18;

contract Ownable {

  address owner;
  
  modifier onlyOwner() {
    require(msg.sender == owner, "Only the owner can call this function");
    _;
  }

  constructor () public {
    owner = msg.sender;
  }

}