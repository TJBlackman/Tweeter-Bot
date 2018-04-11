const config = require('../config'),
    fs = require('fs'),
    Twit = require('twit'),
    Twitter = new Twit({
        consumer_key:         config.consumer_key,
        consumer_secret:      config.consumer_secret,
        access_token:         config.access_token,
        access_token_secret:  config.access_token_secret,
        timeout_ms:           1000 * 15,
    }),
    Stream = Twitter.stream('user');

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
const queryTweets = async function(){
    try {
        let response = await Twitter.get('search/tweets', {
            q: config.search_terms[randomNum(config.search_terms.length)], 
            count: 100, 
            result_type: "popular"
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
const uploadPic = async function(img_path){
    try {
        let response = await Twitter.post('media/upload', {
            media_data: base64_encode(img_path)
        });
        return response.data.media_id_string; 
    }
    catch(err){ console.log(err); }
};
// accepts twitter account ID and follows that user
// this function is exported
const followUser = function(ID){
    if (!ID) { return "Must provide valid UserID"; }
    Twitter.post('friendships/create', 
        {user_id: ID, follow: true}, 
        function(err, resp){
             if (err) { console.log('followUser Error: ', err); return; }
            // console.log(response);
        }
    );
}
// on follow, wait 30s, follow user back
Stream.on('follow', function(response){ 
    setTimeout(function(){
        followUser(response.source.id_str);
        console.log('Followed: '+response.source.id_str);
    }, 1000 * 30)
 }); 

// get twitter banner image
const getAccountData = function(){
  Twitter.get('account/verify_credentials')
    .then((data) => {
      console.log(data.data)
    });
}


// ========================================================
//              ACTUAL BOT METHODS | EXPORTED
// ========================================================

module.exports = {
    newTweet: async function(str, img_path){
        if (typeof str !== "string" || str.length > 140){
            return "Tweet exceeds Twitter requirements.";
        }
        const options = { status: str };
        if (img_path){ options.media_ids = await uploadPic(img_path); }
        Twitter.post('statuses/update', options, function(err, response){
            if (err) { console.log('newTweet Error: ', err); return; }
            // console.log(response); 
        });
    },
    reTweet: async function(){
        try {
            let tweets = await queryTweets();
            Twitter.post('statuses/retweet', 
                {id: tweets[randomNum(tweets.length)].id_str}, 
                function(err, response){
                    if (err) { console.log('Post reTweet Error: ', err); return; }
                    // console.log(response);
                }
            );
        }
        catch(err){ console.log(err); }
    },
    likeTweet: async function(){
        try {
            let tweets = await queryTweets();
            Twitter.post('favorites/create', 
                {id: tweets[randomNum(tweets.length)].id_str}, 
                function(err, response){
                    if (err) { console.log('Post reTweet Error: ', err); return; }
                    // console.log(response);
                }
            );
        }
        catch(err){ console.log(err); }
    },
    followUser: followUser
}
