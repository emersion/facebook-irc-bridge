const login = require('facebook-chat-api');
const irc = require('irc')
const config = require('./config')

const client = new irc.Client(config.irc.hostname, config.irc.nick, {
	port: config.irc.port,
	secure: config.irc.secure,
	selfSigned: true,
	certExpired: true,
	channels: [config.irc.channel],
	realName: config.irc.nick,
	userName: config.irc.nick,
	debug: true,
})

client.on('registered', () => console.log('Connected to IRC'))

client.on('motd', (motd) => console.log(motd))

client.on('error', (err) => console.error(err))

login({
	email: config.facebook.email,
	password: config.facebook.password
}, (err, api) => {
	if (err) return console.error(err)

	console.log('Connected to Facebook')

	api.setOptions({ selfListen: true })

	let facebookUsers = {}
	api.getThreadInfo(config.facebook.thread, (err, info) => {
		if (err) return console.error(err)

		console.log('Topic:', info.name)
		client.send('topic', config.irc.channel, info.name)

		api.getUserInfo(info.participantIDs, (err, map) => {
			if (err) return console.error(err)
			facebookUsers = map
		})
	})

	api.listen((err, event) => {
		if (event.type != 'message') return console.log('Unhandled event:', event.type)
		if (event.threadID != config.facebook.thread) return console.log('Message in another thread:', event.threadID)

		let sender = event.senderID
		if (facebookUsers[sender]) sender = facebookUsers[sender].name

		console.log('facebook:', sender, event.body)
		client.say(config.irc.channel, formatMessage(sender, event.body))
	})

	client.on('message', (nick, to, text, msg) => {
		console.log(nick, to, text, msg)
		console.log('irc:', nick, text)
		api.sendMessage(formatMessage(nick, text), config.facebook.thread)
	})
})

function formatMessage(sender, text) {
	return sender + ': ' + text
}
