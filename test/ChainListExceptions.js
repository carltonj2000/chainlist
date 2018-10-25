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
        return chainListInstance.buyArticle(1, {
          from: buyer,
          price: web3.toWei(articlePrice, "ether")
        });
      })
      .then(() => assert.isOK(false, "did not see the exception"))
      .catch(err => chainListInstance.getNumberOfArticles())
      .then(data => {
        assert.equal(data, 0, "no articles in store");
      });
  });

  it("buy an article that does not exist", function() {
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
        return chainListInstance.buyArticle(2, {
          from: buyer,
          price: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => assert.isOK(false, "did not see the exception"))
      .catch(err => chainListInstance.articles(1))
      .then(article => {
        assert.equal(article[0].toNumber(), 1, "id must be 1");
        assert.equal(article[1], seller, "article seller");
        assert.equal(article[2], 0x0, "article seller");
        assert.equal(article[3], articleName, "article name");
        assert.equal(article[4], articleDescription, "article description");
        assert.equal(
          article[5].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "article price"
        );
      });
  });

  it("buy your own article", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.buyArticle({
          from: seller,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => assert.isOK(false, "Exception not thrown"))
      .catch(err => chainListInstance.articles(1))
      .then(data => {
        assert.equal(data[0], 1, "article must an ID");
        assert.equal(data[1], seller, "article must have no seller");
        assert.equal(data[2], 0x0, "article must have no buyer");
        assert.equal(data[3], articleName, "article must have no name");
        assert.equal(
          data[4],
          articleDescription,
          "article must have no description"
        );
        assert.equal(
          data[5].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "seller must have no price"
        );
      });
  });

  it("buy an article with an incorrect price", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.buyArticle(1, {
          from: buyer,
          value: web3.toWei(articlePrice + 1, "ether")
        });
      })
      .then(receipt => assert.isOK(false, "Exception not thrown"))
      .catch(err => chainListInstance.articles(1))
      .then(data => {
        assert.equal(data[0].toNumber(), 1, "article must have no seller");
        assert.equal(data[1], seller, "article must have no seller");
        assert.equal(data[2], 0x0, "article must have no buyer");
        assert.equal(data[3], articleName, "article must have no name");
        assert.equal(
          data[4],
          articleDescription,
          "article must have no description"
        );
        assert.equal(
          data[5].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "seller must have no price"
        );
      });
  });

  it("buy an article that is already sold", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.buyArticle(1, {
          from: buyer,
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => {
        return chainListInstance.buyArticle(1, {
          from: web3.eth.accounts[3],
          value: web3.toWei(articlePrice, "ether")
        });
      })
      .then(receipt => assert.isOK(false, "Exception not thrown"))
      .catch(err => chainListInstance.articles(1))
      .then(data => {
        assert.equal(data[0].toNumber(), 1, "article id");
        assert.equal(data[1], seller, "article must have no seller");
        assert.equal(data[2], buyer, "article must have no buyer");
        assert.equal(data[3], articleName, "article must have no name");
        assert.equal(
          data[4],
          articleDescription,
          "article must have no description"
        );
        assert.equal(
          data[5].toNumber(),
          web3.toWei(articlePrice, "ether"),
          "seller must have no price"
        );
      });
  });
});
