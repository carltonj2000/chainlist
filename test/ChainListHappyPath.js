const Chainlist = artifacts.require("./ChainList.sol");

contract("ChainList", function(accounts) {
  let chainListInstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const articleName1 = "article 1";
  const articleDescription1 = "Description for artile 1";
  const articlePrice1 = 3;
  const articleName2 = "article 2";
  const articleDescription2 = "Description for artile 2";
  const articlePrice2 = 6;
  let sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  let buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("should be initialized with empty values", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.getNumberOfArticles();
      })
      .then(data => {
        assert.equal(data.toNumber(), 0, "number of articles is zero");
        return chainListInstance.getArticlesForSale();
      })
      .then(data => {
        assert.equal(data.length, 0, "number of articles for sale is zero");
      });
  });

  it("should sell the first article", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.sellArticle(
          articleName1,
          articleDescription1,
          web3.toWei(articlePrice1, "ether"),
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
        assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id must be 1");
        assert.equal(receipt.logs[0].args._seller, seller, "article seller");
        assert.equal(receipt.logs[0].args._name, articleName1, "article name");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice1, "ether"),
          "article price"
        );
        return chainListInstance.getNumberOfArticles();
      })
      .then(noArtcl => {
        assert.equal(noArtcl, 1, "1 article available");
        return chainListInstance.getArticlesForSale();
      })
      .then(saleArtcls => {
        assert.equal(saleArtcls.length, 1, "1 article for sale");
        assert.equal(saleArtcls[0].toNumber(), 1, "article id must be 1");
        return chainListInstance.articles(saleArtcls[0]);
      })
      .then(article => {
        assert.equal(article[0].toNumber(), 1, "id must be 1");
        assert.equal(article[1], seller, "article seller");
        assert.equal(article[2], 0x0, "article seller");
        assert.equal(article[3], articleName1, "article name");
        assert.equal(article[4], articleDescription1, "article description");
        assert.equal(
          article[5].toNumber(),
          web3.toWei(articlePrice1, "ether"),
          "article price"
        );
      });
  });

  it("should sell the second article", function() {
    return Chainlist.deployed()
      .then(instance => {
        chainListInstance = instance;
        return chainListInstance.sellArticle(
          articleName2,
          articleDescription2,
          web3.toWei(articlePrice2, "ether"),
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
        assert.equal(receipt.logs[0].args._id.toNumber(), 2, "id must be 1");
        assert.equal(receipt.logs[0].args._seller, seller, "article seller");
        assert.equal(receipt.logs[0].args._name, articleName2, "article name");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice2, "ether"),
          "article price"
        );
        return chainListInstance.getNumberOfArticles();
      })
      .then(noArtcl => {
        assert.equal(noArtcl, 2, "articles available");
        return chainListInstance.getArticlesForSale();
      })
      .then(saleArtcls => {
        assert.equal(saleArtcls.length, 2, "article for sale");
        assert.equal(saleArtcls[1].toNumber(), 2, "article id must be 2");
        return chainListInstance.articles(saleArtcls[1]);
      })
      .then(article => {
        assert.equal(article[0].toNumber(), 2, "id must be 2");
        assert.equal(article[1], seller, "article seller");
        assert.equal(article[2], 0x0, "article seller");
        assert.equal(article[3], articleName2, "article name");
        assert.equal(article[4], articleDescription2, "article description");
        assert.equal(
          article[5].toNumber(),
          web3.toWei(articlePrice2, "ether"),
          "article price"
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
        return chainListInstance.buyArticle(1, {
          from: buyer,
          value: web3.toWei(articlePrice1, "ether")
        });
      })
      .then(receipt => {
        assert.equal(receipt.logs.length, 1, "1 event should be fired");
        assert.equal(
          receipt.logs[0].event,
          "LogBuyArticle",
          "correct event was fired"
        );
        assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id");
        assert.equal(receipt.logs[0].args._seller, seller, "seller");
        assert.equal(receipt.logs[0].args._buyer, buyer, "buyer");
        assert.equal(receipt.logs[0].args._name, articleName1, "name");
        assert.equal(
          receipt.logs[0].args._price.toNumber(),
          web3.toWei(articlePrice1, "ether"),
          "price"
        );
        sellerBalanceAfterBuy = getBalance(seller);
        buyerBalanceAfterBuy = getBalance(buyer);
        assert.equal(
          sellerBalanceAfterBuy,
          sellerBalanceBeforeBuy + articlePrice1,
          "sell gets payed"
        );
        assert(
          buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1,
          "buyer payed"
        );
        return chainListInstance.getArticlesForSale();
      })
      .then(articlesIds => {
        assert.equal(articlesIds.length, 1, " must have a article for sale");
        assert.equal(
          articlesIds[0].toNumber(),
          2,
          " must have article 1 for sale"
        );
        return chainListInstance.articles(articlesIds[0]);
      })
      .then(article => {
        assert.equal(article[0].toNumber(), 2, "article must have a seller");
        assert.equal(article[1], seller, "article must have a seller");
        assert.equal(article[2], 0x0, "article must have no buyer");
        assert.equal(article[3], articleName2, "article must have a name");
        assert.equal(
          article[4],
          articleDescription2,
          "article must have a description"
        );
        assert.equal(
          article[5].toNumber(),
          web3.toWei(articlePrice2),
          "seller must have a price"
        );
        return chainListInstance.getNumberOfArticles();
      })
      .then(articlesTotal => {
        assert.equal(articlesTotal, 2, " must have same total # of articles");
      });
  });
});
