# Twonitor

This is an express app waiting for Twitch [web-hooks](https://dev.twitch.tv/docs/api/webhooks-guide) notifications in order to monitor streaming perfomance of streamers while they're live. The app taking care of managing the subscription to notifications is [Twapp](https://github.com/g1nus/Twapp).

## Installation and setup

First of all clone the repo and then run: ```npm install```

And then you must set up the ENV variables in the same way as explained in the Twapp [readme](https://github.com/g1nus/Twapp/blob/main/README.md) (you can take a look at an example [here](https://github.com/g1nus/Twapp/blob/main/.env.example)).
A running MongoDB instance is also necessary in order to save the monitored data.

Finally, you can run the app by running: ```npm start```\
The more days you leave the app running, the more data about the streamers you will get.

## How it works

First of all, the Twitch APIs do not offer chronological data related to the performance of the streams. But only data related to the exact moment when the call is performed. So that's why this monitoring app exists.\
In fact, this app will start/stop performing periodic calls to the Twich API whenever a streamer starts/stop streaming in order build a timetable of their performance.

Whenever Twonitor receives a [```stream.online```](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#streamonline) notification from Twitch, it will fork a child process that will start fetching data related to the current status of the related stream every 10 minutes. Besides that, another child process will be forked that will take care of connecting to the [IRC](https://dev.twitch.tv/docs/irc/guide) channel of the stream and read chat messages and raids and subscriptions events. Of course all of this data will be saved inside the database (as for the chat messages, only the most frequent chat words will be saved).\
Once a [```stream.offline```](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#streamoffline) notification is received, the forked processes will be killed.


Twapp connects to the same database where Twonitor saves the data, so the data can be fetched by external clients.
