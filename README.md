# Tweeter-Bot

### About
Tweeter Bot is a Twitter platform website for queueing tweets ahead of time. Users are able to register an account, then log into the website to programmatically Tweet, Like, and Retweet from their own account based on a super flexible schedule that they set themselves. This is ideal for businesses or any person who needs to automate their Twitter presence.

###### Twitter API Deprecated
_Sadly, Twitter completely overhauled their API, and this project no longer runs. Screenshots are available._

### Features
##### Queue Tweets
Users can queue up tweets ahead of time, by saving them through the app. Then, through the settings page, the user can set up a schedule of when the tweets should be sent out. The server will check for tweets that should be sent every second. If it finds one, it will connect to the Twitter API using the credentials provided by the user, and it will send out that tweet. 

##### Like Tweets
Through the settings page, a user can input keywords that will be searched for via the Twitter API, then the server will programmatically "Like" one of the tweets returned. This occurs based on a schedule that can be set by the user.

##### Retweet
Through the settings page, a user can input keywords that will be searched for via the Twitter API, then the server will programmatically "Retweet" one of the tweets returned. This occurs based on a schedule that can be set by the user.

##### Banned Words
Through the settings page, a user can input a series of "banned words". If a Tweet to Like or Retweet contains any of these words, the system will not Like or Retweet that Tweet, and will instead look for a new tweet to Like or Retweet.

##### Dashboard
The dashboard shows you your queued Tweets, Tweet history, Liked Tweet history, and Retweet history. It also allows you to Tweet directly to Twitter, or to queue up new tweets to be added to your custom Tweet schedule.

### Startup
App settings can be changed in the `config.js` file. You will need to configure it to use a local MongoDB, or a remote MongoDB that you have access to. To start the app, run `node server.js`, then use a browser to navigate to `localhost:PORT` where `PORT` is the number defined in the config file. 

### Technology & Skills
- HTML, CSS, JS
- LESS
- Node & Express
- Server Rendered via PUG
- Twitter API
- MongoDB & Mongoose
- Queueing & CRON Tasks
