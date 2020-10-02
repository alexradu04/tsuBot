const tmi = require('tmi.js');
const store = require('data-store')({path: process.cwd() + '/db.json'});
const lurkDB = require('data-store')({path: process.cwd() + '/lurk.json'});
const emoji = require('node-emoji');
require('dotenv').config();
const opts = {
    identity: {
        username: 'booptsubot',
        password: process.env.pass,
    },
    channels: [
        'tsukunertov'
    ],
    connection: {
        reconnect: true
    }
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

let boopCooldown = 0;
let hugCooldown = 0;
let lurkCooldown = 0;
let openQueue = false;

function onMessageHandler(target, context, msg, self) {
    let temp = store.get('queue');
    if (temp === undefined) {
        store.set('queue', []);
    }
    if (self)
        return;
    if (msg.startsWith('!lurk')) {
        lurkDB.set(context.username, true);
        client.say(target, `${context['display-name']} is now lurking!`);
        return;
    }
    let isLurk = lurkDB.get(context.username);
    if (isLurk === true) {
        lurkDB.set(context.username, false);
        client.say(target, `${context['display-name']} is back from lurking`);
    }
    if (msg.startsWith('!check_lurk') && !lurkCooldown) {
        let ok = 0;
        let victim = '';
        for (let i = 4; i < msg.length; ++i) {
            if (msg[i] === '@') {
                ok = 1;
                continue;
            }
            if (ok === 1) {
                victim += msg[i];
            }
            if (msg[i] === ' ' && ok === 1) {
                break;
            }
        }
        victim = victim.toLowerCase();
        if (victim !== '') {
            lurkCooldown = 1;
            isLurk = lurkDB.get(victim);
            if (isLurk === true) {
                client.say(target, `You guessed it! ${victim} is lurking! [${emoji.get('no_entry')} 20s]`);
            } else {
                client.say(target, `Last time I checked, ${victim} wasn't lurking. He might have forgotten to !lurk, quit the stream, or just doesn't know what to say. [${emoji.get('no_entry')} 20s]`);
            }
            setTimeout(function () {
                lurkCooldown = 0;
                //console.log('Timeout expired');
            }, 20000);
        } else {
            client.say(target, `You need to @ who you're checking on`);
        }
    }
    if ((msg.startsWith('!hug') || msg.startsWith('!lehug')) && !hugCooldown) {
        let ok = 0;
        let victim = '';
        for (let i = 4; i < msg.length; ++i) {
            if (msg[i] === '@') {
                ok = 1;
                //continue;
            }
            if (ok === 1) {
                victim += msg[i];
            }
            if (msg[i] === ' ' && ok === 1) {
                break;
            }
        }
        if (victim !== '') {
            hugCooldown = 1;
            msg.startsWith('!hug') ?
                client.say(target, `ALL THE HUGS TO ${victim} FROM @${context['display-name']}! [${emoji.get('no_entry')} 10s]`) :
                client.say(target, `TOUS LES CÂLINS À LE ${victim} DE LE @${context['display-name']}! [${emoji.get('no_entry')} 10s]`);
        } else {
            client.say(target, `you should @ who you want to hug.`);
        }
        if (hugCooldown) {
            setTimeout(function () {
                hugCooldown = 0;
            }, 10000);
        }
    } else if (msg.startsWith('!boop') && !boopCooldown) {
        let ok = 0;
        let victim = '';
        for (let i = 6; i < msg.length; ++i) {
            if (msg[i] === '@') {
                ok = 1;
                //continue;
            }
            if (msg[i] === ' ' && ok === 1) {
                break;
            }
            if (ok === 1) {
                victim += msg[i];
            }
        }
        let boopCount = store.get('counter');
        let resp;
        let trap = 0;
        if (victim === '@booptsubot') {
            victim = '@' + context['display-name'].toLowerCase();
            trap = 1;
        }
        victim = victim.toLowerCase();
        let myBoops = store.get(victim);
        if (boopCount === undefined) {
            boopCount = 0;
        }
        if (myBoops === undefined) {
            myBoops = 0;
        }
        boopCount++;
        myBoops++;
        store.set('counter', boopCount);
        store.set(victim, myBoops);
        boopCooldown = 0;
        if (victim !== '') {
            let term;
            switch (myBoops) {
                case 1:
                    term = 'st';
                    break;
                case 2:
                    term = 'nd';
                    break;
                case 3:
                    term = 'rd';
                    break;
                default:
                    term = 'th';
                    break;
            }
            if (trap) {
                resp = `You fell right into my trap. You, ${victim} have been booped. In total there have been ${boopCount} boops.`;
            } else {
                resp = `${victim} has been BOOPED for the ${myBoops}${term} time by @${context['display-name']}! In total there have been ${boopCount} boops.`;
            }

            resp += `[${emoji.get('no_entry')} 20s]`;
            boopCooldown = 1;
        } else {
            resp = `you should @ who you want to boop.`;

        }

        client.say(target, resp);
        if (boopCooldown) {
            setTimeout(function () {
                boopCooldown = 0;

            }, 20000);
        }

    } else if (msg === '!join' && openQueue) {
        fortniteQueue = store.get('queue');

        if (fortniteQueue.includes(context.username))
            return;
        fortniteQueue.push(context.username);
        store.set('queue', fortniteQueue);

        let ans = `@${context['display-name']} Has joined the queue. [${fortniteQueue.length} players]`;
        client.say(target, ans);
    } else if (msg === '!remove_me') {
        fortniteQueue = store.get('queue');
        for (let i = 0; i < fortniteQueue.length; ++i) {
            if (fortniteQueue[i] === context.username) {
                fortniteQueue.splice(i, 1);
                break;
            }
        }

        store.set('queue', fortniteQueue);
        client.say(target, `Successfully removed you from the queue, @${context['display-name']}`)
    } else if (msg === '!remove_all') {
        fortniteQueue = store.get('queue');
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04') {
            fortniteQueue.splice(0, fortniteQueue.length);
            client.say(target, 'Queue is now empty!');
            store.set('queue', fortniteQueue);
        }
    } else if (msg.startsWith('!remove')) {
        fortniteQueue = store.get('queue');
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
                let removers = [];
                let ok = 0;
                for (let i = 0; i < msg.length; ++i) {
                    if (msg[i] === '@') {
                        ok = 1;
                        continue;
                    }
                    if (ok === 1 && msg[i] === ' ') {
                        ok = 0;
                        removers.push(remover);
                        remover = '';
                    }
                    if (ok === 1) {
                        remover += msg[i];
                    }
                }
                if (remover !== '')
                    removers.push(remover);

                if (removers.length < 1) {
                    client.say(target, `Bruh, you have to @ the dude you want to remove`);
                    return;
                }
                let successfulTargets = [];
                for (let i = 0; i < fortniteQueue.length; ++i) {
                    for (let j = 0; j < removers.length; ++j) {
                        if (fortniteQueue[i].toLowerCase() === removers[j].toLowerCase()) {
                            successfulTargets.push(removers[j]);
                            fortniteQueue.splice(i, 1);
                        }
                    }
                }
                if (successfulTargets.length > 0) {
                    client.say(target, `Successfully removed ${successfulTargets.toString()}`);
                } else
                    client.say(target, `Bruh. None of the people you mentioned are in queue`);
            } else {
                let noOfRemovals = 0;
                for (let i = 0; i < msg.length; ++i) {
                    if ('0' <= msg[i] && msg[i] <= '9') {
                        noOfRemovals *= 10;
                        noOfRemovals += msg[i] - '0';
                    }
                }

                for (let i = 1; i <= Math.min(noOfRemovals, fortniteQueue.length); ++i) {
                    fortniteQueue.shift();
                }
                client.say(target, `Successfully removed first ${noOfRemovals} players from the queue`);

            }
            store.set('queue', fortniteQueue);
        } else {
            client.say(target, `You don't have permission to execute that command!`);
        }
    } else if (msg === '!game_queue' || msg === '!queue') {
        fortniteQueue = store.get('queue');
        client.say(target, `Queue consists of : [ ${fortniteQueue} ]. In total, ${fortniteQueue.length} players`);
    } else if (msg.startsWith('!move_end')) {
        fortniteQueue = store.get('queue');
        if (!(context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04')) {
            client.say(target, `You don't have permission to execute that command!`);
            return;
        }
        let ok = 0;
        let mover = '';
        for (let i = 0; i < msg.length; ++i) {
            if (msg[i] === '@') {
                ok = 1;
                continue;
            }
            if (ok === 1 && msg[i] === ' ')
                break;
            if (ok === 1) {
                mover += msg[i];
            }
        }
        let pos = -1;
        for (let i = 0; i < fortniteQueue.length; ++i) {
            if (fortniteQueue[i].toLowerCase() === mover.toLowerCase()) {
                pos = i;
                break;
            }
        }
        if (pos === -1) {
            client.say(target, 'Bruh, he is not in the queue');
            return;
        }
        fortniteQueue.splice(pos, 1);
        fortniteQueue.push(mover);
        client.say(target, `Moved @${mover} from position ${pos + 1} to the end.`);
        store.set('queue', fortniteQueue);
    } else if (msg.startsWith('!move')) {
        fortniteQueue = store.get('queue');
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
                    continue;
                }
            }
            if (msg[i] === '@') {
                ok = 1;
                continue;
            }
            if (ok === 1) {
                mover += msg[i];
            }
            if (ok === 2) {
                position = position * 10 + (msg[i] - '0');
            }
        }
        position--;
        console.log(position);
        if (ok < 1) {
            client.say(target, `Bruh, you have to @ the dude you want to move`);
            return;
        }
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
        client.say(target, `Successfully moved ${mover} from position ${oldPos + 1} to position ${position + 1}`);
        store.set('queue', fortniteQueue);
    } else if (msg === '!github') {
        client.say(target, `Check out my spaghetti here: https://github.com/alexradu04/Tsu-Queue-Manager-Bot`);
    } else if (msg === '!help') {
        client.say(target, "List of commands: https://raw.githubusercontent.com/alexradu04/Tsu-Queue-Manager-Bot/master/help.txt")
    } else if (msg === '!open') {
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04') {
            openQueue = true;
            client.say(target, `Queue successfully opened!`);
        } else {
            client.say(target, `You do not have permission to execute that command!`);
        }
    } else if (msg === '!close') {
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04') {
            openQueue = false;
            client.say(target, `Queue successfully closed!`);
        } else {
            client.say(target, `You do not have permission to execute that command!`);
        }
    }
}

client.connect();