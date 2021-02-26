/* eslint-disable no-console */
require('dotenv').config();
const fetch = require('node-fetch');

const args = process.argv;
const providedCode = args.length === 3 && Boolean(args[2]) === true;

if (!providedCode) {
	console.log('Укажи код авторизации Spotify.');
	console.log('Пример использования:');
	console.log('');
	console.log('npm run get-refresh-token <код>');
	console.log('');
	process.exit(0);
}

const code = args[2];

async function printRefreshToken() {
	const params = new URLSearchParams();

	params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
	params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);
	params.append('grant_type', 'authorization_code');
	params.append('code', code);
	params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'post',
		body: params
	}).then(res => res.json());

	console.log('Ниже твой refresh token: ');
	console.log('');
	console.log(`===> ${response['refresh_token']}`);
	console.log('');
	console.log('Скопируй и вставь его в .env файл в \'SPOTIFY_REFRESH_TOKEN\', после =');
	process.exit(0);
}

printRefreshToken();
