const express = require('express');
const router = express.Router(); 
const User = require('../schemas/users');
const TwitterSync = require('../twitter-api/sync');

// utility functions 
const valuesAreEqual = function(value1, value2){
  return (value1.toLowerCase() === value2.toLowerCase()); 
}
const authSession = (session, user) => {
  session.authenticated = true;
  session.userId = user._id;
  session.save();
}
const checkAuthentication = function(session){
  if (!session.authenticated){ throw new Error('Authentication required');}
}
const validateEmail = function(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const result = re.test(email.toLowerCase());
  if (!result){ throw new Error('Invalid Email Format'); }
}

// login as user
router.post('/login', function(req, res, next){
  User.findOne({email: req.body.email})
    .then(function(user){
      if (!user) { throw new Error('User not found'); }
      else if (valuesAreEqual(req.body.email, user.email) &&
               valuesAreEqual(req.body.password, user.password)) {
        authSession(req.session, user)
        res.send({redirect: '/dashboard'});
      } else {
        throw new Error('Incorrect Password');
      }
    })
    .catch(next);
});

// create new user
router.post('/register', async function(req, res, next){
  try {
    validateEmail(req.body.email)
    const user = await User.findOne({email: req.body.email});
    if (user) { throw new Error('Email address is already registered'); }
    const newUser = await new User(req.body).save();
    authSession(req.session, newUser);
    res.send({message: "User Created", redirect: "/settings?newuser=true"})
  }
  catch(er){next(er)}
  
});

// save user API tokens
router.post('/apikeys', async function(req, res, next){
  try {
    if (!req.session.authenticated){ throw new Error('You must be authenticatd to update API keys'); }
    let user = await User.findById(req.session.userId);
    for (prop in req.body){
      user.twitConfig[prop] = req.body[prop];    
    }
    await TwitterSync(user);
    user = await user.save();
    res.send({message: "API Keys updated!"});
  }
  catch(er){ next(er); }
});

// save user API tokens
router.post('/keywords/:id', function(req, res, next){
  if (!req.session.authenticated){ throw new Error('You must be authenticatd to update keywords keys'); }
  const keywordType = req.params.id; 
  User.findById(req.session.userId)
    .then((user) => {
      user.keywords[keywordType] = req.body[keywordType];
      return user.save();
    })
    .then(data => {
      res.send({"message": "Keywords saved!"})
    })
    .catch(next);
});

router.put('/email', async (req, res, next) => {
  try {
    validateEmail(req.body.email);
    checkAuthentication(req.session);
    let user = await User.findById(req.session.userId, 'email password');
    if (user.password === req.body.password){
      user.email = req.body.email; 
    }
    user = await user.save();
    res.send({message:"Email successfully updated"});
  } 
  catch(er){ next(er); }
});

router.put('/password', async (req, res, next) => {
  try {
    checkAuthentication(req.session);
    let user = await User.findById(req.session.userId, 'email password');
    if (user.password !== req.body.current_password){
      throw new Error('Invalid Password');
    } else if (req.body.new_password !== req.body.confirm_password){
      throw new Error('New passwords must match');
    } else {
      user.password = req.body.confirm_password; 
      user = await user.save();
      res.send({message:"Password successfully updated"});
    }
  } 
  catch(er){ next(er); }
});

router.get('/logout', function(req, res, next){
  try {
    req.session.destroy();
    res.send({message: 'CY@'});
  }
  catch(er){ next(er); }
}); 


module.exports = router; 