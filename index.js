const login = require('facebook-chat-api')
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

let facebookUsers = {}

login({
	email: config.facebook.email,
	password: config.facebook.password
}, (err, api) => {
	if (err) return console.error(err)

	console.log('Connected to Facebook')

	api.setOptions({ selfListen: true })

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
		if (event.threadID != config.facebook.thread) return console.log('Message in another thread:', event.threadID)

		switch (event.type) {
		case 'message':
			console.log('facebook:', event)
			client.say(config.irc.channel, formatMessage(event))
			break
		default:
			console.log('Unhandled event:', event.type)
		}
	})

	client.on('message', (nick, to, text, msg) => {
		console.log('irc:', nick, text)
		api.sendMessage(nick+': '+text, config.facebook.thread)
	})
})

function formatUser(id) {
	if (facebookUsers[id]) {
		return facebookUsers[id].name
	}
	return id
}

function formatMessage(msg) {
	let output = formatUser(msg.senderID) + ': '

	if (msg.body) {
		output += msg.body
	}

	if (msg.attachments) {
		output += msg.attachments.map(formatAttachment).join('\n')
	}

	return output
}

function formatAttachment(att) {
	switch (att.type) {
	case 'sticker':
		return 'Sticker: '+att.caption
	case 'file':
		return 'File: '+att.url
	case 'photo':
		return 'Photo: '+(att.url || att.previewUrl)
	case 'animated_image':
		return 'GIF: '+att.url
	case 'share':
		return 'Share: '+att.url
	case 'video':
		return 'Video: '+att.url
	default:
		return 'Unsupported attachment: '+att.type
	}
}
