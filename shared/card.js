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

export class CardReference {
  constructor(id, owner) {
    this.id = id;
    this.owner = owner;
  }
}

function dealDamage(actions, game, playerId, damage) {
  const opponent = game.getOpponent(playerId);
  actions.push(Action.damage(opponent.id, playerId, damage));
  opponent.health -= damage;
}

export const Cards = [

  new Card({ 
    id: "shield", 
    icon: "shield-shaded", 
    name: "Shield", 
    description: "Создает щит который блокирует весь последующий урон.",
    action: ( actions, game, slotId, playerId ) => {
      actions.push(Action.effectAdded(playerId, Effect.HAS_SHIELD))
      game.getPlayer(playerId).effects.push(Effect.HAS_SHIELD);
    }
  }),

  new Card({ 
    id: "arrow", 
    icon: "heart-arrow", 
    name: "Arrow", 
    description: "Наносит 3 урона сопернику.",
    action: ( actions, game, slotId, playerId ) => {
      dealDamage( actions, game, slotId, playerId, 3);
    }
   }),

  new Card({ 
    id: "fireball", 
    icon: "fire", 
    name: "Fireball", 
    description: "Уничтожает один щит соперника. Если щита нет, то наносит 6 урона.",
    action: ( actions, game, slotId, playerId ) => {
      const opponent = game.getOpponent(playerId);
      
      const shieldId = opponent.effects.findIndex(e => e === Effect.HAS_SHIELD);
      opponent.effects = opponent.effects.splice(shieldId, 1);

      actions.push(Action.effectRemoved(playerId, Effect.HAS_SHIELD));
    }
  }),

  new Card({ 
    id: "reverse", 
    icon: "arrow-down-up", 
    name: "Reverse", 
    description: "Меняет владельца следующего заклинания. Заклинание соперника станет вашим, а ваше заклинания станет заклинанием соперника." ,
    action: ( actions, game, slotId, playerId ) => {
      if ((slotId + 1) >= game.desk.length) return;
      const cardRef = game.desk[slotId + 1];
      if (!cardRef) return;

      cardRef.owner = game.getOpponent(cardRef.owner);
      actions.push(Action.changeOwner(slotId + 1));
    }
  }),
];