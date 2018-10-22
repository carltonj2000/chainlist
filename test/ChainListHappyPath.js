const Chainlist = artifacts.require("./ChainList.sol");

contract("ChainList", function(accounts) {
  let chainListInstance;
  const seller = accounts[1];
  const articleName = "article 1";
  const articleDescription = "Description for artile 1";
  const articlePrice = 10;

  it("should be initialized with empty values", function() {
    return Chainlist.deployed()
      .then(instance => instance.getArticle())
      .then(data => {
        assert.equal(data[0], 0x0, "article must have no seller");
        assert.equal(data[1], "", "article must have no name");
        assert.equal(data[2], "", "article must have no description");
        assert.equal(data[3].toNumber(), 0, "seller must have no price");
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
        assert.equal(article[1], articleName, "article must have a name");
        assert.equal(
          article[2],
          articleDescription,
          "article must have a description"
        );
        assert.equal(
          article[3].toNumber(),
          web3.toWei(articlePrice),
          "seller must have a price"
        );
      });
  });
});
