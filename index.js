const tmi = require('tmi.js');
const store = require('data-store')({path: process.cwd() + '/db.json'});
const emoji = require('node-emoji');
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

let boopCooldown=0;
let hugCooldown=0;
let openQueue=0;
function onMessageHandler(target, context, msg, self) {
    if(msg==='!secret') {
        store.set('queue', fortniteQueue);
        let temp= store.get('queue');
        console.log(temp);
    }
    if (self)
        return;
    console.log(msg);
    if (msg.startsWith('!hug') && !hugCooldown) {
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
            hugCooldown=1;
            client.say(target, `ALL THE HUGS TO ${victim} FROM @${context['display-name']}! [${emoji.get('no_entry')} 10s]`);
        } else {
            client.say(target, `you should @ who you want to hug.`)
        }
        if(hugCooldown) {
            setTimeout(function() {
                hugCooldown=0;
                console.log('Timeout expired');
            }, 10000);
        }
    }else
    if (msg.startsWith('!boop') && !boopCooldown) {
        let ok = 0;
        let victim = '';
        for (let i = 6; i < msg.length; ++i) {
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

        let boopCount = store.get('counter');
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
        boopCooldown=0;
        let resp;
        if (victim !== '') {
            let term;
            switch (myBoops) {
                case 1: term='st';break;
                case 2: term='nd';break;
                case 3: term='rd';break;
                default: term='th';break;
            }
            resp=`${victim} has been BOOPED for the ${myBoops}${term} time by @${context['display-name']}! In total there have been ${boopCount} boops.`;
            //client.say(target, );
            resp +=`[${emoji.get('no_entry')} 20s]`;
            boopCooldown=1;
        } else {
            resp=`you should @ who you want to boop.`;
            //client.say(target, `you should @ who you want to boop.`)
        }
        client.say(target, resp);
        if(boopCooldown) {
            setTimeout(function() {
                boopCooldown=0;
                console.log('Timeout expired');
            }, 20000);
        }

    } else if (msg === '!join' && openQueue) {
        fortniteQueue = store.get('queue');
        if (fortniteQueue.includes(context.username))
            return;
        fortniteQueue.push(context.username);
        store.set('queue', fortniteQueue);
        console.log(`Added ${context['display-name']} to queue`);
        let ans = `@${context['display-name']} Has joined the queue. The queue currently consists of: [`;
        ans += fortniteQueue.toString();
        ans += ']';
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
    }else if(msg === '!remove_all' ) {
        fortniteQueue = store.get('queue');
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04') {
            fortniteQueue.splice(0, fortniteQueue.length);
            client.say(target, 'Queue is now empty!');
        store.set('queue', fortniteQueue);
        }
    } else if (msg.startsWith('!remove') ) {
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
                let ok = 0;
                for (let i = 0; i < msg.length; ++i) {
                    if (msg[i] === '@') {
                        ok = 1;
                        continue;
                    }
                    if (ok === 1) {
                        remover += msg[i];
                    }
                    if (ok === 1 && msg[i] === ' ')
                        break;
                }
                if(ok<1) {
                    client.say(target, `Bruh, you have to @ the dude you want to remove`);
                    return;
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
        store.set('queue', fortniteQueue);
        } else {
            client.say(target, `You don't have permission to execute that command!`);
        }
    } else if (msg === '!game_queue' ) {
        fortniteQueue = store.get('queue');
        //store.set('queue', fortniteQueue);
        client.say(target, `Queue consists of : [ ${fortniteQueue} ]`)
    } else if(msg.startsWith('!move_end') ) {
        fortniteQueue = store.get('queue');
        if (!(context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04')) {
            client.say(target, `You don't have permission to execute that command!`);
            return;
        }
        let ok=0;
        let mover='';
        for(let i=0;i<msg.length;++i) {
            if(msg[i]==='@') {
                ok=1;
                continue;
            }
            if(ok===1 && msg[i]===' ')
                break;
            if(ok===1) {
                mover+=msg[i];
            }
        }
        let pos=-1;
        for(let i=0;i<fortniteQueue.length;++i) {
            if(fortniteQueue[i].toLowerCase()===mover.toLowerCase()) {
                pos=i;
                break;
            }
        }
        if(pos===-1) {
            client.say(target, 'Bruh, he is not in the queue');
            return;
        }
        fortniteQueue.splice(pos,1);
        fortniteQueue.push(mover);
        client.say(target, `Moved @${mover} from position ${pos+1} to the end.`);
        store.set('queue', fortniteQueue);
    }else if (msg.startsWith('!move')) {
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
                position = position * 10 + msg[i] - '0';
            }
        }
        position--;
        if(ok<1) {
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
    }
    else if (msg === '!github') {
        client.say(target, `Check out my spaghetti here: https://github.com/alexradu04/Tsu-Queue-Manager-Bot`);
    } else if (msg === '!help') {
        client.say(target, "List of commands: https://raw.githubusercontent.com/alexradu04/Tsu-Queue-Manager-Bot/master/help.txt")
    } else if(msg==='!open') {
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04')
        {
            openQueue = 1;
            client.say(target, `Queue successfully opened!`);
        }
        else
        {
            client.say(target, `You do not have permission to execute that command!`);
        }
    } else if(msg==='!close') {
        if (context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04')
        {
            openQueue = 0;
            client.say(target, `Queue successfully closed!`);
        }
        else
        {
            client.say(target, `You do not have permission to execute that command!`);
        }
    }
}

client.connect();