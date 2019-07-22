# Tweeter-Bot
A twitter platform for queueing tweets ahead of time. Users can programmatically Tweet, Like, and Retweet based on a super flexible schedule that they set themselves. This is ideal for businesses or any person who needs to automate their Twitter presence.

###### Twitter API Deprecated
_Sadly, Twitter completely overhauled their API, and this project no longer runs. Screenshots are available._

#### Queue Tweets
Users can queue up tweets ahead of time, but saving them through the app. Then, through the settings page, the user can set up a schedule of when the tweets should be sent out. The server will check for tweets that should be sent every second. If it finds one, it will connect to the Twitter API using the credentials provided by the user, and it will send out that tweet. 

#### Like Tweets
Through the settings page, a user can input keywords that will be searched for via the Twitter API, then we will programmatically "Like" one of the tweets returned. This occurs on a schedule that can be set by the user.

#### Retweet
Through the settings page, a user can input keywords that will be searched for via the Twitter API, then we will programmatically "Retweet" one of the tweets returned. This occurs on a schedule that can be set by the user.

#### Banned Words
Through the settings page, a user can input a series of "banned words". If a Tweet to Like or Retweet contains any of these words, the system will not Like or Retweet that Tweet, and will instead look for a new one.

#### Dashboard
The dashboard shows you your queued Tweets, Tweet History, Liked Tweet history, and retween History. It also allows you to tweet directly, or to queue up new tweets to be added to your schedule.

#### Technology
This is a server rendered App, using Node.js + Express. MongoDB is the database solution, and PUG is the view engine.
