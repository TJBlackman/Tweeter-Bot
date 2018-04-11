const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const TweetSchema = new Schema({
  tweet: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  lastUpdated:  {
    type: Date,
    required: true
  },
  postedAt: Date, 
  creator: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  tweeted: {
    type: Boolean,
    required: true,
    default: false
  },
  retweeted: {
    type: Boolean,
    required: true,
    default: false
  },
  liked: {
    type: Boolean,
    required: true,
    default: false
  },
  twitterId: String,
  url: String,
  twitterAccount: {
    name: String,
    screen_name: String, 
    id: String,
    profile_image: String,
    account_url: String
  }
});

const TweetModel = mongoose.model('tweet', TweetSchema); 

module.exports = TweetModel; 