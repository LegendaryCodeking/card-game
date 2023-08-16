import { Action } from "./action.js";
import { Effect } from "./effect.js";

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

// Rename to "CardInstance"
export class CardReference {
  constructor(id, owner) {
    this.id = id;
    this.owner = owner;
  }
}

function dealDamage(actions, player, opponent, damage) {
  actions.push(Action.damage(opponent.id, player.id, damage));
  opponent.health -= damage;
}

export const Cards = [

  new Card({ 
    id: "shield", 
    icon: "shield-shaded", 
    name: "Shield", 
    description: "Создает щит который блокирует весь последующий урон.",
    action: ( actions, game, slotId, player, opponent) => {
      actions.push(Action.effectAdded(player.id, Effect.HAS_SHIELD))
      player.effects.push(Effect.HAS_SHIELD);
    }
  }),

  new Card({ 
    id: "arrow", 
    icon: "heart-arrow", 
    name: "Arrow", 
    description: "Наносит 3 урона сопернику.",
    action: ( actions, game, slotId, player, opponent) => {
      dealDamage( actions, opponent, 3);
    }
   }),

  new Card({ 
    id: "fireball", 
    icon: "fire", 
    name: "Fireball", 
    description: "Уничтожает один щит соперника. Если щита нет, то наносит 6 урона.",
    action: ( actions, game, slotId, player, opponent ) => {
      const shieldId = opponent.effects.findIndex(e => e === Effect.HAS_SHIELD);
      opponent.effects = opponent.effects.splice(shieldId, 1);

      actions.push(Action.effectRemoved(player.id, Effect.HAS_SHIELD));
    }
  }),

  new Card({ 
    id: "reverse", 
    icon: "arrow-down-up", 
    name: "Reverse", 
    description: "Меняет владельца следующего заклинания. Заклинание соперника станет вашим, а ваше заклинания станет заклинанием соперника." ,
    action: ( actions, game, slotId, player, opponent) => {
      if ((slotId + 1) >= game.desk.length) return;
      const cardRef = game.desk[slotId + 1];
      if (!cardRef) return;

      cardRef.owner = game.getOpponent(cardRef.owner);
      actions.push(Action.changeOwner(slotId + 1));
    }
  }),
];