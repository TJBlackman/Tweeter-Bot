const UserModel = require('../schemas/users');
const TweetModel = require('../schemas/tweet');
const TwitterBot = require('./bot');
const mongoose = require('mongoose');

const curDateString = (str) => {
    const date = new Date(); 
    const dayOfWeek = ((date.getDay() === 0) ? "7" : date.getDay().toString());
    const hours = (date.getHours().toString().length === 1) ? '0'+date.getHours().toString() : date.getHours().toString(); 
    const minutes = (date.getMinutes().toString().length === 1) ? '0'+date.getMinutes().toString() : date.getMinutes().toString(); 
    if (str === 'weekly'){
        return JSON.stringify({ day: dayOfWeek, time:  hours+':'+minutes});
    } else {
        return '"time":"'+hours+':'+minutes+'"'; 
    }
}
const getTweet = async (str) => {
    const objectId = mongoose.Types.ObjectId(str);
    const tweet = await TweetModel.findById(objectId);
    if (!tweet) { throw new Error('Tweet ObjectId not found'); }
    return tweet; 
}
const matchDayAndTime = (array) => JSON.stringify(array).includes(curDateString('weekly'));
const matchDaily = (array) => {
    array = array.filter(item => item.day === "0"); 
    return JSON.stringify(array).includes(curDateString('daily'))
};
const getTweetUrl = function(data){
    const base = 'https://www.twitter.com/';
    const user = (data.retweeted_status) ? data.retweeted_status.user.screen_name +'/' : data.user.screen_name +'/';
    const id = 'status/'+data.id_str;
    return base + user + id; 
};
const recordTwitterAccount = function(data){
    return {
        name: data.user.name,
        screen_name: data.user.screen_name,
        id: data.user.id_str,
        profile_image: data.user.profile_image_url,
        account_url: 'https://www.twitter.com/'+data.user.screen_name 
    }
};
const createTweetFromLike = function(data, user){
    return {
        tweet: data.full_text.split('https:')[0],
        createdAt: data.created_at, 
        lastUpdated: new Date, 
        twitterId: data.id_str,
        url: getTweetUrl(data),
        twitterAccount: recordTwitterAccount(data),
        creator: user._id,
        liked: true
    }
}
const createTweetFromRetweet = function(data, user){
    let tweetBody = ""; 
    if (data.full_text){
        tweetBody = data.full_text.split('https:')[0];
    } else {
        tweetBody = data.text;
    }
    return {
        tweet: tweetBody,
        createdAt: data.created_at, 
        lastUpdated: new Date, 
        twitterId: data.id_str,
        url: getTweetUrl(data),
        twitterAccount: recordTwitterAccount(data.retweeted_status),
        creator: user._id,
        retweeted: true
    }
}
const checkForAction = async (user) => {
    if (user.automation.tweet && matchDayAndTime(user.schedule.tweets) || 
        user.automation.tweet && matchDaily(user.schedule.tweets)) {
        try {
            let tweet = await getTweet(user.queue[0]);
            const twitterResponse = await TwitterBot.newTweet(user, tweet.tweet);
            tweet.postedAt = twitterResponse.created_at; 
            tweet.twitterId = twitterResponse.id_str; 
            tweet.tweeted = true; 
            tweet = await tweet.save(); 
            user.queue.shift(); 
            user = await user.save(); 
        } 
        catch(er) { console.log(er); } 
    }
    if (user.automation.like && matchDayAndTime(user.schedule.likes) || 
        user.automation.like && matchDaily(user.schedule.likes)) {
        try {
            const twitterResponse = await TwitterBot.likeTweet(user);
            let newTweet = new TweetModel(createTweetFromLike(twitterResponse, user)); 
            newTweet = await newTweet.save();
            user.tweets.push(newTweet);
            user.save(); 
        }
        catch(er){ console.log(er); }
    }
    if (user.automation.retweet && matchDayAndTime(user.schedule.retweets) || 
        user.automation.retweet && matchDaily(user.schedule.retweets)) {
            try {
                const twitterResponse = await TwitterBot.reTweet(user);
                let newTweet = new TweetModel(createTweetFromRetweet(twitterResponse, user)); 
                newTweet = await newTweet.save();
                user.tweets.push(newTweet);
                user.save(); 
            }
            catch(er){ console.log(er); }
    }
}
const getUsers = async () => {
    let users = await UserModel.find({});
    users = users.filter(user => user.queue.length || user.schedule)
    users.forEach(checkForAction); 
 }; 

module.exports = function(){
    setInterval(getUsers, 60000);
}
