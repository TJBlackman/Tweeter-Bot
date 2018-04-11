const config = require('../config');
const fs = require('fs');
const Twit = require('twit');
const newTwitter = (user) => new Twit(user.twitConfig);
let Twitter;

// ========================================================
//              BOT UTILITIES | NOT EXPORTED
// ========================================================

// random number between 0 and max (-1 for 0 indexed items; e.g. arrays)
// randomNum(15) returns 0 - 14
const randomNum = function(max){
    return Math.floor(Math.random()*(max));
};
// convert bytes to MB
const getMB = function(bytes){
    return (bytes / 1e6).toFixed(2); 
}
// wait for API response with tweets
// then return only array of tweets, not all API reponse data
const queryTweets = async function(Twitter, keyWordsString){
    const keyWordsArray = keyWordsString.split(','); 
    try {
        let response = await Twitter.get('search/tweets', {
            q: keyWordsArray[randomNum(keyWordsArray.length)].trim(), 
            count: "50", 
            lang: "en",
            result_type: "mixed"
        });
        return response.data.statuses;
    }
    catch(err){ console.log(err); }
};
const base64_encode = function (file) {
    const bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}
// upload img to Twitter and await for media_ID in response
const uploadPic = async function(Twitter, img_path){
    try {
        let response = await Twitter.post('media/upload', {
            media_data: base64_encode(img_path)
        });
        return response.data.media_id_string; 
    }
    catch(err){ console.log(err); }
};
const tweetContainsBannedWords = (tweet, bannedWordsString) => {
    let passing = true; 
    bannedWordsString.split(',').forEach(word => {
        if (tweet.includes( word.trim() )) { passing = false; }
    });
    return passing; 
};
const filterBannedWords = (tweets, bannedWordsString) => tweets.filter(tweet => tweetContainsBannedWords(tweet.text, bannedWordsString));
const selectOneRandomly = (array) => array[randomNum(array.length)].id_str;



// ========================================================
//              ACTUAL BOT METHODS | EXPORTED
// ========================================================

module.exports = {
    newTweet: function(user, str, img_path){
        return new Promise(async (resolve, reject) => {
            try {
                Twitter = newTwitter(user);
                if (typeof str !== "string" || str.length > 140){
                    return "Tweet exceeds Twitter requirements.";
                }
                const options = { status: str };
                if (img_path){ options.media_ids = await uploadPic(Twitter, img_path); }
                const tweet = await Twitter.post('statuses/update', options);
                if (tweet.data.errors){ reject('some error'); }
                resolve(tweet.data);
            }
            catch(er) { reject(er); }
        });
    },
    reTweet: async function(user){
        return new Promise(async (resolve, reject) => {
            Twitter = newTwitter(user);
            try {
                let tweets = await queryTweets(Twitter,user.keywords.retweets);
                tweets = filterBannedWords(tweets, user.keywords.banned);
                let attempts = 0; 
                let success = false; 
                while (!success && attempts < 5){
                    attempts += 1; 
                    let selectedId = selectOneRandomly(tweets); 
                    let tweet = await Twitter.post('statuses/retweet', {id: selectedId});
                    if (!tweet.data.errors){
                        success = true; 
                        console.log('Retweeted!');
                        resolve(tweet.data); 
                    } else if (attempts >= 5){
                        reject('Could not find new tweet to retweet');
                    }
                }
            }
            catch(err){ 
                console.log(err); 
            }
        });
    },
    likeTweet: function(user){
        return new Promise(async (resolve, reject) => {
            Twitter = newTwitter(user);
            try {
                let tweets = await queryTweets(Twitter,user.keywords.likes);
                tweets = filterBannedWords(tweets, user.keywords.banned);
                let attempts = 0; 
                let success = false; 
                while (!success && attempts < 5){
                    attempts += 1; 
                    let selectedId = selectOneRandomly(tweets); 
                    let tweet = await Twitter.post('favorites/create', {id: selectedId,tweet_mode: "extended"});
                    if (!tweet.data.errors){
                        success = true; 
                        console.log('liked!');
                        resolve(tweet.data); 
                    } else if (attempts >= 5){
                        reject('Could not find new tweet to like');
                    }
                }
            }
            catch(err){ 
                console.log(err); 
            }
        });
    },
    getAccountData: async function(user){
        Twitter = newTwitter(user);
        const data = await Twitter.get('account/verify_credentials');
        return data.data;
    },
    retweet: function(user, tweetId){
        return new Promise(async (resolve, reject) => {
            Twitter = newTwitter(user);
            let tweet = await Twitter.post('statuses/retweet', {id: tweetId, trim_user: 1});
            if (tweet.data.errors){ reject('Error'); }
            resolve(tweet.data);
        });
    },
    unretweet: function(user, tweetId){
        return new Promise(async (resolve, reject) => {
            Twitter = newTwitter(user);
            let tweet = await Twitter.post('statuses/unretweet', {id: tweetId, trim_user: 1});
            if (tweet.data.errors){ reject('Error'); }
            resolve(tweet.data);
        });
    },
    like: function(user, tweetId){
        return new Promise(async (resolve, reject) => {
            Twitter = newTwitter(user);
            let tweet = await Twitter.post('favorites/create', {id: tweetId, include_entities: false});
            if (tweet.data.errors){ reject('Error'); }
            resolve(tweet.data);
        });
    },
    unlike: function(user, tweetId){
        return new Promise(async (resolve, reject) => {
            Twitter = newTwitter(user);
            let tweet = await Twitter.post('favorites/destroy', {id: tweetId, include_entities: false});
            if (tweet.data.errors){ reject('Error'); }
            resolve(tweet.data);
        });
    }
}