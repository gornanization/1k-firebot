const functions = require('firebase-functions')
const thousand = require('1k')
const admin = require('firebase-admin')
const _ = require('lodash')

admin.initializeApp()

const BOTNAME_REGEX = /bot/

exports.thousandBot = functions.database.ref('/game/{roomName}')
    .onWrite(({ after: snapshot }, context) => {
        const roomName = context.params.roomName
        const state = snapshot.val()

        console.log(roomName)
        console.log(state)

        const extendedState = thousand.extendStateWithDefaults(state)
        const prefferedAction = getPreferredAction(extendedState)

        if (prefferedAction) {
            console.log(prefferedAction)
            return admin.database().ref(`/actions/${roomName}`)
                .push(prefferedAction)
        } else {
            console.log('no action for bot...')
            return Promise.resolve()
        }
    })
    
function isBot(player) {
    return !!(BOTNAME_REGEX).exec(player.id.toLowerCase())
}

function toPreferredAction(state) {
    return player => thousand.getPreferredAction(player.id, state)
}

function getPreferredAction(state) {
    return _.chain(state.players)
        .filter(isBot)
        .map(toPreferredAction(state))
        .compact()
        .first()
        .value() || null
}

/* For debugging purpose...
exports.thousandBotDebug = functions.https.onRequest((request, response) => {
    var ref = admin.database().ref(`game${request.params[0]}`)

    return ref.on('value', function (snapshot) {
        const state = thousand.extendStateWithDefaults(snapshot.val())
        const prefferedAction = getPreferredAction(state)

        if (prefferedAction) {
            return admin.database().ref(`/actions${request.params[0]}`)
                .push(prefferedAction)
                .then(() => {
                    return response.send({
                        state,
                        prefferedAction
                    })
                })
        } else {
            return response.send({
                state
            })
        }


    }, function (errorObject) {
        return response.send('xd')
    })
})
*/