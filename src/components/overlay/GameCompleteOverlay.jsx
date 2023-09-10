import style from "./GameCompleteOverlay.module.css";

export default function GameCompleteOverlay({ game, player }) {
  return (
    <div className={ style.GameCompleteOverlay }>
      { game.isWinner(player) ? "Вы победили!" : "Вы проиграли" }
    </div>
  )

}