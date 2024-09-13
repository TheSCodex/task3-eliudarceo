const crypto = require('crypto');
const Table = require('cli-table3');

// Class for hmac key generation
class KeyGen {
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    static computeHMAC(key, message) {
        const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
        hmac.update(message);
        return hmac.digest('hex');
    }
}

// Class for managing game rules
class Rules {
    constructor(moves) {
        this.moves = moves.map(move => move.toLowerCase());
    }

    determineWinner(userMove, computerMove) {
        const userIndex = this.moves.indexOf(userMove);
        const computerIndex = this.moves.indexOf(computerMove);
        const half = Math.floor(this.moves.length / 2);

        if (userIndex === computerIndex) {
            return 'Draw';
        } else if ((userIndex > computerIndex && userIndex - computerIndex <= half) ||
                   (userIndex < computerIndex && computerIndex - userIndex > half)) {
            return 'You win!';
        } else {
            return 'You lose!';
        }
    }
}

// Class for generating the help table
class TableGenerator {
    constructor(moves, rules) {
        this.moves = moves;
        this.rules = rules;
    }

    printHelpTable() {
        const table = new Table({
            head: ['v PC\\User >', ...this.moves],
            colWidths: Array(this.moves.length + 1).fill(15)
        });

        for (let i = 0; i < this.moves.length; i++) {
            const row = [this.moves[i]];
            for (let j = 0; j < this.moves.length; j++) {
                const result = i === j ? 'Draw' : this.rules.determineWinner(this.moves[i], this.moves[j]);
                row.push(result);
            }
            table.push(row);
        }

        console.log(table.toString());
    }
}

// Main game class
class Game {
    constructor(moves) {
        this.moves = moves.map(move => move.toLowerCase());
        this.rules = new Rules(this.moves);
        this.key = KeyGen.generateKey();
        this.hmac = null;
        this.computerMove = null;
    }

    getComputerMove() {
        const randomIndex = crypto.randomInt(0, this.moves.length);
        return this.moves[randomIndex];
    }

    printResults(userMove) {
        this.computerMove = this.getComputerMove();
        const result = this.rules.determineWinner(userMove, this.computerMove);
        const newKey = KeyGen.generateKey();
        const newHmac = KeyGen.computeHMAC(newKey, this.computerMove);

        console.log(`Your move: ${userMove}`);
        console.log(`Computer move: ${this.computerMove}`);
        console.log(result);
        console.log(`HMAC key: ${newKey}`);
    }

    showMenu() {
        this.computerMove = this.getComputerMove();
        this.hmac = KeyGen.computeHMAC(this.key, this.computerMove);

        console.log(`HMAC: ${this.hmac}`);
        console.log('Available moves:');
        this.moves.forEach((move, index) => {
            console.log(`${index + 1} - ${move}`);
        });
        console.log('0 - Exit');
        console.log('? - Help');
    }

    printHelpTable() {
        const tableGen = new TableGenerator(this.moves, this.rules);
        tableGen.printHelpTable();
    }
}

function main() {
    const args = process.argv.slice(2);

    if (args.length < 3 || args.length % 2 === 0 || new Set(args.map(arg => arg.toLowerCase())).size !== args.length) {
        console.error('Invalid arguments. Example usage: node game.js rock paper scissors lizard spock');
        process.exit(1);
    }

    try {
        const game = new Game(args);

        if (args[0] === '?') {
            game.printHelpTable();
            return;
        }

        game.showMenu();

        const stdin = process.openStdin();
        stdin.addListener('data', (input) => {
            const choice = input.toString().trim().toLowerCase();
            if (choice === '0') {
                process.exit(0);
            } else if (choice === '?') {
                game.printHelpTable();
            } else {
                const index = parseInt(choice, 10) - 1;
                if (index >= 0 && index < game.moves.length) {
                    game.printResults(game.moves[index]);
                } else {
                    console.log('Invalid choice. Please try again.');
                }
            }
        });
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

main();
