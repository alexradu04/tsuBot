const tmi = require('tmi.js');
require('dotenv').config();
const opts = {
    identity: {
        username: 'booptsubot',
        password: process.env.pass,
    },
    channels: [
        'tsukunertov'
    ]
};

const client = new tmi.client(opts);
let fortniteQueue = [];
client.on('connected', onConnectedHandler);
client.on('message', onMessageHandler);

function moveInQueue(v, where, from) {
    let aux = v[from];
    v.splice(from, 1);
    for (let i = fortniteQueue.length; i >= where; --i) {
        v[i] = v[i - 1];
    }
    v[where] = aux;
}

function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}

function onMessageHandler(target, context, msg, self) {
    if (self)
        return;
    console.log(msg);
    if (msg === '!boop') {
        client.say(target, `Tsu has been BOOPED by @${context['display-name']}!`);
    } else if (msg === '!join') {
        if (fortniteQueue.includes(context.username))
            return;
        fortniteQueue.push(context.username);
        console.log(`Added ${context['display-name']} to queue`);
        let ans = `@${context['display-name']} Has joined the queue. The queue currently consists of: [`;
        ans += fortniteQueue.toString();
        ans += ']';
        client.say(target, ans);
    } else if (msg === '!remove_me') {
        for (let i = 0; i < fortniteQueue.length; ++i) {
            if (fortniteQueue[i] === context.username) {
                fortniteQueue.splice(i, 1);
                break;
            }
        }
        client.say(target, `Successfully removed you from the queue, @${context['display-name']}`)
    } else if (msg.startsWith('!remove')) {
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04') {
            let mode = 0;
            let okk = 0;
            for (let i = 0; i < msg.length; ++i) {
                if (msg[i] === ' ') {
                    okk = 1;
                    continue;
                }
                if (okk === 1) {
                    if (!('0' <= msg[i] && msg[i] <= '9')) {
                        mode = 1;
                        break;
                    }
                }
            }

            if (mode === 1) {
                let remover = '';
                let ok = 0;
                for (let i = 0; i < msg.length; ++i) {
                    if (msg[i] === ' ') {
                        ok = 1;
                        continue;
                    }
                    if (ok === 1) {
                        remover += msg[i];
                    }
                }
                let targetExists = 0;
                for (let i = 0; i < fortniteQueue.length; ++i) {
                    if (fortniteQueue[i].toLowerCase() === remover.toLowerCase()) {
                        targetExists = 1;
                        fortniteQueue.splice(i, 1);
                    }
                }
                if (targetExists) {
                    client.say(target, `Successfully removed ${remover} from the queue.`);
                    console.log(`Successfully removed ${remover} from the queue.`);
                } else {
                    client.say(target, `Error! ${remover} is not in the queue.`);
                }
            } else {
                let noOfRemovals = 0;
                for (let i = 0; i < msg.length; ++i) {
                    if ('0' <= msg[i] && msg[i] <= '9') {
                        noOfRemovals *= 10;
                        noOfRemovals += msg[i] - '0';
                    }
                }
                console.log(noOfRemovals);
                for (let i = 1; i <= Math.min(noOfRemovals, fortniteQueue.length); ++i) {
                    fortniteQueue.shift();
                }
                client.say(target, `Successfully removed ${noOfRemovals} players from the queue`);
                console.log(fortniteQueue);
            }

        } else {
            client.say(target, `You don't have permission to execute that command!`);
        }
    } else if (msg === '!game_queue') {
        client.say(target, `Queue consists of : [ ${fortniteQueue} ]`)
    } else if (msg.startsWith('!move')) {
        if (!(context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04')) {
            client.say(target, `You don't have permission to execute that command!`);
            return;
        }
        let mover = '';
        let ok = 0;
        let position = 0;
        for (let i = 0; i < msg.length; ++i) {
            if (msg[i] === ' ') {
                if (ok === 1) {
                    ok = 2;
                } else
                    ok = 1;
                continue;
            }
            if (ok === 1) {
                mover += msg[i];
            }
            if (ok === 2) {
                position = position * 10 + msg[i] - '0';
            }
        }
        position--;
        if (position < 0 || position >= fortniteQueue.length) {
            client.say(target, `Bruh, there is no such position in the queue!`);
            return;
        }
        let oldPos = 0;
        for (let i = 0; i < fortniteQueue.length; ++i) {
            if (fortniteQueue[i].toLowerCase() === mover.toLowerCase()) {
                oldPos = i;
                break;
            }
        }
        moveInQueue(fortniteQueue, position, oldPos);
        client.say(target, `Successfully moved ${context['display-name']} from position ${oldPos + 1} to position ${position + 1}`);
    } else if (msg === '!github') {
        client.say(target, `Check out my spaghetti here: https://github.com/alexradu04/Tsu-Queue-Manager-Bot`);
    } else if (msg === '!help') {
        client.say(target, "List of commands: https://imgur.com/HhKO9wc")
    }
}

client.connect();