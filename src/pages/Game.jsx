import "./Game.css"
import { useState, useEffect, useCallback } from "react"
import CardView from "../components/CardSlot"
import { GameState } from "../../core/Game";
import PlayerHealth from "../components/PlayerHealth";
import PlayerCards from "../components/PlayerCards";
import PlayerAvatar from "../components/PlayerAvatar";
import PlayerEffects from "../components/PlayerEffects";
import ActionsView from "../components/ActionsList";
import FullscreenLayout from "../components/FullscreenLayout";
import PlayerWaiting from "../components/PlayerWaiting";
import CardInfo from "../components/CardInfo";
import { useGameSession } from "../io/GameSession";
import GameComplete from "../components/GameComplete";
import DeskSlot from "../components/DeskSlot";

export default function GamePage({ playerInfo, connection, gameId }) {

  const [ actions, setActions ] = useState([]);
  const [ deskDisabled, setDeskDisabled ] = useState([]);
  const [ selectedDeskCard, setSelectedDeskCard ] = useState(undefined);
  const [ selectedHandCard, setSelectedHandCard ] = useState(undefined);
  const [ showCardInfo, setShowCardInfo ] = useState(undefined);

  const gameSession = useGameSession(connection, playerInfo, gameId, {});

  const game = gameSession.game;
  const player = gameSession.player;
  const opponent = gameSession.opponent;
  const hand = gameSession.hand;
  const desk = gameSession.desk;

  useEffect(() => { 
    // Whenever game is updated, we should extract the desk
    // setDesk(game.desk.map(ref => ref === null ? undefined : ref)); 
    setDeskDisabled(game.desk.map(r => false));
  }, [ game.desk ])

  const [ actionsOffset, setActionsOffset ] = useState(0);
  useEffect(() => {
    let newActions = (game.actions ?? [])
      .map((a, id) => { return { id: id + actionsOffset , ...a }});
    setActionsOffset(actionsOffset + newActions.length);
    newActions = actions.concat(newActions);

    if (newActions.length > 6) {
      newActions.splice(0, newActions.length - 6);
    }
  
    console.log(newActions);
    setActions(newActions);
  }, [ game.actions ]);

  useEffect(() => {
    // TODO(vadim): This should be moved to a callback with onDeskCardSelect
    if (selectedDeskCard !== undefined) {
      const card = desk[selectedDeskCard];
      if (card.owner !== player.id) {
        // it is not our card, so the entire hand should be disabled
        // setHandDisabled(true);

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
        setDeskDisabled(deskDisabled.map(v => false));
      }

    } else if (selectedHandCard !== undefined) {

      // Don't allow the player to place more than 3 cards on the desk
      const playerDeskCards = desk.filter(ref => ref?.owner === player.id).length;
      if (playerDeskCards >= 3) {
        setDeskDisabled(deskDisabled.map((v, id) => desk[id] ? false : true))
      } else {
        setDeskDisabled(deskDisabled.map(v => false));
      }

    } else {
      setDeskDisabled(deskDisabled.map(v => false));
    }
  }, [ selectedDeskCard, selectedHandCard ]);

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
        gameSession.moveCardFromDeskToHand(selectedDeskCard, cardId);
        return;
      }

      // Move our card from the hand to another place
      if (selectedHandCard !== undefined) {
        gameSession.moveCardFromHandToHand(selectedHandCard, cardId);
        return;
      }

    }
  }, [ hand, desk, selectedHandCard, selectedDeskCard, connection ]);

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
        gameSession.moveCardFromHandToDesk(selectedHandCard, cardId);
        return;  
      }

      // Move card to the free slot
      if (selectedDeskCard !== undefined) {
       gameSession.moveCardFromDeskToDesk(selectedDeskCard, cardId);
      } 
    }

  }, [ hand, desk, selectedHandCard, selectedDeskCard, connection ]);

  let opponentBadge = undefined;
  let playerBadge = undefined;

  if (game.state === GameState.PLAYER_TURN) {
    if (game.turn.playerId === player.id) {
      playerBadge = <div className='player-badge'>{ game.turn.turns === 1 ? "Вы атакуете" : "Вы защищаетесь"}</div>
    } else {
      opponentBadge = <div className='player-badge'>Ход соперника</div>
    }
  }

  const onInfo = useCallback((card) => setShowCardInfo(card), []);
  const onCloseInfo = useCallback(() => setShowCardInfo(undefined), []);

  let fullscreenLayoutComponent = undefined;
  if (game.state === GameState.WAITING_FOR_PLAYERS) {
    fullscreenLayoutComponent = (<PlayerWaiting />)
  } else if (game.state === GameState.COMPLETE) {
    fullscreenLayoutComponent = (<GameComplete game={ game } player={ player }/>);
  } else if (showCardInfo) {
    fullscreenLayoutComponent = (<CardInfo card={ showCardInfo } onClose={ onCloseInfo }/>)
  } 

  // TODO(vadim): Rename "card-container" to "desk-container"
  // and "desk-container" to "game-container"
  return (
    <div className="desk-container">

      { fullscreenLayoutComponent ? <FullscreenLayout>{ fullscreenLayoutComponent }</FullscreenLayout> : undefined}

      <div className="opponent-container">
        <PlayerCards player={ opponent } />
        <PlayerAvatar player={ opponent }/>
        <PlayerHealth player={ opponent } />
      </div>


      <div className="card-container">
        <div className="event-container">
          <ActionsView actions={ actions } game={ game } />
        </div>

        <div className='center-container'>
          <div className='player-badge-container top'>
            { opponentBadge }
            { game.state === GameState.EXECUTION_TURN ? <PlayerEffects player={opponent} /> : undefined }
          </div>

          <div className="inner-card-container">
            { desk.map((ref, id) => 
              <DeskSlot key={id} 
                owner={ ref ? { 
                  name: game.getPlayer(ref.owner).name, 
                  opponent: game.getPlayer(ref.owner).id !== player.id
                } : undefined }
                >
                <CardView 
                  card={ ref ? game.cards.find(c => c.id === ref.id) : undefined } 
                  enabled={ game.isPlayerTurn(player.id) && !deskDisabled[id] }
                  onClick={ () => onDeskCardClick(id) } 
                  selected={ id === selectedDeskCard } 
                  highlighted={ game.isSlotExecuted(id) }
                  onInfo={ () => onInfo(game.getCard(ref)) }
                />
              </DeskSlot>
              ) 
            }
          </div>

          <div className='player-badge-container bottom'>
            { playerBadge }
            { game.state === GameState.EXECUTION_TURN ? <PlayerEffects player={player} /> : undefined }
          </div>
        </div>

        <div className="turn-button-container">
          {
            game.isPlayerTurn(player.id) ? <button 
              className="end-turn-button" 
              onClick={ gameSession.completeTurn }>
                <i className="bi bi-play-circle-fill"></i></button> : undefined
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
              card={ ref ? game.getCard(ref) : undefined } 
              enabled={ game.isPlayerTurn(player.id) }
              onClick={ () => onHandCardClick(id) }
              onInfo={ () => onInfo(game.getCard(ref)) }
              selected={ id === selectedHandCard }/>)}
        </div>
        <div className="player-deck-container">
          <CardView 
            onClick={ gameSession.pullCard }
            enabled={ game.isPlayerTurn(player.id) }
          />
        </div>
      </div>
    </div>
  )
}
