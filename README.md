# facebook-irc-bridge

Bridge between IRC channels and Facebook chat.

## Usage

Create `config.json`:
```js
{
	"facebook": {
		"email": "root@nsa.gov",
		"password": "iLoveSnowden",
		"thread": "142232853343969"
	},
	"irc": {
		"hostname": "irc.dille.cc",
		"port": 6697,
		"secure": true,
		"nick": "sava",
		"channel": "#cc"
	}
}
```

Run `npm start`.

## License

MIT
