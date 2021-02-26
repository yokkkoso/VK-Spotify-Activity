/* eslint-disable no-console */
const easyvk = require('easyvk');
const fetch = require('node-fetch');

require('dotenv').config();

let accessToken,
captchaNeeded = false,
statusToggle = true,
tokenExpirationEpoch;

function getCommas(array, comma) {
    let string = '';
    for (let index = 0; index < array.length; index++) {
        if (index === array.length - 1) {
            const poped = array.pop();
            string += `${poped.name}`;
            return string;
        }
        string += `${array[index].name}${comma} `;
    }
    return string;
}

function msToMinutesAndSeconds(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes }:${ seconds < 10 ? '0' : '' }${seconds}`;
}

async function getNewAccessTokenFromRefreshToken() {
    const params = new URLSearchParams();

    params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
    params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', process.env.SPOTIFY_REFRESH_TOKEN);

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'post',
        body: params
    }).then(res => res.json());

return {
    access_token: response.access_token,
    expires_in: response.expires_in
};

}
async function getCurrentlyPlayingSong() {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(res => res.json());

    return response;
}

const captchaHandler = ({ captcha_img, resolve: solve, vk}) => {

    captchaNeeded = true;

    vk.call('messages.send', {
        message: `Введи капчу с картинки: ${ captcha_img}`,
        user_id: vk.session.user_id,
        random_id: easyvk.randomId()
    });

    console.log('Зайди в диалог с самим собой в ВК и введи капчу.');

    vk['longpoll'].connect({}).then((connection) => {

        connection.on('message', (msg) => {

            const author = msg[3];
            const key = msg[5];

            if (author === vk.session.user_id) {
                solve(key).then(() => {

                    console.log('Капча решена корректно!');
                    captchaNeeded = false;
                    connection.close();

                }).catch(({ reCall: tryNewCall}) => {

                    console.log('Капче не решена!!!\nПробуем занова');

                    tryNewCall();
                });
            }
        });
    });

};
easyvk({
    captchaHandler,
    token: process.env.VK_ACCESS_TOKEN
}).then(vk => {
    vk['longpoll'].connect({}).then((connection) => {
        connection.on('message', (msg) => {

            const author = msg[3];
            const text = msg[5].split(' ');

            if (author === vk.session.user_id) {
                if (text && text[0] === '/status') {
                    if (text[1] && text[1] === 'set') {
                        const statusText = text.slice(2).join(' ');
                        if (statusText.length > 140) {
                            return vk.call('messages.send', {
                                message: '❌ Длина статуса не может быть больше 140 символов!',
                                user_id: vk.session.user_id,
                                random_id: easyvk.randomId()
                            });
                        }
                        process.env['DEFAULT_STATUS'] = statusText || '';
                        vk.call('messages.send', {
                            message: `✅ Новый стандартный статус изменен на: ${ statusText}` || 'Ничего',
                            user_id: vk.session.user_id,
                            random_id: easyvk.randomId()
                        });
                    }
                    if (text[1] && text[1] === 'toggle') {
                        if (statusToggle) {
                            statusToggle = false;
                            vk.call('messages.send', {
                                message: '✅ Расширенный статус ВЫКЛЮЧЕН!',
                                user_id: vk.session.user_id,
                                random_id: easyvk.randomId()
                            });
                            vk.call('status.get').then(status => {
                                if (status.text !== process.env.DEFAULT_STATUS) {
                                    const defaultStatus = process.env.DEFAULT_STATUS || '';
                                    vk.call('status.set', {
                                        text: defaultStatus
                                    });
                                }
                            });
                        } else {
                            statusToggle = true;
                            vk.call('messages.send', {
                                message: '✅ Расширенный статус ВКЛЮЧЕН!',
                                user_id: vk.session.user_id,
                                random_id: easyvk.randomId()
                            });
                        }
                    }
                }
            }
        });
    });
});

    if (!process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REDIRECT_URI || !process.env.SPOTIFY_REFRESH_TOKEN || !process.env.VK_ACCESS_TOKEN) {
        console.log('Ты это, проверь .env, ты какую-то хуйню не указал.');
        process.exit(0);
    }
    if (process.env.DEFAULT_STATUS && process.env.DEFAULT_STATUS.length > 140) {
        console.log('Текст стандартного статуса (DEFAULT_STATUS) больше 140 символов, сорян, это не я придумал, а ВК');
        process.exit(0);
    }
    getNewAccessTokenFromRefreshToken()
        .then((data) => {
            accessToken = data['access_token'];

            tokenExpirationEpoch = new Date().getTime() / 1000 + data['expires_in'];
            console.log(`Токен получен. Он сбрасывается через ${ Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) } секунд!`);

            setInterval(() => {
                if ((tokenExpirationEpoch - new Date().getTime() / 1000) <= 600) {

                    getNewAccessTokenFromRefreshToken().then((data) => {
                            tokenExpirationEpoch =
                                new Date().getTime() / 1000 + data['expires_in'];
                            console.log(`Токен обновлен. Он сбрасывается через ${ Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) } секунд!`);
                            accessToken = data['access_token'];
                        }
                    );
                }
            }, 60000);
        });
            setInterval(() => {
                if (captchaNeeded || !statusToggle) return;
                getCurrentlyPlayingSong()
                    .then((data) => {
                        easyvk({
                            captchaHandler,
                            token: process.env.VK_ACCESS_TOKEN
                        }).then(vk => {
                            vk.call('status.get').then(status => {
                                if (data.item) {
                                    const statusText = `${data['is_playing'] ? '⏸' : '▶️'} Слушаю в Spotify: ${getCommas(data.item['artists'], ', ')} - ${data.item.name} [${msToMinutesAndSeconds(data['progress_ms'])} / ${msToMinutesAndSeconds(data.item['duration_ms'])}]`;
                                    if (status.text === statusText) return;

                                    vk.call('status.set', {
                                        text: statusText
                                    }).then(() => {
                                        console.log(statusText);
                                        console.log('Статус успешно установлен!');

                                    }).catch(error => {

                                        console.log('Статус не установлен, ошибка!');
                                        console.log(error);

                                    });

                                } else {
                                    const defaultStatus = process.env.DEFAULT_STATUS || '';

                                    if (status.text === defaultStatus) return;
                                    vk.call('status.set', {
                                        text: defaultStatus
                                    }).then(() => {
                                        console.log(defaultStatus);
                                        console.log('Статус успешно установлен!');

                                    }).catch(error => {

                                        console.log('Статус не установлен, ошибка!');
                                        console.log(error);

                                    });


                                }
                            });
                        });
                    }, (err) => {
                        console.log('Something went wrong!', err);
                    });
            }, 60000);
