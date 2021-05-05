const signalR = require("@microsoft/signalr")
const fetch = require('node-fetch')
const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://valour.gg/planethub")
    .configureLogging(signalR.LogLevel.Information)
    .build();
const config = {
    planetID: ,
    channelID: ,
    authToken: ,
    prefix:
}
let user = {}
async function start() {
    fetch(`https://valour.gg/User/GetUserWithToken?token=${config.authToken}`)
    .then(res => res.json())
    .then(async json => {
        if (!json.success) throw new Error('Invalid token')
        user = json.data
        try {
            await connection.start()
            await connection.invoke("JoinPlanet", config.planetID, config.authToken)
            await connection.invoke("JoinChannel", config.channelID, config.authToken)
        } catch (err) {
            console.log(err)
            setTimeout(start, 5000)
        }
    })
}
connection.onclose(start)
function sendMessage(content) {
    const msg = {
        author_Id: user.id,
        channel_Id: config.channelID,
        content: content,
        id: 0,
        message_Index: 0,
        planet_Id: config.planetID,
        timeSent: new Date().toISOString()
    }
    fetch(`https://valour.gg/Channel/PostMessage?token=${config.authToken}`, {
        "headers": {
            "content-type": "application/json; charset=utf-8"
        },
        "body": JSON.stringify(msg),
        "method": "POST"
        })
}

connection.on("Relay", (data) => {
    data = JSON.parse(data)
    if (data.Content.toLowerCase().startsWith(`${config.prefix}ping`)) {
        sendMessage(`**Pong** 🏓 \`${(Date.now()) - (new Date(data.TimeSent).getTime())}ms\``)
    }
})

start()
