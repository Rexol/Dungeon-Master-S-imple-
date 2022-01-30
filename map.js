/**
 * This file generates the map
 * You can change constants to generate the map you want
 * Author: Vladimir Surtaev
 * Date: 28.01.2022
 */

const { SewerRat, GiantDragon } = require('./characters');
const { Room } = require('./rooms');

const NUMBER_OF_ROOMS = 5;
const NAMES = ["Dungeon Entrance","Hallway","Chamber","Dead end","Portal"];
const CONNECTIONS = {0: [1], 1: [2], 2:[3, 4]};
const MOBS = {1:[new SewerRat(), new SewerRat()], 2:[new SewerRat()]};

function buildMap(numberOfRooms, names, connections, mobs) {
    let rooms = new Array(numberOfRooms);
    for(let i=0; i < numberOfRooms; i++) {
        if(mobs.hasOwnProperty(i)){
            rooms[i] = new Room(i+1, names[i], mobs[i]);
        } else {
            rooms[i] = new Room(i+1, names[i]);
        }
            // mobs[i].map((mob) => {
            //     rooms[i].addMob(mob);
            // });
    }
    for(let i=0; i < numberOfRooms; i++) {
        if(connections.hasOwnProperty(i))
            connections[i].map((room) => {
                rooms[i].addDoor(rooms[room]);
                rooms[room].addDoor(rooms[i]);
            });
    }
    return rooms[0];
}

let spawn = buildMap(NUMBER_OF_ROOMS, NAMES, CONNECTIONS, MOBS);
spawn.visited = true;

module.exports = { spawn, NUMBER_OF_ROOMS };