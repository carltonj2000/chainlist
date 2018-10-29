App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,
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
    if (App.loading) return;
    App.loading = true;

    let chainListInstance;

    App.displayAccountInfo();
    App.contracts.ChainList.deployed()
      .then(function(instance) {
        chainListInstance = instance;
        return chainListInstance.getArticlesForSale();
      })
      .then(function(articleIds) {
        $("#articlesRow").empty();
        for (i = 0; i < articleIds.length; i++) {
          const articleId = articleIds[i];
          chainListInstance
            .articles(articleId.toNumber())
            .then(function(article) {
              App.displayArticle(
                article[0],
                article[1],
                article[3],
                article[4],
                article[5]
              );
            });
        }
      })
      .catch(function(err) {
        console.log("Error", err);
      })
      .then(() => (App.loading = false));
  },

  displayArticle: function(id, seller, name, description, price) {
    const etherPrice = web3.fromWei(price.toNumber(), "ether");
    const articleTemplate = $("#articleTemplate");
    articleTemplate.find(".panel-title").text(name);
    articleTemplate.find(".article-description").text(description);
    articleTemplate.find(".article-price").text(etherPrice);
    articleTemplate.find(".btn-buy").attr("data-value", etherPrice);
    articleTemplate.find(".btn-buy").attr("data-id", id);
    if (seller === App.account) seller = "You";
    articleTemplate.find(".article-seller").text(seller);
    if (seller === "You") articleTemplate.find(".btn-buy").hide();
    else articleTemplate.find(".btn-buy").show();
    $("#articlesRow").append(articleTemplate.html());
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
    const _articleId = parseFloat($(event.target).data("id"));
    App.contracts.ChainList.deployed()
      .then(function(instance) {
        return instance.buyArticle(_articleId, {
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
