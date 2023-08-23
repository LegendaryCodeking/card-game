import { Action } from "./action.js";
import { EffectReference, Effects } from "./effect.js";

export default class Card {
  id = "shield";
  icon = "shield-shaded";
  name = "";
  description = "";
  action = undefined;

  constructor(data) {
    Object.assign(this, data);
  }
}

export class CardReference {
  constructor(id, owner) {
    this.id = id;
    this.owner = owner;
  }
}

function dealDamage(actions, player, opponent, damage) {
  if (opponent.hasEffect(Effects.HAS_SHIELD)) {
    actions.push(Action.damageBlocked(opponent.id, player.id, damage));
    return;
  };

  actions.push(Action.damage(opponent.id, player.id, damage));
  opponent.health -= damage;
}

export const Cards = [

  new Card({ 
    id: "shield", 
    icon: "shield-shaded", 
    name: "Щит", 
    description: "Создает щит который блокирует весь последующий урон.",
    action: ( actions, game, slotId, player, opponent) => {
      actions.push(Action.effectAdded(player.id, Effects.HAS_SHIELD.id))
      player.effects.push(new EffectReference(Effects.HAS_SHIELD));
    }
  }),

  new Card({ 
    id: "arrow", 
    icon: "heart-arrow", 
    name: "Магическая стрела", 
    description: "Наносит 3 урона сопернику.",
    action: ( actions, game, slotId, player, opponent) => {
      dealDamage( actions, player, opponent, 3);
    }
   }),

  new Card({ 
    id: "fireball", 
    icon: "fire", 
    name: "Огненный шар", 
    description: "Уничтожает один щит соперника. Если щита нет, то наносит 6 урона.",
    action: ( actions, game, slotId, player, opponent ) => {
      const shieldId = opponent.effects.findIndex(e => e.id === Effects.HAS_SHIELD.id);
      if (shieldId >= 0) {
        opponent.effects.splice(shieldId, 1);
        actions.push(Action.effectRemoved(player.id, Effects.HAS_SHIELD.id));
      } else {
        dealDamage(actions, player, opponent, 6);
      }
    }
  }),

  new Card({ 
    id: "reverse", 
    icon: "arrow-down-up", 
    name: "Воровство заклинания", 
    description: "Меняет владельца следующего заклинания. Заклинание соперника станет вашим, а ваше заклинания станет заклинанием соперника." ,
    action: ( actions, game, slotId, player, opponent) => {
      const [ card, id ] = game.getNextDeskCard(slotId);
      if (!card) return;

      card.owner = game.getOpponent(card.owner).id;
      actions.push(Action.changeOwner(card));
    }
  }),

  new Card({
    id: "repeat",
    icon: "arrow-clockwise",
    name: "Магический повтор",
    description: "Повторяет предыдущее заклинание от вашего имени.", 
    action: ( actions, game, slotId, player, opponent) => {
      const [ card, id ] = game.getPrevDeskCard(slotId);
      if (!card) return;
    
      game.getCard(card).action(actions, game, id, player, opponent);
    }
  })
];