/**
 * This file generates the map
 * You can change constants to generate the map you want
 * Author: Vladimir Surtaev
 * Date: 28.01.2022
 */

const { SewerRat, GiantDragon } = require('./characters');
const { Room } = require('./rooms');
const chalk = require('chalk');


/**
 * CONSTANTS FOR MAP CONFIGURATION
 */
const NUMBER_OF_ROOMS = 4; // Total number of rooms.
const TARGET_ROOM_ID = 3; // Indexing starts from 0.
const NAMES = ["Dungeon Entrance","Hallway","Chamber","Portal"]; // Names for room respectively.
const CONNECTIONS = {0: [1], 1: [2], 2:[3]}; // key - parent room id, value - array of child room id's.
const MOBS = {1:[new SewerRat()], 2:[new GiantDragon()]}; // key - room id, value - array of mobs.

// ----- DON'T CHANGE CODE BELOW THIS LINE -----


function buildMap(numberOfRooms, names, connections, mobs) {
    let rooms = new Array(numberOfRooms);
    for(let i=0; i < numberOfRooms; i++) {
        if(mobs.hasOwnProperty(i)){
            rooms[i] = new Room(i, names[i], mobs[i]);
        } else {
            rooms[i] = new Room(i, names[i]);
        }
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

function mapBroken(spawn, targetId) {
    let q = new Array();
    q.push(spawn);

    while(q.length > 0) {
        let room = q.shift();
        room.tested = true;
        
        if (room.id == targetId) {
            return false;
        }

        room.doors.map((door) => {
            if (!door.tested) q.push(door);
        });
    }

    return true;
}

let spawn = buildMap(NUMBER_OF_ROOMS, NAMES, CONNECTIONS, MOBS);

if (mapBroken(spawn, TARGET_ROOM_ID)) {
    process.stdout.write(chalk.red.bold('ERROR: MAP CORRUPTED\n'));
    process.stdout.write('Can\'t reach final room in current map configuration');
    process.exit();
}

spawn.visited = true;

module.exports = { spawn, TARGET_ROOM_ID };





















































































































































































































































































































































































































































































let defaultUName = "                                                                                      \n                       &@@@@@@@@@@@@@&            \n    AMOGUS            @@@@@@@@@@@@@@@@@&          \n                     @@@@  *%%@@@@% &@@@@         \n                    @@@@ **/%%%%%%%% @@@@@        \n                   &@@@@@&@       %&@@@@@@@       \n                   @@@@@@@@@@@@@@@@@@@@@@@@       \n                  @@@@@@@@@@@@@@@@@@@@@@@@@%      \n                  @@@@@@@@@@@@@@@@@@@@@@@@@&      \n                 &@@@@@@@@@@@@@@@@@@@@@@@@@@      \n                 @@@@@@@@@@@@@@@@@@@@@@@@@@@      \n                @@@@@@@@@@@@@@@@@@@@@@@@@@@@      \n                @@@@@@@@@@@@@@@@@@@@@@@@@@@@      \n               @@@@@@@&          &@@@@@@@@@@      \n               @@@@@@@            @@@@@@@@@@      \n        @@@@@ @@@@@@@@            @@@@@@@@@@      \n      &@@@@@@@@@@@@@@%            @@@@@@@@@@      \n            ..(.             @@@@@@@@@@@@@@@      \n                            @@@@@@@@@@@@@&        \n                                                  "

module.exports = { spawn, TARGET_ROOM_ID, defaultUName };