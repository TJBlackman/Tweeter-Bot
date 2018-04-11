const express = require('express');
const router = express.Router(); 
const tweetModel = require('../schemas/tweet');
const userModel = require('../schemas/users');
const TwitterSync = require('../twitter-api/sync');
const TwitterBot = require('../bot_files/bot');
const ObjectId = require('mongoose').Types.ObjectId; 

const checkAuthentication = function(session){
  if (!session.authenticated){ throw new Error('Authentication required');}
}
Array.prototype.move = function (old_index, new_index) {
  if (old_index == 0 && new_index < 0){ new_index = this.length; }
  if (old_index == this.length-1 && new_index == this.length){ new_index = 0; }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
};
const convertDay = function(num){
  const days = ['daily','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays','Sundays'];
  return days[Number(num)];
}
const isExistingSchedule = (obj, array) => {
  if (array.find(item => JSON.stringify(item) === JSON.stringify(obj))){
    return 'Requested Day and Time already scheduled.'
  } else if (obj.day === "0" && array.find(item => item.time === obj.time)){
    const day = array.find(item => item.time === obj.time);
    return `Requested time already in use on ${convertDay(day.day)}.`
  } else {
    const filtered = array.filter(item => item.day === "0");
    if (filtered.find(item => item.time === obj.time)){
      return 'Requested time already in use daily.'
    } else {
      return false;
    }
  }
};

// sync with twitter account
router.get('/sync', async function(req, res, next){
  if (req.session.authenticated){
    let user = await userModel.findById(req.session.userId, 'twitConfig');
    await TwitterSync(user);
    user.save();
    res.send({message:"Sync Successful"});
  } else {
    res.send({message: "Not authenticated"});
  }
});

// get all tweets from MongoDB
router.get('/tweets', function(req, res, next){
  tweetModel.find({}, 'tweet')
    .then(function(tweetsArray){
      res.send(tweetsArray);
    })
    .catch(function(er){ console.log(er); next(); })
});

// post new tweet to MongoDB
router.post('/queue-tweet', async function(req, res, next){
  checkAuthentication(req.session);

  let tweet = new tweetModel({
    tweet: req.body.tweet,
    createdAt: new Date(),
    lastUpdated: new Date(),
    creator: req.session.userId
  });
  let user = await userModel.findById(req.session.userId, 'tweets queue');
  user.tweets.push(tweet);
  user.queue.push(tweet._id);

  [tweet, user] = await Promise.all([ tweet.save(), user.save() ]);

  res.send({massage: "Tweet saved!"});

});


// Move tweet up in queue (to be posted sooner)
router.put('/tweets/moveup', async function(req, res, next){
  try {
    checkAuthentication(req.session);
    const user = await userModel.findById(req.session.userId, 'queue');
    const tweetIndex = user.queue.findIndex(objectId => objectId.toString() === req.body.id); 
    user.queue.move(tweetIndex, tweetIndex - 1);
    await user.save(); 
    res.send({message: "Tweet moved up 1 spot!"});
  } 
  catch(err){ next(err); }
});

// Move tweet down in queue (to be posted sooner)
router.put('/tweets/movedown', async function(req, res, next){
  try {
    checkAuthentication(req.session);
    const user = await userModel.findById(req.session.userId, 'queue');
    const tweetIndex = user.queue.findIndex(objectId => objectId.toString() === req.body.id); 
    user.queue.move(tweetIndex, tweetIndex + 1);
    await user.save(); 
    res.send({message: "Tweet moved down 1 spot!"});
  } 
  catch(err){ next(err); }
});

// edit existing tweet from MongoDB
router.put('/tweets/edit', async function(req, res, next){
  try {
    checkAuthentication(req.session);
    let tweet = await tweetModel.findById(new ObjectId(req.body.id));
    tweet.tweet = req.body.tweet; 
    tweet.lastUpdated = new Date(); 
    tweet = await tweet.save();
    res.send({message: "Tweet updated!"});
  } 
  catch(err){ next(err); }
});


// delete existing tweet from MongoDB
router.delete('/tweets/:id', async function(req, res, next){
  try {
    checkAuthentication(req.session);
    let user = userModel.findById(req.session.userId);
    let tweet = tweetModel.findByIdAndRemove(new ObjectId(req.params.id));
    [user, tweet] = await Promise.all([user, tweet]);
    if (tweet.twitterId) {
      const x = await TwitterBot.unlike(user, tweet.twitterId);
      const y = await TwitterBot.unretweet(user, tweet.twitterId);
    }
    const tweetIndex = user.queue.findIndex(objectId => objectId.toString() === req.params.id);
    user.queue.splice(tweetIndex, 1);
    await user.save();
    res.send({message: "Tweet deleted!"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/tweet', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    const duplicate = isExistingSchedule(req.body, user.schedule.tweets);
    if (duplicate){ throw new Error(duplicate); }
    user.schedule.tweets.push(req.body);
    user = await user.save();  
    res.send({message: "Schedule Saved!"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/tweet/update', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    const duplicate = isExistingSchedule({day: req.body.day, time: req.body.time}, user.schedule.tweets);
    if (duplicate){ throw new Error(duplicate); }
    user.schedule.tweets.set(req.body.index, {day: req.body.day, time: req.body.time});
    user = await user.save(); 
    res.send({message: "Schedule Updated"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/tweet/delete', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    user.schedule.tweets.splice(req.body.index, 1);
    user = await user.save(); 
    res.send({message:'Schedule Deleted'});
  } 
  catch(err){ next(err); }
});

router.put('/schedule/tweet/enable', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'automation');
    user.automation.tweet = req.body.status;
    user = await user.save(); 
    let message = (req.body.status) ? "Auto-Tweeting Enabled" : "Auto-Tweeting Disabled";
    res.send({ message });
  } 
  catch(err){ next(err); }
});

router.post('/schedule/like', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    const duplicate = isExistingSchedule(req.body, user.schedule.likes);
    if (duplicate){ throw new Error(duplicate); }
    user.schedule.likes.push(req.body);
    user = await user.save();  
    res.send({message: "Schedule Saved!"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/like/update', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    const duplicate = isExistingSchedule({day: req.body.day, time: req.body.time}, user.schedule.likes);
    if (duplicate){ throw new Error(duplicate); }
    user.schedule.likes.set(req.body.index, {day: req.body.day, time: req.body.time});
    user = await user.save(); 
    res.send({message: "Schedule Updated"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/like/delete', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    user.schedule.likes.splice(req.body.index, 1);
    user = await user.save(); 
    res.send({message:'Schedule Deleted'});
  } 
  catch(err){ next(err); }
});

router.put('/schedule/like/enable', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'automation');
    user.automation.like = req.body.status;
    user = await user.save(); 
    let message = (req.body.status) ? "Auto-Liking Enabled" : "Auto-Liking Disabled";
    res.send({ message });
  } 
  catch(err){ next(err); }
});

router.post('/schedule/retweet', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    const duplicate = isExistingSchedule(req.body, user.schedule.retweets);
    if (duplicate){ throw new Error(duplicate); }
    user.schedule.retweets.push(req.body);
    user = await user.save();  
    res.send({message: "Schedule Saved!"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/retweet/update', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    const duplicate = isExistingSchedule({day: req.body.day, time: req.body.time}, user.schedule.retweets);
    if (duplicate){ throw new Error(duplicate); }
    user.schedule.retweets.set(req.body.index, {day: req.body.day, time: req.body.time});
    user = await user.save(); 
    res.send({message: "Schedule Updated"});
  } 
  catch(err){ next(err); }
});

router.post('/schedule/retweet/delete', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'schedule');
    user.schedule.retweets.splice(req.body.index, 1);
    user = await user.save(); 
    res.send({message:'Schedule Deleted'});
  } 
  catch(err){ next(err); }
});

router.put('/schedule/retweet/enable', async (req,res,next)=> {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'automation');
    user.automation.retweet = req.body.status;
    user = await user.save(); 
    let message = (req.body.status) ? "Auto-Liking Enabled" : "Auto-Liking Disabled";
    res.send({ message });
  } 
  catch(err){ next(err); }
});

router.post('/tweet/retweet', async (req, res, next) => {
  try {
    checkAuthentication(req.session);
    let user = userModel.findById(req.session.userId, 'twitConfig');
    let tweet = tweetModel.findById(new ObjectId(req.body.id), 'twitterId retweeted');
    [user, tweet] = await Promise.all([user, tweet]);
    let botResponse = await TwitterBot.retweet(user, tweet.twitterId); 
    tweet.retweeted = true; 
    tweet = tweet.save(); 
    res.send({message: "Retweet Successful"})
  } 
  catch(err){ next(err); }
});

router.post('/tweet/unretweet', async (req, res, next) => {
  try {
    checkAuthentication(req.session);
    let user = userModel.findById(req.session.userId, 'twitConfig');
    let tweet = tweetModel.findById(new ObjectId(req.body.id), 'twitterId retweeted');
    [user, tweet] = await Promise.all([user, tweet]);
    let botResponse = await TwitterBot.unretweet(user, tweet.twitterId); 
    tweet.retweeted = false; 
    tweet = tweet.save(); 
    res.send({message: "Un-Retweeted"});
  } 
  catch(err){ next(err); }
});

router.post('/tweet/like', async (req, res, next) => {
  try {
    checkAuthentication(req.session);
    let user = userModel.findById(req.session.userId, 'twitConfig');
    let tweet = tweetModel.findById(new ObjectId(req.body.id), 'twitterId liked');
    [user, tweet] = await Promise.all([user, tweet]);
    let botResponse = await TwitterBot.like(user, tweet.twitterId); 
    tweet.liked = true; 
    tweet = tweet.save(); 
    res.send({message: "Tweet Liked"});
  } 
  catch(err){ next(err); }
});

router.post('/tweet/unlike', async (req, res, next) => {
  try {
    checkAuthentication(req.session);
    let user = userModel.findById(req.session.userId, 'twitConfig');
    let tweet = tweetModel.findById(new ObjectId(req.body.id), 'twitterId liked');
    [user, tweet] = await Promise.all([user, tweet]);
    let botResponse = await TwitterBot.unlike(user, tweet.twitterId); 
    tweet.liked = false; 
    tweet = tweet.save(); 
    res.send({message: "Tweet un-liked"});
  } 
  catch(err){ next(err); }
});

router.post('/tweet-now', async (req, res, next) => {
  try {
    checkAuthentication(req.session);
    let user = await userModel.findById(req.session.userId, 'tweets queue twitConfig');
    let tweet = new tweetModel({
      tweet: req.body.tweet,
      createdAt: new Date(),
      lastUpdated: new Date(),
      creator: req.session.userId
    });
    let twitterResponse = await TwitterBot.newTweet(user, tweet.tweet);
    tweet.tweeted = true; 
    user.tweets.push(tweet);
    [user, tweet] = await Promise.all([user.save(), tweet.save()]);
    res.send({message: "Tweet successful"})
  } 
  catch(err){ next(err); }
})

module.exports = router; 