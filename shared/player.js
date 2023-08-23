
// TODO: Use this
export class PlayerReference {
  id = 0;

  health = 30;
  hand = [];
  pullSize = 0;
  effects = [];
}

export default class Player {
  
  id = 1;
  icon = "emoji-angry";
  name = "player";

  // Game related properties
  health = 30;
  hand = [];
  pullSize = 0;
  effects = [];

  constructor(data) {
    Object.assign(this, data);
  }

  hasEffect(effect) {
    return this.effects.find(e => e.id === effect.id) !== undefined;
  }
}