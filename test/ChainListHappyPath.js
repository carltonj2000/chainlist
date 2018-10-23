const Chainlist = artifacts.require("./ChainList.sol");

contract("ChainList", function(accounts) {
  let chainListInstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const articleName = "article 1";
  const articleDescription = "Description for artile 1";
  const articlePrice = 3;
  let sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  let buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("should be initialized with empty values", function() {
    return Chainlist.deployed()
      .then(instance => instance.getArticle())
      .then(data => {
        assert.equal(data[0], 0x0, "article must have no seller");
        assert.equal(data[1], 0x0, "article must have no buyer");
        assert.equal(data[2], "", "article must have no name");
        assert.equal(data[3], "", "article must have no description");
        assert.equal(data[4].toNumber(), 0, "seller must have no price");
      });
  });

  it("should sell an article", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.sellArticle(
          articleName,
          articleDescription,
          web3.toWei(articlePrice),
          { from: seller }
        );
      })
      .then(() => chainListInstance.getArticle())
      .then(article => {
        assert.equal(article[0], seller, "article must have a seller");
        assert.equal(article[1], 0x0, "article must have no buyer");
        assert.equal(article[2], articleName, "article must have a name");
        assert.equal(
          article[3],
          articleDescription,
          "article must have a description"
        );
        assert.equal(
          article[4].toNumber(),
          web3.toWei(articlePrice),
          "seller must have a price"
        );
      });
  });

  const getBalance = account =>
    web3.fromWei(web3.eth.getBalance(account), "ether").toNumber();

  it("should buy an article", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        sellerBalanceBeforeBuy = getBalance(seller);
        buyerBalanceBeforeBuy = getBalance(buyer);
        return chainListInstance.buyArticle({
          from: buyer,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, "1 event should be fired");
        assert.equal(
          receipt.logs[0].event,
          "LogBuyArticle",
          "correct event was fired"
        );
        assert.equal(receipt.logs[0].args._seller, seller, "seller");
        assert.equal(receipt.logs[0].args._buyer, buyer, "buyer");
        assert.equal(receipt.logs[0].args._name, articleName, "name");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice, "ether"),
          "price"
        );
        sellerBalanceAfterBuy = getBalance(seller);
        buyerBalanceAfterBuy = getBalance(buyer);
        assert.equal(
          sellerBalanceAfterBuy,
          sellerBalanceBeforeBuy + articlePrice,
          "sell gets payed"
        );
        assert(
          buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice,
          "buyer payed"
        );
        return chainListInstance.getArticle();
      })
      .then(article => {
        assert.equal(article[0], seller, "article must have a seller");
        assert.equal(article[1], buyer, "article must have no buyer");
        assert.equal(article[2], articleName, "article must have a name");
        assert.equal(
          article[3],
          articleDescription,
          "article must have a description"
        );
        assert.equal(
          article[4].toNumber(),
          web3.toWei(articlePrice),
          "seller must have a price"
        );
      });
  });

  it("should trigger an event when an article is sold", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.sellArticle(
          articleName,
          articleDescription,
          web3.toWei(articlePrice, "ether"),
          { from: seller }
        );
      })
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, "1 event should be fired");
        assert.equal(
          receipt.logs[0].event,
          "LogSellArticle",
          "correct event was fired"
        );
        assert.equal(receipt.logs[0].args._seller, seller, "log seller");
        assert.equal(receipt.logs[0].args._name, articleName, "log seller");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice, "ether"),
          "log seller"
        );
      });
  });
});
