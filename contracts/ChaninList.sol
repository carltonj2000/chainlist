pragma solidity ^0.4.18;

contract ChainList {
  address seller;
  address buyer;
  string name;
  string description;
  uint256 price;

  event LogSellArticle(address indexed _seller, string _name, uint256 _price);
  event LogBuyArticle(address indexed _seller, address indexed _buyer, string _name, uint256 _price);

  function sellArticle(string _name, string _description, uint256 _price) public {
    seller = msg.sender;
    name = _name;
    description = _description;
    price = _price;
    emit LogSellArticle(seller, name, price);
  }

  function getArticle() public view returns(
    address _seller,
    address _buyer,
    string _name,
    string _description,
    uint256 _price
  ) {
    return (seller, buyer, name, description, price);
  }

  function buyArticle() public payable {
    require(seller != 0x0, "have to have a seller"); 
    require(buyer == 0x0, "not already bought");
    require(msg.sender != seller, "not allowed to buy your own article");
    require(msg.value == price, "need to pay correct amount");
    buyer = msg.sender;
    seller.transfer(msg.value);
    emit LogBuyArticle(seller, buyer, name, price);
  }

}