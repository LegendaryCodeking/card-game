import style from "./GameComplete.module.css";

export default function GameComplete({ game, player }) {
  return (
    <div className={ style.GameComplete }>
      { game.isWinner(player) ? "Вы победили!" : "Вы проиграли" }
    </div>
  )

}