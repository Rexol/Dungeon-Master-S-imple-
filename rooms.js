/**
 * This file contains description of the room class
 * Author: Vladimir Surtaev
 * Date: 28.01.2022
 */

class Room {
  constructor(id, name, mobs) {
    this.name = name || 'Coridor';
    this.id = id;

    this.doors = new Array();
    this.parent = null; // Room where player came from.

    this.mobs = mobs || new Array();
    this.mobsPresent = Boolean(this.mobs.length); // Indicates whether mobs were in the room.

    this.visited = false;
    this.explored = false; // Used "Look Around" in that room.
    this.revealed = false; // Mobs attacked before player used "Look Around".
    this.tested = false; // For map testing purpuses.
  }

  addDoor(room) {
    this.doors.push(room);
  }

  addMob(mob) {
    this.mobs.push(mob);
    if (!this.mobsPresent) this.mobsPresent = !this.mobsPresent;
  }

  /**
   * This function removes dead mobs from the room.
   */
  clearMobs() {
    this.mobs = this.mobs.filter((mob) => mob.alive);
  }
}

module.exports = { Room };
