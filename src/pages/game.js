import { useState, useEffect, useCallback } from "react"
import CardView from "@/components/card-view"
import Player from "../../shared/player";
import Game, { GameState } from "../../shared/game";
import "./game.css"
import PlayerHealth from "@/components/player-health";
import PlayerCards from "@/components/player-cards";
import PlayerAvatar from "@/components/player-avatar";

export default function GamePage({ player, setPlayer, connection, gameId }) {

  const [ game, setGame ] = useState(new Game());
  const [ opponent, setOpponent ] = useState(new Player());

  const [ desk, setDesk ] = useState([]);
  const [ hand, setHand ] = useState([]);

  const [ deskDisabled, setDeskDisabled ] = useState([]);
  const [ handDisabled, setHandDisabled ] = useState(false)

  const [ selectedDeskCard, setSelectedDeskCard ] = useState(undefined);
  const [ selectedHandCard, setSelectedHandCard ] = useState(undefined);

  useEffect(() => {
    connection.sendJoinGame(gameId, player);

    connection.onFullUpdate(response => {
      console.log("SC -> Full update")
      setGame((game) => game.update(response.data));
    });

    connection.onPartialUpdate(response => {
      console.log("SC -> Partial update");
      setGame((game) => game.update(response.data));
    });

    connection.onError(response => {
      console.error(`SC -> ${ response.data }`);
    });

    return () => {
      // TODO(vadim): Remove listeners
    }
  }, [])

  useEffect(() => {
    // Whenever the game is updated, we should updated players
    const updatedPlayer = game.getPlayer(player.id) ?? player;
    setPlayer(updatedPlayer);
    setOpponent(game.players.find(p => p.id !== player.id) ?? opponent);
    setHand(updatedPlayer.hand.map(ref => ref === null ? undefined : ref));
  }, [ game.players ]);

  useEffect(() => { 
    // Whenever game is updated, we should extract the desk
    setDesk(game.desk.map(ref => ref === null ? undefined : ref)); 
    setDeskDisabled(game.desk.map(r => false));
  }, [ game.desk ])

  useEffect(() => {
    if (selectedDeskCard) {
      const card = desk[selectedDeskCard];
      if (card.owner !== player.id) {
        // it is not our card, so the entire hand should be disabled
        setHandDisabled(true);

        let nextClosestPlayerCard = desk.length;
        for (let i = selectedDeskCard + 1; i < desk.length; i++) {
          if (desk[i] && desk[i].owner === opponent.id) {
            nextClosestPlayerCard = i;
            break;
          }
        }

        let prevClosestPlayerCard = 0;
        for (let i = selectedDeskCard - 1; i >= 0; i--) {
          if (desk[i] && desk[i].owner === opponent.id) {
            prevClosestPlayerCard = i;
            break;
          }
        }

        setDeskDisabled(deskDisabled
          .map((v, id) => id < prevClosestPlayerCard ? true : false)
          .map((v, id) => id > nextClosestPlayerCard ? true : v ));
      } else {
      }

    } else {
      setDeskDisabled(deskDisabled.map(v => false));
    }
  }, [ selectedDeskCard ]);

  const onHandCardClick = useCallback(cardId => {
    // Unselect the current card in the hand
    if (cardId === selectedHandCard) {
      setSelectedHandCard(undefined);
      return;
    }

    // Select the current card from the hand
    if (hand[cardId] !== undefined) {
      setSelectedHandCard(cardId);
      setSelectedDeskCard(undefined);
    } else {
      
      // Move our card from the desk to the hand
      if (selectedDeskCard !== undefined && desk[selectedDeskCard].owner === player.id) {
        const cardFromDesk = desk[selectedDeskCard];
        setDesk(desk.map((c, id) => id === selectedDeskCard ? undefined : c));
        setHand(hand.map((c, id) => id === cardId ? cardFromDesk : c));
        connection.moveCardFromDeskToHand(selectedDeskCard, cardId);
        setSelectedHandCard(undefined);
        setSelectedDeskCard(undefined);
        return;
      }

      // Move our card from the hand to another place
      if (selectedHandCard !== undefined) {
        const cardFromHand = hand[selectedHandCard];
        setHand(hand
          .map((c, id) => id === cardId ? cardFromHand : c)
          .map((c, id) => id === selectedHandCard ? undefined : c));
        connection.moveCardFromHandToHand(selectedHandCard, cardId);
        setSelectedDeskCard(undefined);
        setSelectedHandCard(undefined);
      }

    }
  }, [ hand, desk, selectedHandCard, selectedDeskCard, connection ]);

  const onCardPull = useCallback(() => {
    // TODO: connection.pullCard();
  }, []);

  const onDeskCardClick = useCallback(cardId => {
    // Unselect the current card on the desk
    if (cardId === selectedDeskCard) {
      setSelectedDeskCard(undefined);
      return;
    }

    // Select the current card from the desk
    if (desk[cardId]) {
      setSelectedDeskCard(cardId);
      setSelectedHandCard(undefined);
      return;
    } else {

      // Move our card from the hand to the desk
      if (selectedHandCard !== undefined) {
        const cardFromHand = hand[selectedHandCard];
        setDesk(desk.map((c, id) => id === cardId ? cardFromHand : c ));
        setHand(hand.map((c, id) => id === selectedHandCard ? undefined : c ));
        connection.moveCardFromHandToDesk(selectedHandCard, cardId);
        setSelectedHandCard(undefined);
        setSelectedDeskCard(undefined);
        return;
      }

      // Move card to the free slot
      if (selectedDeskCard !== undefined) {
        const cardFromDesk = desk[selectedDeskCard];
        setDesk(desk
          .map((c, id) => id === selectedDeskCard ? undefined : c)
          .map((c, id) => id === cardId ? cardFromDesk: c));
        connection.moveCardFromDeskToDesk(selectedDeskCard, cardId);
        setSelectedDeskCard(undefined);
        setSelectedHandCard(undefined);
      } 
    }

  }, [ hand, desk, selectedHandCard, selectedDeskCard, connection ]);

  const onCompleteTurn = useCallback(() => {
    connection.sendCompleteTurn();
  }, []);

  const deckCardOwnerOpponent = <div className='deck-card-owner-opponent'>{ opponent.name }</div>
  const deckCardOwnerPlayer = <div className='deck-card-owner-player'>{ player.name }</div>

  let opponentBadge = undefined;
  let playerBadge = undefined;

  if (game.state === GameState.PLAYER_TURN) {
    if (game.turnPlayerId === player.id) {
      playerBadge = <div className='player-badge'>Ваш ход</div>
    } else {
      opponentBadge = <div className='player-badge'>Ход соперника</div>
    }
  }

  // TODO: Rename "card-container" to "desk-container"
  // and "desk-container" to "game-container"
  return (
    <div className="desk-container">
      <div className="opponent-container">
        <PlayerCards player={ opponent } />
        <PlayerAvatar player={ player }/>
        <PlayerHealth player={ opponent } />
      </div>


      <div className="card-container">
        <div className="event-container">werew</div>

        <div className='center-container'>
          <div className='player-badge-container top'>
            { opponentBadge }
          </div>

          <div className="inner-card-container">
            { desk.map((ref, id) => 
              <div className="deck-card-container" key={id}>
                <div className="deck-card-owner">{ ref && ref.owner === opponent.id ? deckCardOwnerOpponent : '' }</div>
                <CardView 
                  card={ ref ? game.cards.find(c => c.id === ref.id) : undefined } 
                  enabled={ game.isPlayerTurn(player) && !deskDisabled[id] }
                  onClick={ () => onDeskCardClick(id) } 
                  selected={ id === selectedDeskCard } 
                  highlighted={ game.state === GameState.EXECUTION_TURN && game.executionTurnState.currentSlotId === id }
                  />
                <div className="deck-card-owner">{ ref && ref.owner === player.id ? deckCardOwnerPlayer : '' }</div>
              </div>
              ) 
            }
          </div>

          <div className='player-badge-container bottom'>
            { playerBadge }
          </div>
        </div>

        <div className="turn-button-container">
          {
            game.isPlayerTurn(player) ? <button className="end-turn-button" onClick={ onCompleteTurn }><i className="bi bi-play-circle-fill"></i></button> : undefined
          }
        </div>

      </div>


      <div className="player-container">
        <div className="player-status-container">
          <PlayerAvatar player={ player }/>
          <PlayerHealth player={ player }/>
        </div>
        <div className="card-container">
          { hand.map((ref, id) => 
            <CardView 
              key={id} 
              card={ ref ? game.cards.find(c => c.id === ref.id) : undefined } 
              enabled={ game.isPlayerTurn(player) }
              onClick={() => onHandCardClick(id) }
              selected={ id === selectedHandCard }/>)}
        </div>
        <div className="player-deck-container">
          <CardView 
            onClick={ onCardPull }
            enabled={ game.isPlayerTurn(player) }
          />
        </div>
      </div>
    </div>
  )
}
