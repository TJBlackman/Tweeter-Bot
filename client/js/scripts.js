var 
modal = $('.modal'),
// recieve form element, gather all data from it, return obj
gatherFormData = function(formEl){
  var formValues = {}; 
  $(formEl)
    .find('input, textarea, select')
    .each(function(index, element){
      if (element.name === "") { return; }
      formValues[element.name] = element.value; 
    });
  return {
    url: formEl.action,
    method: formEl.attributes.method.value,
    data: formValues
  }; 
},
// 
submitForm = function(event){
  var btn = $(event.target),
    form = btn.closest('form')[0],
    action = btn.attr('data-action'),
    formValues; 
  if (action) { form.action = action; }
  formValues = gatherFormData(form);
  sendFormData(formValues);
},
// send form data using ajax
sendFormData = function(obj){
  console.log(obj);
  $.ajax({
    url: obj.url,
    method: obj.method,
    data: JSON.stringify(obj.data),
    contentType: "application/json",
    success: (data) => { console.log(data); formSuccess(data, obj); },
    error: (error) => { formError(error, obj); }
  });
},
scheduleTemplate = '<form class="schedule scheduled new" name="schedule-tweet" method="POST"><input type="hidden" name="index"><p><label>Day:</label><select name="day"> <option value="0">Daily</option><option value="1" selected="">Mondays</option><option value="2">Tuesdays</option><option value="3">Wednesdays</option><option value="4">Thursdays</option><option value="5">Fridays</option><option value="6">Saturdays</option><option value="7">Sundays</option></select></p><p><label>Time:</label><input type="time" name="time"></p><button class="submitBtn btn btn-primary" type="button" data-action="/api/schedule/tweet/update" disabled="disabled">Update</button><button class="submitBtn btn btn-danger" type="button" data-action="/api/schedule/tweet/delete">Delete</button></form>',
addNewTweetSchedule = function(data,obj){
  document.getElementById('new-tweet-schedule').reset();
  var scheduled = $('#tweet-panel .saved-schedules');
  scheduled.removeClass('d-none');
  scheduled.append(scheduleTemplate);
  scheduled.find('form.new select').val(obj.data.day).change();
  scheduled.find('form.new [name="time"]').val(obj.data.time);
  scheduled.find('form.new [name="index"]').val($('#tweet-panel .saved-schedules form').length - 1);
  scheduled.find('form.new').removeClass('new');
}, 
showUpdatedSchedule = function(serverData, formObj){
  showAlert(serverData.message);
  $('#tweet-panel input[value="'+formObj.data.index+'"]').siblings('button[data-action="/api/schedule/tweet/update"]').attr('disabled','disabled');
},
deleteTweetSchedule = function(serverData, formObj){
  showAlert(serverData.message);
  $('#tweet-panel input[value="'+formObj.data.index+'"]').closest('form').slideUp(750, function(){ $(this).remove(); });
},
addNewLikeSchedule = function(data,obj){
  document.getElementById('new-like-schedule').reset();
  var scheduled = $('#likes-panel .saved-schedules');
  scheduled.removeClass('d-none');
  scheduled.append(scheduleTemplate);
  scheduled.find('form.new select').val(obj.data.day).change();
  scheduled.find('form.new [name="time"]').val(obj.data.time);
  scheduled.find('form.new [name="index"]').val($('#likes-panel .saved-schedules form').length - 1);
  scheduled.find('form.new').removeClass('new');
}, 
showUpdatedLikeSchedule = function(serverData, formObj){
  showAlert(serverData.message);
  $('#likes-panel input[value="'+formObj.data.index+'"]').siblings('button[data-action="/api/schedule/like/update"]').attr('disabled','disabled');
},
deleteLikeSchedule = function(serverData, formObj){
  showAlert(serverData.message);
  $('#likes-panel input[value="'+formObj.data.index+'"]').closest('form').slideUp(750, function(){ $(this).remove(); });
},
addNewRetweetSchedule = function(data,obj){
  document.getElementById('new-retweet-schedule').reset();
  var scheduled = $('#retweet-panel .saved-schedules');
  scheduled.removeClass('d-none');
  scheduled.append(scheduleTemplate);
  scheduled.find('form.new select').val(obj.data.day).change();
  scheduled.find('form.new [name="time"]').val(obj.data.time);
  scheduled.find('form.new [name="index"]').val($('#retweet-panel .saved-schedules form').length - 1);
  scheduled.find('form.new').removeClass('new');
}, 
showUpdatedRetweetSchedule = function(serverData, formObj){
  showAlert(serverData.message);
  $('#retweet-panel input[value="'+formObj.data.index+'"]').siblings('button[data-action="/api/schedule/retweet/update"]').attr('disabled','disabled');
},
deleteRetweetSchedule = function(serverData, formObj){
  showAlert(serverData.message);
  $('#retweet-panel input[value="'+formObj.data.index+'"]').closest('form').slideUp(750, function(){ $(this).remove(); });
},
userUpdated = function(serverData, formObj){
  showAlert(serverData.message); 
  $('input[type="password"]').val(''); 
}, 
formSuccess = function(serverData, formObj){
  var formRoute = formObj.url.replace(location.origin, '');
  switch (formRoute){
    case "/user/register": registrationSucces(); break; 
    case "/user/login": loginSuccess(); break; 
    case "/user/email": // fall through 
    case "/user/password": userUpdated(serverData, formObj); break; 
    case "/user/keywords/likes":    // fall through 
    case "/user/keywords/retweets": // fall through  
    case "/user/keywords/banned": showAlert(serverData.message); break;  
    case "/user/apikeys": window.location.assign('/dashboard'); break; 
    case "/api/queue-tweet": window.location.reload(); break;
    case "/api/tweets/edit": confirmEditTweet(serverData); break;
    case "/api/schedule/tweet": addNewTweetSchedule(serverData, formObj); break;
    case "/api/schedule/tweet/update": showUpdatedSchedule(serverData, formObj); break; 
    case "/api/schedule/tweet/delete": deleteTweetSchedule(serverData, formObj); break; 
    case "/api/schedule/like": addNewLikeSchedule(serverData, formObj); break;
    case "/api/schedule/like/update": showUpdatedLikeSchedule(serverData, formObj); break; 
    case "/api/schedule/like/delete": deleteLikeSchedule(serverData, formObj); break; 
    case "/api/schedule/retweet": addNewRetweetSchedule(serverData, formObj); break;
    case "/api/schedule/retweet/update": showUpdatedRetweetSchedule(serverData, formObj); break; 
    case "/api/schedule/retweet/delete": deleteRetweetSchedule(serverData, formObj); break; 
    case "/api/tweet-now": tweetNow(serverData); break; 
    default: console.log('What do I do with this form?'); 
  }
},
tweetNow = function(serverData, formObj){
  showAlert(serverData.message); 
  $('#post-tweet textarea').val("");
  $('#post-tweet .submitBtn').blur();
},
confirmEditTweet = function(data){
  var newTweet = modal.find('textarea').val(),
      id = modal.find('input').val(),
      tweetListing = $('.tweet-list-item[data-id="'+id+'"]');
  tweetListing.find('.tweet-body').text(newTweet);
  tweetListing.find('.tweet-date').text(new Date().toLocaleDateString());
  showAlert(data.message); 
  modal.modal('hide');
},
showAlert = function(str){
  $('.alert').alert('close');
  var alert = '<div class="alert alert-success fade show" role="alert">'+str+'</div>'; 
  $('.main').append(alert);
  setTimeout(function(){ $('.alert').alert('close'); }, 5000);
},
showErrorAlert = function(str){
  $('.alert').alert('close');
  var alert = '<div class="alert alert-danger fade show" role="alert">'+str+'</div>'; 
  $('.main').append(alert);
  setTimeout(function(){ $('.alert').alert('close'); }, 5000);
}, 
formError = function(error, obj){
  console.log(error.responseText);
  showErrorAlert(error.responseText);
},
registrationSucces = function(){
  window.location.assign('/settings?newuser=true');
},
loginSuccess = function(){
  window.location.assign('/dashboard');
},
listingUpOne = function(id){
  var tweet = $('[data-id='+id+']'); 
  if (tweet.prev().length){
    tweet.insertBefore(tweet.prev());
  } else {
    tweet.insertAfter(tweet.siblings(':last'));
  }
},
listingDownOne = function(id){
  var tweet = $('[data-id='+id+']'); 
  if (tweet.next().length){
    tweet.insertAfter(tweet.next());
  } else {
    tweet.insertBefore(tweet.siblings().eq(0));
  }
},
limitChars = function(e){
  length = this.value.length; 
  if (length === 140 && e.keyCode !== 8){ e.preventDefault(); }
};

$('body').on('click', '.submitBtn', submitForm);

// show modal on settings page if new user
if (window.location.href.includes('newuser=true')){
  $('.modal').modal('show');
  $('button[href="#api-panel"]').click();
}

// toggle input.type = password/text
$('body').on('click', '.show-input', function(e){
  var input = $(e.target).closest('span').prev('input')[0];
  input.type = (input.type === 'password') ? 'text' : 'password';
});

// twitter sync button 
$('#twitter-sync').on('click', function(){
  $.ajax({
    url: '/api/sync',
    method: 'get',
    success: function(data){ 
      showAlert(data.message);
    },
    error: function(error){ formError(error); }
  });
});

$('.tweet-up').click(function(event){
  var tweetId = $(event.target).closest('li').data('id'); 
  $.ajax({
    url: `/api/tweets/moveup`,
    method: 'put',
    data: JSON.stringify({id: tweetId}),
    contentType: "application/json",
    success: function(data){
      if (data.message){
        showAlert(data.message);
        listingUpOne(tweetId);
      }
    },
    error: (error) => { formError(error); }
  });
});

$('.tweet-down').click(function(event){
  var tweetId = $(event.target).closest('li').data('id'); 
  $.ajax({
    url: `/api/tweets/movedown`,
    method: 'put',
    data: JSON.stringify({id: tweetId}),
    contentType: "application/json",
    success: function(data){
      if (data.message){
        showAlert(data.message);
        listingDownOne(tweetId);
      }
    },
    error: (error) => { formError(error); }
  });
});

$('.tweet-delete').click(function(event){
  var tweetId = $(event.target).closest('li').data('id'); 
  $.ajax({
    url:`/api/tweets/${tweetId}`,
    method: 'delete',
    success: function(data){
      if (data.message === "Tweet deleted!"){
        showAlert(data.message);
        $('[data-id='+tweetId+']').fadeOut(300, function(){
          $(this).remove();
        });
      }
    },
    error: function(er){ console.log(er); }
  });
});

$('.tweet-retweet').click(function(event){
  var parentLi = $(event.target).closest('li'),
      tweetId = parentLi.data('id'),
      route = (parentLi.hasClass('retweeted')) ? 'unretweet' : 'retweet';
  console.log(tweetId);
  $.ajax({
    url:`/api/tweet/${route}`,
    method: 'post',
    data: JSON.stringify({id: tweetId}),
    contentType: "application/json",
    success: function(data){
      showAlert(data.message);
      parentLi.toggleClass('retweeted');
      event.target.blur(); 
    },
    error: function(er){ console.log(er); }
  });
});

$('.tweet-like').click(function(event){
  var parentLi = $(event.target).closest('li'),
      tweetId = parentLi.data('id'),
      route = (parentLi.hasClass('liked')) ? 'unlike' : 'like';
  console.log(tweetId);
  $.ajax({
    url:`/api/tweet/${route}`,
    method: 'post',
    data: JSON.stringify({id: tweetId}),
    contentType: "application/json",
    success: function(data){
      showAlert(data.message);
      parentLi.toggleClass('liked');
      event.target.blur(); 
    },
    error: function(er){ console.log(er); }
  });
});

$('.tweet-edit').click(function(event){
  var target = $(event.target),
      id = target.closest('li').data('id'),
      tweet = target.closest('.tweet-list-item').find('.tweet-body').text();
  modal.find('textarea').text(tweet);
  modal.find('input[type="hidden"]').val(id);
  modal.modal('show');
});

$('.tab-content').on('change', '.scheduled', function(e){
  var form = $(e.target).closest('form');
  if (!form.hasClass('new')) {
    form.find('[disabled]').removeAttr('disabled');
  }
})

$('.enableFeature input').on('click',function(e){
  $.ajax({
    url: $(e.target).data('action'),
    method: 'put',
    data: JSON.stringify({status: e.target.checked}),
    contentType: "application/json",
    success: function(data){
        showAlert(data.message);
        var panel = $(e.target).closest('.tab-pane').find('.settings-panel');
        (e.target.checked) ? panel.removeClass('sheild') : panel.addClass('sheild');
    },
    error: (error) => { formError(error); }
  });
})

$('.row.register-row .btn').click(function(){
  $('html, body').animate({
      scrollTop: 0
  }, 1000);
  $('#signup-form input[type="email"]').focus();
});

$('#post-tweet > textarea').on('keydown', limitChars);

$('#navbarSupportedContent > ul > li:nth-child(3) > a').click(function(e){
  e.preventDefault(); 
  $.ajax({
    url: "/user/logout",
    method: "get",
    success: function(data){ window.location.assign("/"); }, 
    error: function(e){ console.log(e); }
  })
})