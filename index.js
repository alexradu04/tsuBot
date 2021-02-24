const {ApiClient} = require('twitch');
const {StaticAuthProvider} = require('twitch-auth');
const tmi = require("tmi.js");
require('dotenv').config();
const emoji = require('node-emoji');
const fetch = require('node-fetch');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter);
const fs = require('fs');
const authProvider = new StaticAuthProvider(process.env.client_id, process.env.access_token);
const apiClient = new ApiClient({authProvider});
const helixApi = apiClient.helix;
let tsuStream;
const broadcasterUsername = process.env.broadcaster;
const opts = {
    identity: {
        username: 'booptsubot',
        password: process.env.pass,
    },
    channels: [
        broadcasterUsername
    ],
    connection: {
        reconnect: true
    }
};
const client = new tmi.client(opts);
client.connect();
client.on('connected', onConnectedHandler);
client.on('message', onMessageHandler);

async function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
    tsuStream = await helixApi.streams.getStreamByUserName(broadcasterUsername);
    //console.log(tsuStream.title);
}


const CommandEnum = Object.freeze({"hug": 0, "bonk": 2, "boop": 3, "feed": 4, "top": 5});
let cooldowns = [];
let gameQueue = [];
let openQueue = false;
let shouldSpam = {};


async function onMessageHandler(target, context, msg, self) {
    if (self)
        return;
    let args = msg.split(' ');
    let command = '';
    if (msg.startsWith('!')) {
        command = args[0];
        args.splice(0, 1);
    }

    let isLurk = db.get('users')
        .find({user: context['display-name'].toLowerCase()})
        .value();
    if (isLurk !== undefined && isLurk['lurking'] === true) {
        db.get('users')
            .find({user: isLurk['user']})
            .assign({'lurking': false, user: context['display-name'].toLowerCase()})
            .write();
        client.say(target, `@${context['display-name']} is back from lurking!`);
    }

    if (checkLemming(msg)) {
        client.say(target, `@${context['display-name']}, fortnite is played every community day (Friday) at 9PM EST`)
    }

    if (command === '!hug' && !cooldowns[CommandEnum.hug]) {
        if (!args[0].startsWith('@')) {
            client.say(target, `@${context['display-name']} please @ who you want to hug`);
            return;
        }
        client.say(target, `ALL THE HUGS TO ${args[0]} FROM @${context['display-name']}! [${emoji.get('no_entry')} 10s]`);
        cooldowns[CommandEnum.hug] = 1;
        setTimeout(function () {
            cooldowns[CommandEnum.hug] = 0;
        }, 10000);
    } else if (command === '!lehug' && !cooldowns[CommandEnum.hug]) {
        if (!args[0].startsWith('@')) {
            client.say(target, `@${context['display-name']} please @ who you want to lehug`);
            return;
        }
        client.say(target, `TOUS LES CÂLINS À LE ${args[0]} DE LA PART DE LE @${context['display-name']}! [${emoji.get('no_entry')} 10s]`);
        cooldowns[CommandEnum.hug] = 1;
        setTimeout(function () {
            cooldowns[CommandEnum.hug] = 0;
        }, 10000);
    } else if (command === '!bonk' && !cooldowns[CommandEnum.bonk]) {
        if (!args[0].startsWith('@')) {
            client.say(target, `@${context['display-name']} please @ who you want to bonk`);
            return;
        }
        client.say(target, `${args[0]} has been BONKED by @${context['display-name']}. Happy bonking! tsukun1BAN [${emoji.get('no_entry')} 1m]`);
        cooldowns[CommandEnum.bonk] = 1;
        setTimeout(function () {
            cooldowns[CommandEnum.bonk] = 0;
        }, 60000);
    } else if (command === '!boop' && !cooldowns[CommandEnum.boop]) {
        if (!args[0].startsWith('@')) {
            client.say(target, `@${context['display-name']} please @ who you want to boop`);
            return;
        }
        let trap = false;
        if (args[0] === '@booptsubot') {
            args[0] = '@' + context['display-name'];
            trap = true;
        }
        cooldowns[CommandEnum.boop] = 1;
        setTimeout(function () {
            cooldowns[CommandEnum.boop] = 0;
        }, 20000);
        let total = db.get('totalBoops')
            .value();
        total++;
        db.set('totalBoops', total).write();

        let data;
        data = db.get('users')
            .find({user: args[0].substring(1).toLowerCase()})
            .value();
        let info;
        if (data === undefined) {
            info = await getInfo(args[0].substring(1));
        }

        if (info === undefined && data === undefined) {
            client.say(target, `${args[0]} isn't a real user, but IT HAS BEEN BOOPED. There have been ${total} boops till now [${emoji.get('no_entry')} 20s]`);
            return;
        }
        if (data === undefined) {
            data = db.get('users')
                .find({id: info['id']})
                .value();
        }
        let noboops;
        if (data === undefined) {
            db.get('users')
                .push({id: info['id'], user: info['display_name'].toLowerCase(), boops: 1, lurking: false})
                .write();
            noboops = 1;
        } else {
            noboops = data.boops + 1;
            if (info !== undefined) {
                db.get('users')
                    .find({id: info['id']})
                    .assign({'boops': noboops, user: info['display_name'].toLowerCase()})
                    .write();
            } else {
                db.get('users')
                    .find({id: data['id']})
                    .assign({'boops': noboops, user: data['user'].toLowerCase()})
                    .write();
            }
        }
        let term;
        let resp;
        switch (noboops) {
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
            resp = `You fell right into my trap. You, ${args[0]} have been booped. In total there have been ${total} boops.`;
        } else {
            resp = `${args[0]} has been BOOPED for the ${noboops}${term} time by @${context['display-name']}! In total there have been ${total} boops.`;
        }
        resp += `[${emoji.get('no_entry')} 20s]`;
        client.say(target, resp);
    } else if (command === '!feed' && !cooldowns[CommandEnum.feed]) {
        if (!args[0].startsWith('@')) {
            client.say(target, `@${context['display-name']} please @ who you want to feed`);
            return;
        }
        let resp = `${args[0]} You received a `;
        for (let i = 1; i < args.length; ++i) {
            resp += (args[i] + ' ');
        }
        resp += `sandwich from @${context['display-name']}`;
        resp += `[${emoji.get('no_entry')} 20s]`;
        cooldowns[CommandEnum.feed] = 1;
        client.say(target, resp);
        setTimeout(function () {
            cooldowns[CommandEnum.feed] = 0;
        }, 20000);
    } else if (msg === '!open' && checkPermission(context)) {
        openQueue = true;
        client.say(target, `Successfully opened the queue!`);
    } else if (msg === '!close' && checkPermission(context)) {
        openQueue = false;
        client.say(target, `Queue successfully closed!`);
    } else if (msg === '!join' && openQueue) {
        if (gameQueue.includes(context['display-name'].toLowerCase()))
            return;
        gameQueue.push(context['display-name'].toLowerCase());
        client.say(target, `Added @${context['display-name']} to the queue. [${gameQueue.length} players]`);
    } else if (msg === '!queue' || msg === '!game_queue') {
        let resp = `Current queue: [`;
        for (let i = 0; i < gameQueue.length; ++i) {
            if (i > 0)
                resp += ', ';
            resp += gameQueue[i];
        }
        resp += `] ${gameQueue.length} players`;
        client.say(target, resp);
    } else if (command === '!remove_me' || command === '!removeme') {
        let pos = -1;
        for (let i = 0; i < gameQueue.length; ++i) {
            if (context['display-name'].toLowerCase() === gameQueue[i]) {
                pos = i;
            }
        }
        if (pos === -1) {
            client.say(target, `You are not in the queue, @${context['display-name']}`);
            return;
        }
        gameQueue.splice(pos, 1);
        client.say(target, `Successfully removed @${context['display-name']} from the queue`);
    } else if (command === '!remove' && checkPermission(context)) {
        if (args[0].startsWith('@')) {
            let resp = `Removed `;
            let ok = false;
            for (let i = 0; i < args.length; ++i) {
                const index = gameQueue.indexOf(args[i].substring(1).toLowerCase());
                if (index > -1) {
                    if (ok) {
                        resp += ', ';
                    }
                    resp += args[i].substring(1);
                    ok = true;
                    gameQueue.splice(index, 1);
                }
            }
            if (ok === false) {
                client.say(target, `None of the people you mentioned are in the queue, @${context['display-name']}`);
                return;
            }
            resp += ' from the queue';
            client.say(target, resp);
        } else {
            let removeCount = parseInt(args[0]);
            gameQueue.splice(0, removeCount);
            client.say(target, `Successfully removed first ${removeCount} player(s)`);
        }
    } else if (command === '!remove_all' && checkPermission(context)) {
        gameQueue = [];
        client.say(target, `Removed everyone from the queue`);
    } else if (command === '!move' && checkPermission(context)) {
        const firstIndex = gameQueue.indexOf(args[0].substring(1).toLowerCase());
        const wantedIndex = parseInt(args[1]) - 1;
        array_move(gameQueue, firstIndex, wantedIndex);
        client.say(target, `Moved ${args[0]} to position ${wantedIndex + 1}`);
    } else if (command === '!move_end' && checkPermission(context)) {
        const firstIndex = gameQueue.indexOf(args[0].substring(1).toLowerCase());
        const wantedIndex = gameQueue.length - 1;
        array_move(gameQueue, firstIndex, wantedIndex);
        client.say(target, `Moved ${args[0]} to the end`);
    } else if (command === '!setme_last') {
        const firstIndex = gameQueue.indexOf(context['display-name'].toLowerCase());
        const wantedIndex = gameQueue.length - 1;
        array_move(gameQueue, firstIndex, wantedIndex);
        client.say(target, `Moved ${args[0]} to the end`);
    } else if (command === '!lurk') {
        let data;
        data = db.get('users')
            .find({user: context['display-name'].toLowerCase()})
            .value();
        if (data === undefined) {
            data = db.get('users')
                .find({id: context['user-id']})
                .value();
        }
        if (data === undefined) {
            db.get('users')
                .push({id: context['user-id'], user: context['display-name'].toLowerCase(), boops: 0, lurking: true})
                .write();
        } else {
            db.get('users')
                .find({id: context['user-id']})
                .assign({'lurking': true, user: context['display-name'].toLowerCase()})
                .write();
        }
        client.say(target, `@${context['display-name']} is now lurking!`);
    } else if (command === '!top_boop' && !cooldowns[CommandEnum.top]) {
        checkBoopTop(target);
        cooldowns[CommandEnum.top] = 1;
        setTimeout(function () {
            cooldowns[CommandEnum.top] = 0;
        }, 120000);
    } else if (command === '!spam' && checkPermission(context)) {
        let spamMessage = '';
        // console.log(typeof parseInt(args[0]));
        // spamMessage = msg.substring(6);
        if (isNaN(parseInt(args[0]))) {
            client.say(target, 'Please use the new format: !spam < number of minutes between messagegs > <spam messagge>');
            return;
        }
        for (let i = 1; i < args.length; ++i) {
            spamMessage += (args[i] + " ");
        }
        // console.log(spamMessage);
        client.say(target, `Right on it, sir! Every ${parseInt(args[0])} minutes @${context.username}`);
        let spamID = (new Date()).getTime().toString();
        shouldSpam[spamID] = true;
        setTimeout(sendInfo, parseInt(args[0]) * 60000, spamMessage, target, spamID, parseInt(args[0]) * 60000);
    } else if ((command === '!stopspam' || command === '!stop_spam') && checkPermission(context)) {
        shouldSpam = {};
        client.say(target, `Stopping the spam!`);
    } else if (msg === '!github') {
        client.say(target, `Check out my spaghetti here: https://github.com/alexradu04/Tsu-Queue-Manager-Bot`);
    } else if (msg === '!help') {
        client.say(target, "List of commands: https://raw.githubusercontent.com/alexradu04/Tsu-Queue-Manager-Bot/master/help.txt")
    }
}

async function sendInfo(info, target, spamID, time) {
    if (shouldSpam[spamID] !== true) {
        return;
    }
    tsuStream = await helixApi.streams.getStreamByUserName(broadcasterUsername);
    if(tsuStream === null) {
        shouldSpam = {};
        client.say(target, `Stream offline - Stopping the spam!`);
        return;
    }
    client.say(target, info);
    setTimeout(sendInfo, time, info, target, spamID, time);
}

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        let k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
}

async function getInfo(username) {

    let resp = await (await fetch(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
            "headers": {
                "Client-ID": process.env.client_id,
                "Authorization": "Bearer " + process.env.access_token
            }
        }
    )).json();
    if(resp['status'] === 400)
        return undefined;
    console.log(resp);
    return resp['data'][0];
}

function checkPermission(context) {
    return context.mod || context.username === 'tsukunertov' || context.username === 'mcwolf04';
}

function checkBoopTop(target) {

    let rawdata = fs.readFileSync('db.json');
    let dbData = JSON.parse(rawdata);
    let dbEntries = Object.entries(dbData)[0][1];
    let boopLeaderboard = [];
    for (let i = 0; i < dbEntries.length; ++i) {
        let boop = dbEntries[i];
        boopLeaderboard.push([boop['user'], boop['boops']])
    }
    boopLeaderboard.sort(function (a, b) {
        return b[1] - a[1];
    })
    client.say(target, `Top 3 most booped are: ${boopLeaderboard[0][0]} with ${boopLeaderboard[0][1]}, ${boopLeaderboard[1][0]} with ${boopLeaderboard[1][1]}, and ${boopLeaderboard[2][0]} with ${boopLeaderboard[2][1]} [${emoji.get('no_entry')} 2m]`)
}

function checkLemming(msg) {
    msg = msg.toLowerCase();
    const when = 'when';
    const fortnite = 'fortnite';
    const time = 'time';
    return (msg.includes(when) && msg.includes(fortnite)) || (msg.includes(time) && msg.includes(fortnite));
}