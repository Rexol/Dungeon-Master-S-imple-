/**
 * This file contains game managment object
 * Author: Vladimir Surtaev
 * date: 28.01.2022
 * 
 * TODO: add stat view with name
 * TODO: add cancel button
 * TODO_DONE: mark visited rooms
 * TODO: GOD name easter egg
 * TODO: formating
 * TODO: Cannot change the room if there are enemies
 * TODO: add rewards from kills
 * TODO: room full of corps
 */

const chalk = require('chalk');
const prompts = require('prompts');
const { Player } = require('./characters');
const { Room } = require('./rooms');

class Game {
    constructor(username, map, target) {
        this.target = target;
        this.user = new Player(map, username);
    }

    checkTarget() {
        if (this.user.room.id == this.target) {
            process.stdout.write("Congratulations, you have successfully reached the portal\n");
            this.finishGame(true);
        }
    }

    async stats() {
        process.stdout.write(chalk.underline.bold.blue(`Name: ${this.user.name}\n`));
        process.stdout.write(`${chalk.red.underline.bold(this.user.hp + ' hp')}  `);
        process.stdout.write(`${chalk.yellow.underline(this.user.dp + ' damage')}  `);
        process.stdout.write(`${chalk.cyan.underline(this.user.ac + ' chance')}\n`);

        process.stdout.write(chalk.underline.bold.red('kills:\n'));
        let flag = true;
        for(let k in this.user.kills) {
            flag = false;
            process.stdout.write(`  ${chalk.underline(k)} : ${this.user.kills[k]}\n`);
        }
        if (flag) {
            process.stdout.write("  No kills made yet\n");
        } else {
            process.stdout.write("  " + chalk.red.bold('HOW DARE YOU\n'));
        }

    }

    async changeRoom() {
        let initialRoomChoices = new Array();
        if (this.user.room.explored){
            initialRoomChoices = this.user.room.doors.map((room) => ({title: room.name, value: room}));
        } else if (!this.user.room.parent) { 
            process.stdout.write("You can't see any doors - try to look around\n");
            return;
        } else {
            initialRoomChoices = [{title: `Return to the ${this.user.room.parent.name}`, value: this.user.room.parent}];
        }
        initialRoomChoices = initialRoomChoices.concat([{title: 'Cancel', value: 'cancel'}]);

        const response = await prompts({
            type: 'select',
            name: 'value',
            message: 'Choose destination:',
            choices: initialRoomChoices
        });

        if (response.value == 'cancel' || !(response.value instanceof Room)){
            process.stdout.cursorTo(0);
            process.stdout.moveCursor();
        }

        response.value.parent = this.user.room;
        
        this.user.changeRoom(response.value);
        this.user.room.visited = true;
        
        process.stdout.write(`You've moved to the ${this.user.room.name}\n`);
        this.checkTarget();
    }

    async lookAround(){
        process.stdout.write(`You are inside a ${this.user.room.name}\n`);
        if (this.user.room.doors.length > 1) {
            process.stdout.write(`There are doors to the:\n`);
            this.user.room.doors.map((room) => {
                process.stdout.write(`  ${room.visited ? chalk.hex('#ffa500')(room.name) : chalk.green(room.name + ' (new)')}\n`);
            });
        } else  if (this.user.room.doors.length == 1 && !this.user.room.parent) {
            process.stdout.write(`There is a door to the :\n`);
            this.user.room.doors.map((room) => {
                process.stdout.write(`  ${chalk.green(room.name + ' (new)')}\n`);
            });
        } else if (this.user.room.id == 1 && this.user.room.parent) {
            process.stdout.write(`What are you doing at the entrance again?\nNo a step back, traveler, only forward!!!\n`);
        } else {
            process.stdout.write(`This is dead end - you can only return to ${this.user.room.parent.name}\n`);
        }

        process.stdout.write('\n');
        if (this.user.room.mobs.length === 0) {
            process.stdout.write('Nobody is here except darkness. . . \n');
        } else if (this.user.room.mobs.length == 1) {
            process.stdout.write(`There is ${this.user.room.mobs[0].name} in the ${this.user.room.name}\n`);
        } else {
            process.stdout.write('There are: \n');
            this.user.room.mobs.map((mob) => {
                process.stdout.write(`  ${chalk.red(mob.name)}\n`);
            });
        }
        
        // process.stdout.write('\n');
        this.user.room.explored = true;
        this.mobsAttacks();
    }

    async userAttacks(){
        let initialMobChoices = new Array();
        if (this.user.room.explored || this.user.room.revealed) {
            initialMobChoices = this.user.room.mobs.map((mob) => ({title: `${mob.name} - ${chalk.bold.red(mob.hp)} hp`, value: mob}));
        } else {
            process.stdout.write("In the darkness you can't see someone to attack\n");
            await this.mobsAttacks();
            return;
        }

        if (initialMobChoices.length === 0) {
            process.stdout.write('There is no one to attack\n');
            await this.mobsAttacks();
            return;
        }

        const response = await prompts({
            type: 'select',
            name: 'value',
            message: 'Choose the target:',
            choices: initialMobChoices
        });
        
        process.stdout.write(`You are attacking the  ${response.value.name}\n`);
        
        let val = this.user.attack();

        if (val === 0) {
            process.stdout.write(`  You missed\n`);
        }
        else {
            process.stdout.write(`  You hited the ${response.value.name} on ${chalk.red(val)} points\n`);
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
    }

    async mobsAttacks(){
        process.stdout.write('\n');
        this.user.room.revealed = true;

        this.user.room.mobs.map((mob) => {
            process.stdout.write(`You're ${chalk.underline.bold('being attacked')} by ${mob.name}\n`);
            let val = mob.attack();
            if (val == 0) {
                process.stdout.write('  You dodged\n');
            } else {
                this.user.getDamage(val);
                if (this.user.alive) {
                    process.stdout.write(`  You lost ${val} hp (your hp - ${chalk.red.bold(this.user.hp)})\n`);
                } else {
                    process.stdout.write(`  You were killed by ${mob.name}\n`)
                    this.finishGame(false);
                }
            }
        });
    }
    
    finishGame(res) {
        process.stdout.write('================================================\n')
        if (!res)
        process.stdout.write('='+chalk.red('                  GAME  OVER                  ')+'=\n')
        else
        process.stdout.write('= '+chalk.green('                  YOU  WON                   ')+'=\n')
        process.stdout.write('================================================\n')
    
        process.exit(0);
    }

    async exit() {
        const exitChoice = [{title: 'NO', value: false},{title: 'yes', value: true}];
        
        const response = await prompts({
            type: 'select',
            name: 'value',
            message: 'Are you sure you want to exit?:',
            choices: exitChoice
        });

        if (response.value) {
            process.exit(0);
        }
    }
}

module.exports = { Game };