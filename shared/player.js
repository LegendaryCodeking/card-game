
// TODO: Add "PlayerInstance" class that will contain
// game specific state for the player

export default class Player {
  
  // General properties
  id = 1;
  icon = "emoji-angry";
  name = "player";

  // Game related properties
  health = 30;
  hand = []; // Cards ids
  pullSize = 0;

  effects = [];

  constructor(data) {
    Object.assign(this, data);
  }
}