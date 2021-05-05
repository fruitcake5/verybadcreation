const signalR = require("@microsoft/signalr")
const fetch = require('node-fetch')

const config = {
    planetID: ,
    authToken: ,
    prefix: 
}
let user = {}

function sendMessage(content, planetID, channelID) {
    fetch(`https://valour.gg/Channel/PostMessage?token=${config.authToken}`, {
        "headers": {
            "content-type": "application/json; charset=utf-8"
        },
        "body": JSON.stringify({ author_Id: user.id, channel_Id: channelID, content: content, id: 0, message_Index: 0, planet_Id: planetID, timeSent: new Date().toISOString() }),
        "method": "POST"
        })
}

function message(data) {
    if (data.Content.toLowerCase().startsWith(`${config.prefix}ping`) || data.Content.toLowerCase().startsWith(`${config.prefix}pong`) || data.Content.toLowerCase().startsWith(`🏓`)) {
        sendMessage(`**Pong** 🏓 \`${(Date.now()) - (new Date(data.TimeSent).getTime())}ms\``, data.Planet_Id, data.Channel_Id)
    }
}

async function start() {
    fetch(`https://valour.gg/User/GetUserWithToken?token=${config.authToken}`)
    .then(res => res.json())
    .then(async json => {
        if (!json.success) throw new Error('Invalid token')
        user = json.data
        fetch(`https://valour.gg/Channel/GetPlanetChannels?planet_id=${config.planetID}&token=${config.authToken}`)
            .then(res => res.json())
            .then(async data => {
                data = data.data
                data.forEach(async channel => {
                    const connection = new signalR.HubConnectionBuilder()
                        .withUrl("https://valour.gg/planethub")
                        .configureLogging(signalR.LogLevel.Information)
                        .build();
                    await connection.start()
                    await connection.invoke("JoinPlanet", config.planetID, config.authToken)
                    await connection.invoke("JoinChannel", channel.id, config.authToken)
                    connection.on("Relay", (data) => {
                        data = JSON.parse(data)
                        message(data)
                    })
                    connection.onclose(start)
                })
            })
    })
}

start()
