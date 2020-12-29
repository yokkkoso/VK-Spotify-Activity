const easyvk = require("easyvk");
const axios = require("axios");
const readline = require("readline");

require("dotenv").config()

let accessToken;
let captchaNeeded = false;
let tokenExpirationEpoch;

function getCommas(array){
    let string = '';
    for(let index = 0; index < array.length; index++){
        if(index === array.length-1){
            let poped =  array.pop();
            string+=`${poped.name}`
            return string;
        }
        string+=`${array[index].name}, `
    }
    return string;
}

function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

async function getNewAccessTokenFromRefreshToken(){
    const params = new URLSearchParams();

    params.append('client_id', process.env.SPOTIFY_CLIENT_ID)
    params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET)
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', process.env.SPOTIFY_REFRESH_TOKEN);

    const response = await axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        params
    });

return {access_token:response["data"].access_token, expires_in:response["data"].expires_in}

}
async function getCurrentlyPlayingSong() {
    const response = await axios({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return response["data"]
}


changeStatus()

function changeStatus(){
    if(!process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REDIRECT_URI || !process.env.SPOTIFY_REFRESH_TOKEN || !process.env.VK_ACCESS_TOKEN) {
        console.log('Ты это, проверь .env, ты какую-то хуйню не указал.');
        process.exit(0);
    }
    if(process.env.DEFAULT_STATUS && process.env.DEFAULT_STATUS.length > 140) {
        console.log('Текст стандартного статуса (DEFAULT_STATUS) больше 140 символов, сорян, это не я придумал, а ВК');
        process.exit(0);
    }
    getNewAccessTokenFromRefreshToken()
        .then(function(data) {
        accessToken = data['access_token'];

            tokenExpirationEpoch = new Date().getTime() / 1000 + data['expires_in'];
            console.log('Токен получен. Он сбрасывается через ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' секунд!');

            setInterval(function () {
                if ((tokenExpirationEpoch - new Date().getTime() / 1000) <= 600) {

                    getNewAccessTokenFromRefreshToken().then(function(data ){
                            tokenExpirationEpoch =
                                new Date().getTime() / 1000 + data['expires_in'];
                            console.log('Токен обновлен. Он сбрасывается через ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' секунд!');
                        accessToken = data['access_token'];
                        }
                    );
                }
            }, 60000)

            const captchaHandler = ({ captcha_img, resolve: solve, vk}) => {

                const rl1 = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl1.question(`Введите капчу для картинки ${captcha_img} `, (key) => {

                    captchaNeeded = true

                    vk.call("messages.send", {
                        message: 'Введи капчу в консоль' + captcha_img,
                        user_id: vk.session.user_id,
                        random_id: easyvk.randomId()
                    })

                    solve(key).then(() => {
                        console.log('Капча решена корректно!')
                        captchaNeeded = false
                    }).catch(({ reCall: tryNewCall}) => {
                        console.log('Капче не решена!!!\nПробуем занова')

                        tryNewCall()
                    })

                })

            }
            setInterval(function () {
                if (captchaNeeded) return

                 getCurrentlyPlayingSong()
                    .then(function (data) {
                        easyvk({
                            captchaHandler,
                            token: process.env.VK_ACCESS_TOKEN
                        }).then(vk => {
                            vk.call("status.get").then(status => {
                                if (data.item) {
                                    let statusText = `${data["is_playing"] ? '⏸' : '▶️'} Слушаю в Spotify: ${getCommas(data.item["artists"])} - ${data.item.name} [${millisToMinutesAndSeconds(data["progress_ms"])} / ${millisToMinutesAndSeconds(data.item["duration_ms"])}]`
                                    if (status.text === statusText) return;
                                    console.log(statusText)

                                    vk.call("status.set", {
                                        text: statusText
                                    }).then(() => {

                                        console.log('Статус успешно установлен!')

                                    }).catch(error => {

                                        console.log('Статус не установлен, ошибка!')
                                        console.log(error)

                                    })

                                } else {
                                    let defaultStatus = process.env.DEFAULT_STATUS || '';

                                    if (status.text === defaultStatus) return;
                                    console.log(defaultStatus)
                                    vk.call("status.set", {
                                        text: defaultStatus
                                    }).then(() => {

                                        console.log('Статус успешно установлен!')

                                    }).catch(error => {

                                        console.log('Статус не установлен, ошибка!')
                                        console.log(error)

                                    })


                                }
                            })
                        })
                    }, function (err) {
                        console.log('Something went wrong!', err);
                    });
            }, 30000)

        })
}