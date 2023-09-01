import "./Game.css"
import { useState, useCallback } from "react"
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
import CardDeck from "../components/CardDeck";

export default function GamePage({ playerInfo, connection, gameId }) {

  const [ showCardInfo, setShowCardInfo ] = useState(undefined);

  const gameSession = useGameSession(connection, playerInfo, gameId);

  const game = gameSession.game;
  const player = gameSession.player;
  const opponent = gameSession.opponent;
  const hand = gameSession.hand;
  const desk = gameSession.desk;
  const actions = gameSession.actions;

  let opponentBadge = undefined;
  let playerBadge = undefined;

  if (game.state === GameState.PLAYER_TURN) {
    if (game.isPlayerTurn(player.id)) {
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
                  enabled={ game.isPlayerTurn(player.id) && gameSession.availableDeskSlots[id] }
                  onClick={ () => gameSession.selectDeskSlot(id) } 
                  selected={ id === gameSession.selectedDeskSlot } 
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
              onClick={ () => gameSession.selectHandSlot(id) }
              onInfo={ () => onInfo(game.getCard(ref)) }
              selected={ id === gameSession.selectedHandSlot }/>)}
        </div>
        <div className="player-deck-container">
          <CardDeck 
            onClick={ () => gameSession.pullCard() }
            available={ gameSession.canPullCard }
          />
        </div>
      </div>
    </div>
  )
}
