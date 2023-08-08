import { useState } from "react"
import Card from "@/components/card"
import CardState from "@/data/card-state";
import PlayerState from "@/data/player-state";
import PlayerStatus from "@/components/playerStatus";

export default function Home() {

  // TODO: Rename "cards" to "desk"
  // TODO: Rename "enemy" to "opponent"
  let [ cards, setCards ] = useState([new CardState(), undefined, undefined, new CardState(), undefined, undefined]);
  let [ hand, setHand ] = useState([new CardState({icon: "fire"}), new CardState({icon: 'arrow-repeat'}), new CardState({ icon: 'heart-arrow'}), undefined, undefined, undefined]);
  let [ enemyPlayer, setEnemyPlayer ] = useState(new PlayerState());
  let [ player, setPlayer ] = useState(new PlayerState());

  let [ selectedCardId, setSelectedCardId ] = useState(undefined);
  let [ selectedHandCardId, setSelectedHandCardId ] = useState(undefined);

  function onHandCardClick(cardId) {
    // select the current card from the hand
    if (hand[cardId] !== undefined) {
      setSelectedHandCardId(cardId);
      setSelectedCardId(undefined);
    } else {

      if (selectedCardId !== undefined && cards[selectedCardId].owner === 'player') {
        const selectedCard = cards[selectedCardId];
        setCards(cards.map((v, id) => id === selectedCardId ? undefined : v));
        setHand(hand.map((v, id) => id === cardId ? selectedCard : v));
      }

    }
  }

  function takeNewCard() {
    const index = hand.findIndex(card => card === undefined);
    if (index >= 0) {
      setHand(hand.map((v, id) => id === index ? new CardState() : v));
    }
  }

  function onCardClick(cardId) {
    let isCardSlotFree = cards[cardId] === undefined;
    let isCardSlotOccupied = cards[cardId] !== undefined;

    if (cardId === selectedCardId) {
      setSelectedCardId(undefined);
      return;
    }

    // Select the current card from the desk
    if (selectedCardId === undefined && isCardSlotOccupied) {
      setSelectedCardId(cardId);
      setSelectedHandCardId(undefined);
      return;
    }

    if (selectedCardId !== undefined) {
      // Move card to the free slot
      if (isCardSlotFree) {
        let selectedCard = cards[selectedCardId];
        setCards(cards
          .map((v, id) => id === selectedCardId? undefined : v)
          .map((v, id) => id === cardId ? selectedCard: v));
        setSelectedCardId(undefined);
      } else {
        // Select other card
        setSelectedCardId(cardId);
      }
    }

    // Move card from the hand to the desk
    if (selectedHandCardId !== undefined && cards[cardId] === undefined) {
      let selectedCard = hand[selectedHandCardId];
      selectedCard.owner = "player";
      setCards(cards.map((v, id) => id === cardId ? selectedCard : v));
      setHand(hand.map((v, id) => id === selectedHandCardId ? undefined : v ));
      setSelectedHandCardId(undefined);
    }
  }

  const deckCardOwnerOpponent = <div className='deck-card-owner-opponent'>{ enemyPlayer.name }</div>
  const deckCardOwnerPlayer = <div className='deck-card-owner-player'>{ player.name }</div>

  // TODO: Rename "card-container" to "desk-container"
  // and "desk-container" to "game-container"
  return (
    <div className="desk-container">
      <div className="opponent-container">
        <PlayerStatus player={ enemyPlayer } />
      </div>
      <div>opponent status</div>
      <div className="card-container">
        <div className="inner-card-container">
          { cards.map((v, id) => 
            <div className="deck-card-container" key={id}>
              <div className="deck-card-owner">{ v && v.owner === 'opponent' ? deckCardOwnerOpponent : '' }</div>
              <Card 
                card={v} 
                onClick={ () => onCardClick(id) } 
                selected={ id === selectedCardId } />
              <div className="deck-card-owner">{ v && v.owner === "player" ? deckCardOwnerPlayer : '' }</div>
            </div>
            ) 
          }
        </div>
      </div>
      <div>another status</div>
      <div className="player-container">
        <div className="player-status-container">
          <PlayerStatus player={ player }/>
        </div>
        <div className="card-container">
          { hand.map((v, id) => 
            <Card 
              key={id} 
              card={v} 
              onClick={() => onHandCardClick(id) }
              selected={ id === selectedHandCardId }/>)}
        </div>
        <div className="player-deck-container">
          <Card onClick={ takeNewCard }/>
        </div>
      </div>
    </div>
  )
}
