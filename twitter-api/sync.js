const Twitter = require('../bot_files/bot');


module.exports = async function(user){
  const data = await Twitter.getAccountData(user);
  user.twitterInfo = {
    id_str:             data.id_str,
    name:               data.name,
    screen_name:        data.screen_name,
    created_at:         data.created_at,
    followers_count:    data.followers_count,
    friends_count:      data.friends_count,
    favourites_count:   data.favourites_count,
    statuses_count:     data.statuses_count,
    time_zone:          data.time_zone,
    profile_image_url:  data.profile_image_url,
    profile_image_url_lg:  data.profile_image_url.replace('_normal.jpg','_400x400.jpg'),
    profile_banner_url: data.profile_banner_url,
  };
};
