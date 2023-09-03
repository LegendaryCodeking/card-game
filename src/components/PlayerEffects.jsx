import { Effects } from "../../core/effect";
import "./PlayerEffects.css"

// TODO(vadim): Use CSS modules
export default function PlayerEffects({ player }) {
  return (
    <div className='player-effects-container'>
      { player.effects
        ?.map((e, id) => e.id === Effects.HAS_SHIELD.id ? (
          <div className="player-effect" key={ id }><i class="bi bi-shield-shaded"></i></div>) : e)
      }
    </div>
  );
}