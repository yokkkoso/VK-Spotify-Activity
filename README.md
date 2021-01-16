# VK-Spotify-Integration
Интеграция Spotify в статус VK

# Установка (*Для Windows, для Linux нужно только поменять команды во 2 шаге*)
1. Для начала нужно установить Node.js (Лучше LTS версии) - https://nodejs.org/ и git - https://git-scm.com/downloads

2. Создать папку с любым именем, открыть терминал в этой папке и прописать следующие команды:

`git clone https://github.com/yokkkoso/VK-Spotify-Integration.git`

`cd VK-Spotify-Integration`

`rename example.env .env`

`npm install`

**Не закрывай терминал, он еще понадобится**

3. Зарегистрировать приложение в https://developer.spotify.com/dashboard/

4. В настройках созданного приложения 3 шага добавить Redirect URI своего сайта (Если своего сайта нет, то можно использовать https://google.com/callback). Не забудь нажать **Add**

![Redirect URI](https://sun9-14.userapi.com/impg/zkTtLoG34lbtHCIcz19FbO-9x4PhUo11gj_vPw/tbs2BqoEmCA.jpg?size=1918x979&quality=96&proxy=1&sign=b1d6262b8e41684fb7aa68e12d4e1332&type=album)

И добавить в файл **.env** в строчку `SPOTIFY_REDIRECT_URI` указаный выше Redirect URI.

5. Скопировать с созданного приложения 3 шага Client ID и Client Secret

![Client ID и Client Secret](https://sun9-24.userapi.com/impg/9ieDXq8SzaXMVV2mQ5_DxvczfEBNarv71mSwgQ/W5o7wto4pQ4.jpg?size=1918x979&quality=96&proxy=1&sign=230a35f52c57a0f82c9a8051bee021eb&type=album)

И добавить в файл **.env** в строчки `SPOTIFY_CLIENT_ID` скопированный Client ID, а в `SPOTIFY_CLIENT_SECRET` скопированный Client Secret (*Пояснение для тупых*).

6. Для получения Refresh Token'а придется слегка похерачиться. А именно:
    1. Перейти по ссылке, изменя значения на твои:`https://accounts.spotify.com/authorize?client_id=<ТВОЙ CLIENT ID>&response_type=code&redirect_uri=<ТВОЙ REDIRECT URI>&scope=user-read-private%20user-read-currently-playing`
    2. Если ты ввел все верно, то откроется вот такая страничка (**Если ты не вошел в аккаунт Spotify в браузере, то сначала откроется страница с регистрацией**):
    ![Refresh Token ](https://sun9-56.userapi.com/impg/YeTrzqCRaTTJVRRu3uwDhF8v-n4xCmg6nrx5Jw/HP9CgiIgjBw.jpg?size=1918x979&quality=96&proxy=1&sign=9d4eb0996013dc14e049f48057214363&type=album)
       Смело нажимай **ПРИНИМАЮ**
       
    3. Далее у тебя должна открыться страничка, которую ты указал в 3 шаге. Сама страничка нахер не сдалась, а вот URL страницы будет содержать дохера непонятных символов. Нужно все, что стоит после `?code=`
    4. Очень быстро открываешь терминал из 2 шага и пишешь следующее `npm run get-refresh-token <ТВОЙ ПОЛУЧЕННЫЙ КОД>`
    5. Если 4 шаг прошел успешно, то в терминале появится следующий текст:
    ![Refresh Token](https://sun9-4.userapi.com/impg/KEQwuWeZvDEPGxnamsWa2-HdFcSfDx4lqfTS8w/elaM0yBkoGg.jpg?size=1159x124&quality=96&proxy=1&sign=42355920320008451220218b2ec1e740&type=album)
    Копируешь полученный Refresh Token в файл **.env** в строчку `SPOTIFY_REFRESH_TOKEN` и вуаля, херота с Refresh Token закончена.


7. Теперь нужен токен твоей ВК страницы. Тут все легко. Заходишь на сайт https://vkhost.github.io, выбираешь любое приложение, разрешаешь ему доступ к аккаунту и опять копируешь с URL страницы все, что находится между `access_token=` и `&expires_in`. Вставляешь токен в **.env** в строчку `VK_ACCESS_TOKEN`

### И окончательно настройка закончена.
Но, если ты зрячий чел, то ты мог заметить в **.env** строчку `DEFAULT_STATUS`. В нее ты можешь ввести все, что пожелаешь. Это будет твоим статусом, когда в Spotify не будет играть песенка (Но до 140 символов). 

Так же его можно сменить и через команду. Для этого зайди в диалог с самим собой в ВК и напиши следующюю команлу: `/status set <НОВЫЙ СТАТУС>`, но после перезапуска статуса, он сбросится, поэтому не забудь его помеянть и в `.env`

Если ты хочешь временно выключить статус, то можешь написать команду в диалоге с самим собой в ВК: `/status toggle`. Чтобы включить его обратно нужно написать эту команду еще раз.

# Запуск
Для запуска статуса необходимо лишь в терминале из 2 шага написать `node index.js`
