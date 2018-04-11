// pulling in the express router function and mounting various routes to it
const Express = require('express');
const router = Express.Router(); 
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const mongoStore = require('connect-mongo')(session);
const pages = require('./pages');
const user = require('./user');
const api = require('./api');
const config = require('../config');




// BodyParser middleware 
router.use(bodyParser.json());


// Session middlewar
router.use(session({
  secret: config.sessionSecret,
  store: new mongoStore({ url: config.mongoUrl}),
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  },
  name: "twitterBotSession",
  authenticated: false
}))


// router.use('/', function(req, res, next){
//   console.log(req.session); 
//   next(); 
// });

/* Mount path-specific routes */ 
/* -------------------------- */
router.use('/api', api); 
router.use('/user', user);
router.use('/', pages);



// 404 Page Not Found
router.use(function (req, res, next) {
  res.status(404).send("404 Page does not exist"); 
});
// 500 Error handling 
router.use(function (err, req, res, next) {
  console.log(err)
  if (err.message === "Authentication required"){
    res.redirect('/');
  } else {
    res.status(422).send(err.message);
  }
});


module.exports = router; 