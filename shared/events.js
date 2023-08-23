
export const Events = {

  // Server events
  PARTIAL_UPDATE: "PARTIAL_UPDATE",
  FULL_UPDATE: "FULL_UPATED",
  GAME_IS_FOUND: "GAME_IS_FOUND",
  ERROR: "ERROR",

  // Client events
  JOIN_GAME: "JOIN_GAME",
  FIND_GAME: "FIND_GAME",
  MOVE_CARD_FROM_DESK_TO_HAND: "MOVE_CARD_FROM_DESK_TO_HAND",
  MOVE_CARD_FROM_HAND_TO_DESK: "MOVE_CARD_FROM_HAND_TO_DESK",
  MOVE_CARD_FROM_DESK_TO_DESK: "MOVE_CARD_FROM_DESK_TO_DESK",
  MOVE_CARD_FROM_HAND_TO_HAND: "MOVE_CARD_FROM_HAND_TO_HAND",
  COMPLETE_TURN: "COMPLETE_TURN",
  PULL_CARD: "PULL_CARD",

  /**
   * For ClientConnection and ServerConnection we often need to set event listeners
   * that look something like that "clientConnection.onPartialUpdate(() => ...)".
   * In order to not write manually "onPartialUpdate", "onJoinGame" methods for every possible event
   * we will just generate those methods using this function.
   * 
   * For example:
   *  JOIN_GAME -> onJoinGame
   *  PARTIAL_UPDATE -> onPartialUpdate
   * and etc.
   * 
   * NOTE: There's a small bug. getEventListenerNames will also be used in names generation...
   * 
   * @returns name of methods for event listeners
   */
  getEventListenerNames() {
    const result = []
    for (const event in this) {
      const eventListenerName = "on" + event.split("_")
        .map(s => s.toLowerCase())
        .map(s => s[0].toUpperCase() + s.slice(1, s.length))
        .join("");
      result.push([eventListenerName, event]);
    }
    return result;
  }

}