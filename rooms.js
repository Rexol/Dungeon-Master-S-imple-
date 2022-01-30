/**
 * This file contains description of the room class
 * Author: Vladimir Surtaev
 * Date: 28.01.2022
 */
class Room {
    constructor(id, name, mobs) {
        this.name = name;
        this.id = id;

        this.doors = new Array();
        this.parent = null; // room where player came from and where he can return back

        this.mobs = mobs || new Array();
        this.mobsPresent = this.mobs.length > 0;
        
        this.visited = false;
        this.explored = false;
        this.revealed = false;
    }
    
    addDoor (room) {
        this.doors.push(room);
        if (!this.mobsPresent) this.mobsPresent = !this.mobsPresent; 
    }

    addMob (mob) {
        this.mobs.push(mob);
    }

    clearMobs() {
        this.mobs = this.mobs.filter((mob) => mob.alive);
    }
}

module.exports = { Room };