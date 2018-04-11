const config        = require('./config');
const express       = require('express');
const app           = express();
const path          = require('path');
const mongoose      = require('mongoose');
const cronTasks     = require('./bot_files/cron');
const Router        = require('./routes/_router');

// connect to mongoDB with mongoose
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUrl, config.mongoDbOptions);
mongoose.connection.once('open', () => { });


// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// make sure all FED assets are available
app.use(express.static('./client'));

// import specific routes
app.use('/', Router);

// == Likes and Retweets on Given Schedule
// =======================================
cronTasks(); 
 
app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
