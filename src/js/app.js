App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);
    App.displayAccountInfo();
    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#account").text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if (err === null) {
            $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
          }
        });
      }
    });
  },

  initContract: function() {
    $.getJSON("ChainList.json", function(chainListArtifact) {
      App.contracts.ChainList = TruffleContract(chainListArtifact);
      App.contracts.ChainList.setProvider(App.web3Provider);
      return App.reloadArticles();
    });
  },

  reloadArticles: function() {
    App.displayAccountInfo();
    $("#articlesRow").empty();
    App.contracts.ChainList.deployed()
      .then(function(instance) {
        return instance.getArticle();
      })
      .then(function(article) {
        if (article[0] == 0x0) return;
        const articleTemplate = $("#articleTemplate");
        articleTemplate.find(".panel-title").text(article[1]);
        articleTemplate.find(".article-description").text(article[2]);
        articleTemplate
          .find(".article-price")
          .text(web3.fromWei(article[3].toNumber(), "ether"));
        let seller = article[0];
        if (seller === App.account) seller = "You";
        articleTemplate.find(".article-seller").text(seller);
        $("#articlesRow").append(articleTemplate.html());
      })
      .catch(function(err) {
        console.log("Error", err);
      });
  },

  sellArticle: function() {
    const _name = $("#article_name").val();
    const _description = $("#article_description").val();
    const _price = web3.toWei(
      parseFloat($("#article_price").val() || 0),
      "ether"
    );
    if (_name.trim() === "" || _price === 0) return false;
    App.contracts.ChainList.deployed()
      .then(function(instance) {
        return instance.sellArticle(_name, _description, _price, {
          from: App.account,
          gas: 500000
        });
      })
      .then(function(result) {
        App.reloadArticles();
      })
      .catch(function(e) {
        console.log(e);
      });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
