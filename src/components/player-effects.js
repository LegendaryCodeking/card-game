import { Effects } from "../../shared/effect";
import "./player-effects.css"

export default function PlayerEffects({ player }) {
  return (
    <div className='player-effects-container'>
      { player.effects
        ?.map(e => e.id === Effects.HAS_SHIELD.id ? (
          <div className="player-effect"><i class="bi bi-shield-shaded"></i></div>) : e)
      }
    </div>
  );
}