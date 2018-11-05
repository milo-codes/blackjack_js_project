const RequestHelper = require('../helpers/request_helper.js');
const PubSub = require("../helpers/pub_sub.js");

const Game = function () {
  this.newDeckUrl = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6';
  this.requestDeck = new RequestHelper(this.newDeckUrl);
}

Game.prototype.bindEvents = function () {
  //  listen for player Play Again button click --> trigger draw more cards from same deck
};

Game.prototype.getShuffledDeck = function () {
  this.requestDeck.get()
    .then((shuffledDeck) => {
      this.newCardsUrl = `https://deckofcardsapi.com/api/deck/${ shuffledDeck.deck_id }/draw/?count=2`;
      this.deckId = shuffledDeck.deck_id;
      return shuffledDeck.deck_id;
    })
    .then((deckId) => {
      this.dealCards(deckId);
    })
}

Game.prototype.dealCards = function (deckId) {
  const roundObject = {};
  this.requestCards = new RequestHelper(this.newCardsUrl);
  this.requestCards.get()
    .then((drawnCards) => {
      this.convert(drawnCards.cards)
      console.log(drawnCards.cards);
      roundObject.playerCards = drawnCards.cards;
      PubSub.publish("Game:player-cards-ready", roundObject.playerCards);
    })
    .then(() => {
      this.requestCards.get()
        .then((drawnCards) => {
          this.convert(drawnCards.cards)
          roundObject.dealerCards = drawnCards.cards;
          PubSub.publish("Game:dealer-cards-ready", roundObject.dealerCards);
          this.getResult(roundObject);
        });
    })
};

Game.prototype.convert = function (drawnCards) {
  drawnCards.forEach((cardObject) => {
    if ((cardObject.value === "JACK") || (cardObject.value === "QUEEN") || (cardObject.value === "KING")) {
      cardObject.value = "10";
    }
    else if (cardObject.value === "ACE") {
      cardObject.value = "11";
    }
  });
};

Game.prototype.getResult = function (roundObject) {
  playerTotal = 0;
  dealerTotal = 0;
  roundObject.dealerCards.forEach((card) => {
    dealerTotal += Number(card.value)
  });
  roundObject.playerCards.forEach((card) => {
    playerTotal += Number(card.value)
  });
  console.log(dealerTotal);
  console.log(playerTotal);
  // if playerTotal > dealerTotal
  // this.getPlayerTotal();
  // this.getDealerTotal();
  // TODO calc who wins

  whoWon = "";

  if (playerTotal > dealerTotal) {
    whoWon = "You win!";
  }
  else if (dealerTotal > playerTotal) {
    whoWon = "Dealer wins!"
  }
  else {
    whoWon = "It's a draw!"
  }

  PubSub.publish("Game:result-loaded", whoWon);
};

module.exports = Game;
