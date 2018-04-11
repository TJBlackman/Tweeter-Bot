const mongoose = require('mongoose'); 
const Schema = mongoose.Schema; 


const UserSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  queue: Array,
  tweets: [{
    type: Schema.Types.ObjectId,
    ref: 'tweet'
  }],
  twitConfig: {
    consumer_key: { type: String },
    consumer_secret: { type: String },
    access_token: { type: String },
    access_token_secret: { type: String },
    timeout_ms: { type: Number, default: 30000 }
  },
  keywords: {
    likes: String,
    retweets: String,
    banned: String
  },
  twitterInfo: {
    id_str: String,
    name: String,
    screen_name: String,
    created_at: Date,
    followers_count: Number,
    friends_count: Number, 
    favourites_count: Number,
    statuses_count: Number, 
    time_zone: String,
    profile_image_url: String,
    profile_image_url_lg: String,
    profile_banner_url: String
  },
  schedule: {
    tweets: [],
    likes: [],
    retweets: []
  },
  automation: {
    tweet: {
      type: Boolean, 
      default: true
    }, 
    like: {
      type: Boolean, 
      default: true
    },
    retweet: {
      type: Boolean, 
      default: true
    }
  }
}); 

const UserModel = mongoose.model('user', UserSchema); 

module.exports = UserModel; 