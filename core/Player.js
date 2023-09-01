
/**
 * Contains game related player information.
 */
export class PlayerInstance {

  id = 0;
  icon = "emoji-angry";
  name = "player";
  health = 50;
  hand = [];
  pullSize = 0;
  effects = [];

  constructor(data) {
    Object.assign(this, data);
  }

  hasEffect(effectId) {
    return this.effects.find(e => e.id === effectId) !== undefined;
  }
}

export default class Player {
  
  id = 1;
  name = "vadim";

  constructor(data) {
    Object.assign(this, data);
  }
}