import { ActionType } from "../../shared/action";
import { Effects } from "../../shared/effect";
import "./actions-view.css"

export default function ActionsView({ actions, game }) {

  function getAction(action, id) {
    const players = game.players;
    const opponent = players.find(p => p.id === action.target);

    if (!opponent) return undefined;

    if (action.type === ActionType.DAMAGE) {
      return (
        <div key={id} className="action danger">
          <div><i class="bi bi-heartbreak"></i></div>
          <div><b>{ opponent.name }</b> { action.damage } урона</div>
        </div>
      );
    }

    if (action.type === ActionType.CHANGE_OWNER) {
      return (
        <div key={id} className="action">
          <div><i class="bi bi-arrow-down-up"></i></div>
          <div>Следующее заклинение сменило владельца</div>
        </div>
      )
    }

    if (action.type === ActionType.DAMAGE_BLOCKED) {
      return (
        <div key={id} className="action danger">
          <div><i class="bi bi-shield"></i></div>
          <div><b>{ opponent.name }</b> блокирует { action.damage } урона</div>
        </div>
      );
    }

    if (action.type === ActionType.EFFECT_ADDED) {
      const effectName = Effects.getEffectById(action.effectId).name;
      return (
        <div key={id} className="action danger">
          <div><i class="bi bi-plus-circle"></i></div>
          <div><b>{ opponent.name }</b> получает "{ effectName }"</div>
        </div>
      )
    }

    if (action.type === ActionType.EFFECT_REMOVED) {
      const effectName = Effects.getEffectById(action.effectId).name;
      return (
        <div key={id} className="action danger">
          <div><i class="bi bi-plus-circle"></i></div>
          <div><b>{ opponent.name }</b> теряет "{ effectName }"</div>
        </div>
      )
    }

    return undefined;
  }
  
  return (
    <div className="actions-container">
      { actions.map((a, id) => getAction(a, id)) }
    </div>
  );
}