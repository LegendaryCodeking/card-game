
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

function dealDamage(game, slotId, playerId, damage) {
  game.getOpponent(playerId).health -= damage;
}

export const Cards = [

  new Card({ 
    id: "shield", 
    icon: "shield-shaded", 
    name: "Shield", 
    description: "Blocks all further damage",
    action: ( game, slotId, playerId ) => {
      
    }
  }),

  new Card({ 
    id: "arrow", 
    icon: "heart-arrow", 
    name: "Arrow", 
    description: "Deals 3 damage",
    action: ( game, slotId, playerId ) => {
      game.getOpponent(playerId).health -= 3;
    }
   }),

  new Card({ 
    id: "fireball", 
    icon: "fire", 
    name: "Fireball", 
    description: "Deals 3 damage and destroys any opponent's shields"}),

  new Card({ 
    id: "reverse", 
    icon: "arrow-down-up", 
    name: "Reverse", 
    description: "Changes the owner of the next card" ,
    action: ( game, slotId, playerId ) => {
      
    }
  }),
];