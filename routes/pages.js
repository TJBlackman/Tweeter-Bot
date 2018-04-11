const Express = require('express');
const Router = Express.Router(); 
const User = require('../schemas/users'); 
const TwitterSync = require('../twitter-api/sync');

const checkAuthentication = function(session){
    if (!session.authenticated){ throw new Error('Authentication required');}
}

Router.get('/', function(req, res, next){
    res.render('index', {
        authenticated: req.session.authenticated
    });
});

Router.get('/dashboard', async function(req, res, next){
    try {
        checkAuthentication(req.session);
        const user = await User.findById(req.session.userId,
            'twitterInfo queue twitConfig tweets')
            .populate('tweets');
        if (user.twitConfig.consumer_key){
            res.render('dashboard', { 
                user: user, 
                authenticated: req.session.authenticated 
            });
        } else {
            res.redirect('/settings');
        }
    }
    catch(err) { next(err); }
});

Router.get('/settings', function(req, res, next){
    checkAuthentication(req.session);
    User.findById(req.session.userId)
        .then(user => {
            res.render('settings', { 
                user: user, 
                authenticated: req.session.authenticated 
            });
        })
        .catch(next);
    
});



module.exports = Router; 
