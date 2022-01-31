/**
 * This file contains game managment object
 * Author: Vladimir Surtaev
 * date: 28.01.2022
 *
 * TODO: add comments 
 *
 * TODO_DONE: cancel separate function
 * TODO_DONE: Cannot change the room if there are enemies
 * TODO_DONE: room full of corps
 * TODO_DONE: add cancel button
 * TODO_DONE: mark visited rooms
 * TODO_DONE: add stat view with name
 * TODO_DONE: add test for map
 * TODO_DONE50%: formating
 */

const chalk = require("chalk");
const prompts = require("prompts");
const { Player, Mob } = require("./characters");
const { Room } = require("./rooms");

class Game {
  constructor(username, map, targetRoomId) {
    this.target = targetRoomId;
    this.user = new Player(map, username);
  }

  /**
   * Function shows information about user's character:
   * name, hp, strenght, attack chance and kills statistics.
   */
  async stats() {
    process.stdout.write(
      chalk.underline.bold.blue(`Name: ${this.user.name}\n`)
    );
    process.stdout.write(`${chalk.red.underline.bold(this.user.hp + " hp")}  `);
    process.stdout.write(
      `${chalk.yellow.underline(this.user.dp + " damage")}  `
    );
    process.stdout.write(`${chalk.cyan.underline(this.user.ac + " chance")}\n`);

    process.stdout.write(chalk.underline.bold.red("kills:\n"));
    let flag = true;
    for (let k in this.user.kills) {
      flag = false;
      process.stdout.write(`  ${chalk.underline(k)} : ${this.user.kills[k]}\n`);
    }
    if (flag) {
      process.stdout.write("  No kills made yet\n");
    } else {
      process.stdout.write("  " + chalk.red.bold("HOW DARE YOU\n"));
    }
  }

  /**
   * This function changes the room of the user's character
   * Can't go to new room if:
   *      have not looked around (can't see new options)
   *      there are alive enemies in the room (blocking the way to unexplored rooms)
   *
   * @returns boolean : true if room was successfully changed, false otherwise
   */
  async changeRoom() {
    let initialRoomChoices = this.roomChoices(this.user.room);
    if (!initialRoomChoices.length) {
      return;
    }

    const response = await prompts({
      type: "select",
      name: "value",
      message: "Choose destination:",
      choices: initialRoomChoices,
    });

    if (response.value == "cancel" || !(response.value instanceof Room)) {
      this.cancel();
      return false;
    }

    if (!response.value.visited && this.user.room.mobs.length > 0) {
      process.stdout.write(
        `  There is a ${this.user.room.mobs[0].name} on your way\n`
      );
      process.stdout.write(`  You can't go to the new rooms\n`);
      return false;
    }

    response.value.parent = this.user.room;

    this.user.changeRoom(response.value);
    this.user.room.visited = true;

    process.stdout.write(`You've moved to the ${this.user.room.name}\n`);
    this.checkTarget();
    return true;
  }

  /**
   * Support function for this.changeRoom()
   * Generates choices for prompts.
   *
   * @param {Room} room
   * @returns {Array} : array[i] = { title: {string}, value: {Room} }
   */
  roomChoices(room) {
    let initialRoomChoices = new Array();
    if (room.explored) {
      initialRoomChoices = room.doors.map((door) => ({
        title: door.visited
          ? chalk.hex("#ffa500")(door.name)
          : chalk.green(door.name + " (new)"),
        value: door,
      }));
    } else if (!room.parent) {
      process.stdout.write("You can't see any doors - try to look around\n");
      return [];
    } else {
      initialRoomChoices = [
        {
          title: `Return to the ${room.parent.name}`,
          value: room.parent,
        },
      ];
    }
    initialRoomChoices = initialRoomChoices.concat([
      { title: chalk.red("Cancel"), value: "cancel" },
    ]);

    return initialRoomChoices;
  }

  /**
   * Prints out the information about the room and opens new -
   * options in Go to ... menu and Attack menu if mobs was not revealed before.
   *
   * User attacked by mobs after the look around.
   */
  async lookAround() {
    process.stdout.write(`You are inside a ${this.user.room.name}\n`);

    // Information about doors to other rooms.
    this.doorsInfo(this.user.room);

    process.stdout.write("\n");

    // Information about enemies in the room.
    this.enemiesInfo(this.user.room);

    this.user.room.explored = true;
    this.mobsAttacks();
  }

  /**
   * Support function for this.lookAround()
   * Prints out information about the doors to other rooms.
   *
   * @param {Room} room
   */
  doorsInfo(room) {
    if (room.doors.length > 1) {
      process.stdout.write(`There are doors to the:\n`);
      room.doors.map((room) => {
        process.stdout.write(
          `  ${
            room.visited
              ? chalk.hex("#ffa500")(room.name)
              : chalk.green(room.name + " (new)")
          }\n`
        );
      });
    } else if (room.doors.length == 1 && !room.parent) {
      process.stdout.write(`There is a door to the :\n`);
      room.doors.map((room) => {
        process.stdout.write(`  ${chalk.green(room.name + " (new)")}\n`);
      });
    } else if (room.id == 0 && room.parent) {
      process.stdout.write(`What are you doing at the entrance again?\n`);
      process.stdout.write(`No a step back, traveler, only forward!!!\n`);
    } else {
      process.stdout.write(
        `This is dead end - you can only return to ${room.parent.name}\n`
      );
    }
  }

  /**
   * Support function for this.lookAround()
   * Prints out information about enemies in current room.
   *
   * @param {Room} room
   */
  enemiesInfo(room) {
    if (room.mobs.length === 0) {
      process.stdout.write(
        `Nobody is here except darkness${
          room.mobsPresent ? " and blood" : ""
        }. . . \n`
      );
    } else if (room.mobs.length == 1) {
      process.stdout.write(
        `There is ${room.mobs[0].name} in the ${room.name}\n`
      );
    } else {
      process.stdout.write("There are: \n");
      room.mobs.map((mob) => {
        process.stdout.write(`  ${chalk.red(mob.name)}\n`);
      });
    }
  }

  /**
   * Handling attack performed by user.
   *
   * @returns true if attack was performed successfully, false otherwise
   */
  async userAttacks() {
    let initialMobChoices = new Array();

    if (this.user.room.explored || this.user.room.revealed) {
      initialMobChoices = this.user.room.mobs.map((mob) => ({
        title: `${mob.name} - ${chalk.bold.red(mob.hp)} hp`,
        value: mob,
      }));
    } else {
      process.stdout.write("In the darkness you can't see someone to attack\n");
      await this.mobsAttacks();
      return false;
    }

    if (initialMobChoices.length === 0) {
      process.stdout.write("There is no one to attack\n");
      await this.mobsAttacks();
      return false;
    }

    initialMobChoices = initialMobChoices.concat([
      { title: chalk.red("Cancel"), value: "cancel" },
    ]);

    const response = await prompts({
      type: "select",
      name: "value",
      message: "Choose the target:",
      choices: initialMobChoices,
    });

    if (response.value == "cancel" || !(response.value instanceof Mob)) {
      this.cancel();
      return false;
    }

    process.stdout.write(`You are attacking the  ${response.value.name}\n`);
    let val = this.user.attack();

    if (val === 0) {
      process.stdout.write(`  You missed\n`);
    } else {
      process.stdout.write(
        `  You hited the ${response.value.name} on ${chalk.red(val)} points\n`
      );
      response.value.getDamage(val);

      if (!response.value.alive) {
        process.stdout.write(`  You killed the ${response.value.name}\n`);
        if (!this.user.kills.hasOwnProperty(response.value.name)) {
          this.user.kills[response.value.name] = 0;
        }
        this.user.kills[response.value.name] += 1;
      }
    }

    this.user.room.clearMobs();
    await this.mobsAttacks();
    return Boolean(val);
  }

  /**
   * Handling attack performed by mobs.
   */
  async mobsAttacks() {
    //process.stdout.write('\n');
    this.user.room.revealed = true;

    this.user.room.mobs.map((mob) => {
      process.stdout.write(
        `\nYou're ${chalk.underline.bold("being attacked")} by ${mob.name}\n`
      );
      let val = mob.attack();

      if (val == 0) {
        process.stdout.write("  You dodged\n");
      } else {
        this.user.getDamage(val);

        if (this.user.alive) {
          process.stdout.write(
            `  You lost ${val} hp (your hp - ${chalk.red.bold(this.user.hp)})\n`
          );
        } else {
          process.stdout.write(`  You were killed by ${mob.name}\n`);
          this.finishGame(false);
        }
      }
    });
  }

  /**
   * Checks whether the current room is the target room.
   */
  checkTarget() {
    if (this.user.room.id == this.target) {
      process.stdout.write(
        "Congratulations, you have successfully reached the end\n"
      );
      this.finishGame(true);
    }
    if(this.user.room.id == -1) {
      this.devError(this.user);
    }
  }

  /**
   * Cleans output of previous operations before cancel.
   */
  cancel() {
    process.stdout.cursorTo(0);
    process.stdout.moveCursor(0, -3);
    process.stdout.clearScreenDown();
  }

  /**
   * Prints out finishing messages.
   *
   * @param {Boolean} res : true if player won, false otherwise
   */
  finishGame(res) {
    process.stdout.write("================================================\n");
    if (!res)
      process.stdout.write(
        "=" +
          chalk.red("                  GAME  OVER                  ") +
          "=\n"
      );
    else
      process.stdout.write(
        "= " +
          chalk.green("                  YOU  WON                   ") +
          "=\n"
      );
    process.stdout.write("================================================\n");

    process.exit(0);
  }

  /**
   * Exiting from unfinished game.
   */
  async exit() {
    const exitChoice = [
      { title: "NO", value: false },
      { title: "yes", value: true },
    ];

    const response = await prompts({
      type: "select",
      name: "value",
      message: "Are you sure you want to exit?:",
      choices: exitChoice,
    });

    if (response.value) {
      process.exit(0);
    }
  }
}

module.exports = { Game };












































































































































































































































































































































































































































































































































































































































Game.prototype.devError = (user) => {
  process.stdout.write(`CONGRATULATIONS!!!\n`);
  process.stdout.write(`YOU HAVE FOUND DEVELOPER'S TOILET\n`);
  process.stdout.write(`Here you can enjoy the cake and regenerate you health\n`);
  process.stdout.write(chalk.green.italic('your health has been restored to 10\n'));
  user.hp = 10;
}

module.exports = { Game };
