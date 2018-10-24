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
      App.listenToEvents();
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
        const price = web3.fromWei(article[4].toNumber(), "ether");
        const articleTemplate = $("#articleTemplate");
        articleTemplate.find(".panel-title").text(article[2]);
        articleTemplate.find(".article-description").text(article[3]);
        articleTemplate.find(".article-price").text(price);
        articleTemplate.find(".btn-buy").attr("data-value", price);
        let seller = article[0];
        if (seller === App.account) seller = "You";
        articleTemplate.find(".article-seller").text(seller);
        let buyer = article[1];
        if (buyer == App.account) buyer = "You";
        if (buyer == 0x0) buyer = "No one yet";
        articleTemplate.find(".article-buyer").text(buyer);
        if (article[0] == App.account || article[1] != 0x0)
          articleTemplate.find(".btn-buy").hide();
        else articleTemplate.find(".btn-buy").show();
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
      .catch(function(e) {
        console.log(e);
      });
  },

  buyArticle: function() {
    event.preventDefault();
    const _price = parseFloat($(event.target).data("value"));
    console.log(_price);
    App.contracts.ChainList.deployed()
      .then(function(instance) {
        return instance.buyArticle({
          from: App.account,
          value: web3.toWei(_price, "ether"),
          gas: 500000
        });
      })
      .catch(function(e) {
        console.log(e);
      });
  },

  listenToEvents: function() {
    App.contracts.ChainList.deployed().then(function(instance) {
      instance.LogSellArticle({}, {}).watch(function(err, event) {
        if (!err) {
          $("#events").append(
            '<li class="list-group-item">' +
              event.args._name +
              " is now for sale.</li>"
          );
        } else console.log(error);
        App.reloadArticles();
      });
      instance.LogBuyArticle({}, {}).watch(function(err, event) {
        if (!err) {
          $("#events").append(
            '<li class="list-group-item">' +
              event.args._buyer +
              " bought " +
              event.args._name +
              "</li>"
          );
        } else console.log(error);
        App.reloadArticles();
      });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
