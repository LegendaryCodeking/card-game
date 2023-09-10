import style from './WaitingPlayersOverlay.module.css'

export default function WaitingPlayersOverlay() {
  return (
    <div className={`${ style.WaitingPlayersOverlay }`}>
      Ожидание другого игрока
    </div>
  )
}