/**
 * This is the main file for running the game
 * Author: Vladimir Surtaev
 * Date: 28.01.2022
 */

const chalk = require("chalk"); // Customizable output.
const prompts = require("prompts"); // Beautiful CLI.
const { Game } = require("./game"); // Main class for the game.
const { spawn, TARGET_ROOM_ID, defaultUName } = require("./map"); // Map for the game.

async function getName() {
  const name = await prompts({
    type: "text",
    name: "value",
    message: `Who are you, traveler?`,
  });

  if (name.value == "") return defaultUName;

  return name.value;
}

async function gameLoop(game) {
  process.stdout.write("\n");

  const initialActionChoices = [
    { title: "Look around", value: "look" },
    { title: "Go to ...", value: "goToRoom" },
    { title: "Attack", value: "attack" },
    { title: "Show stats", value: "stats" },
    { title: "Exit game", value: "exit" },
  ];

  const response = await prompts({
    type: "select",
    name: "value",
    message: "Choose your action",
    choices: initialActionChoices,
  });

  switch (response.value) {
    case "look":
      await game.lookAround();
      break;

    case "goToRoom":
      await game.changeRoom();
      break;

    case "attack":
      await game.userAttacks();
      break;

    case "stats":
      await game.stats();
      break;

    case "exit":
      await game.exit();
      break;

    default:
      process.stdout.write(
        "Sorry, something went wrong - please choose action again 😓\n"
      );
      break;
  }

  gameLoop(game);
}

process.stdout.write("\033c"); // clear screen on windows

process.stdout.write("WELCOME TO THE DUNGEONS OF LORD OBJECT ORIENTUS!\n");
process.stdout.write("================================================\n");

async function start() {
  const name = await getName();
  const game = new Game(name, spawn, TARGET_ROOM_ID);

  process.stdout.write("You walk down the stairs to the dungeons\n");
  gameLoop(game);
}

start();