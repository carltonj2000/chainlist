const Chainlist = artifacts.require("./ChainList.sol");

contract("ChainList Exceptions", function(accounts) {
  let chainListInstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const articleName = "article 1";
  const articleDescription = "Description for artile 1";
  const articlePrice = 3;
  let sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  let buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("buy an article for sale when none is available", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.buyArticle({
          from: buyer,
          price: web3.toWei(articlePrice, "ether")
        });
      })
      .catch(err => chainListInstance.getArticle())
      .then(data => {
        assert.equal(data[0], 0x0, "article must have no seller");
        assert.equal(data[1], 0x0, "article must have no buyer");
        assert.equal(data[2], "", "article must have no name");
        assert.equal(data[3], "", "article must have no description");
        assert.equal(data[4].toNumber(), 0, "seller must have no price");
      });
  });

  it("buy your own article", function() {
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
      .then(receipt =>
        chainListInstance.buyArticle({
          from: seller,
          value: web3.toWei(articlePrice, "ether")
        })
      )
      .then(receipt => assert.isOK(false, "Exception not thrown"))
      .catch(err => chainListInstance.getArticle())
      .then(data => {
        assert.equal(data[0], seller, "article must have no seller");
        assert.equal(data[1], 0x0, "article must have no buyer");
        assert.equal(data[2], articleName, "article must have no name");
        assert.equal(
          data[3],
          articleDescription,
          "article must have no description"
        );
        assert.equal(
          data[4].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "seller must have no price"
        );
      });
  });

  it("buy an article with an incorrect price", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.buyArticle({
          from: buyer,
          value: web3.toWei(articlePrice + 1, "ether")
        });
      })
      .then(receipt => assert.isOK(false, "Exception not thrown"))
      .catch(err => chainListInstance.getArticle())
      .then(data => {
        assert.equal(data[0], seller, "article must have no seller");
        assert.equal(data[1], 0x0, "article must have no buyer");
        assert.equal(data[2], articleName, "article must have no name");
        assert.equal(
          data[3],
          articleDescription,
          "article must have no description"
        );
        assert.equal(
          data[4].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "seller must have no price"
        );
      });
  });

  it("buy an article that is already sold", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.buyArticle({
          from: buyer,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => {
        return chainListInstance.buyArticle({
          from: buyer,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => assert.isOK(false, "Exception not thrown"))
      .catch(err => chainListInstance.getArticle())
      .then(data => {
        assert.equal(data[0], seller, "article must have no seller");
        assert.equal(data[1], buyer, "article must have no buyer");
        assert.equal(data[2], articleName, "article must have no name");
        assert.equal(
          data[3],
          articleDescription,
          "article must have no description"
        );
        assert.equal(
          data[4].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "seller must have no price"
        );
      });
  });
});
