var LoginController = (function() {
  var _currentUser = null;
  var _listenerCallback = null;

  var init = function(listenerCallback) {
    _listenerCallback = listenerCallback;
    LoginHelper.autoLoginA(loginCallback);
  };

  var isLoggedIn = function() {
    if (_currentUser) return true;
    return false;
  };

  var getUser = function() {
    return _currentUser;
  };

  var loginCallback = function(user) {
    _currentUser = user;
    if (_currentUser) {
     // $('#login').hide();
     // $('#logout').show();
      $('.show-when-logged-in').css('display', 'inline-block');
      $('.show-when-logged-out').css('display', 'none');

      var gradeCall = LoginHelper.sendRequestA('GET', Util.API_URL + '/me/grades', '');
      var playlistCall = LoginHelper.sendRequestA('GET', Util.API_URL + '/me/playlists/', '');

      $.when(gradeCall, playlistCall)
        .done(function(responseGrade, responsePL) {
          if (responseGrade.kind === 'grades' && responseGrade.items) {
            _currentUser.grades = responseGrade.items;
          }
          _currentUser.playlists = responsePL.items;
          _listenerCallback();
        })
        .fail(function(response) {
          console.log('failure when getting /grades or/playlists, we continue to show articles anyway');
          _listenerCallback();
        });
    } else {
      _listenerCallback();
      $('.show-when-logged-in').css('display', 'none');
      $('.show-when-logged-out').css('display', 'inline-block');
    }
  };

  /* check if a specific resource (audiotrack) is recommended (i.e. "liked") by this user.
   *
   */
  var isRecommended = function(trackId) {
    if (_currentUser && _currentUser.grades) {
      for (var i = 0; i < _currentUser.grades.length; i++) {
        if (_currentUser.grades[i].recommended && _currentUser.grades[i].resourceRef === trackId) {
          return true;
        }
      }
    }
    return false;
  };

  /* Show the login dialog with the 'view' tab
   * visible. view='first' for login view,
   * view='last' for registration view.
   */
  var login = function(view) {
    // clear old modal content each time its showed
    $('#usrname').val('');
    $('#psw').val('');
    $('#rememberUser').prop('checked', false);
    $('#badCredentials').hide();
    $('#loginModal .result-view').hide();
    $('.signup-view-b input').val('');

    $('#loginModal').modal('toggle');
    $('#loginTablist a:' + view).tab('show');
  };

  var logout = function() {
    LoginHelper.logoutA();
    _currentUser = null;
//    $('#login').show();
//    $('#logout').hide();
    $('.show-when-logged-in').css('display', 'none');
    $('.show-when-logged-out').css('display', 'inline-block');
    Playlist.clearSavedPlaylists();
    _listenerCallback();
  };

  var loginSubmit = function() {
    var username = $('#usrname').val();
    var password = $('#psw').val();
    var remember = $('#rememberUser').prop('checked');

    LoginHelper.loginUserA(username, password, remember).then(
      function successCallback(response) {
        LoginHelper.sendRequestA('GET', Util.API_URL + '/me', '').then(
          function successCallback(response) {
            loginCallback(response);
            $('#loginModal').modal('toggle');
          },

          function errorCallback(response) {
            //could not retreive requested data, show some sort of alert
            console.log('login error 12');
          }
        );
      },
      //wrong password, show notification and leave dialog open
      function errorCallback(response) {
        $('#badCredentials').show();
      }
    );
  };

  var registerUser = function() {
    var firstName = $('#registrationForm input[name=firstName]').val();
    var lastName = $('#registrationForm input[name=lastName]').val();
    var email = $('#registrationForm input[name=email]').val();
    var pw = $('#registrationForm input[name=reg-pw]').val();

    var postBody = '{';
    if (firstName) postBody += '"firstName":"' + firstName + '",';
    if (lastName) postBody += '"lastName":"' + lastName + '",';
    if (email) postBody += '"email":"' + email + '",';
    if (pw) postBody += '"password":"' + pw + '",';

    if (postBody.length > 1) postBody = postBody.substr(0, postBody.length - 1);
    postBody += '}';

    LoginHelper.sendRequestA('POST', Util.API_URL + '/open/users', postBody)
      .done(function(data) {
        $('#loginModal .result-view .reg-ok').show();
        $('#loginModal .result-view .user-exists').hide();
        $('#loginModal .result-view').show();
        Listener.sendAnalyticsEvent('onboarding', 'registration');
      })
      .fail(function(reason) {
        if (reason.responseJSON.error.indexOf('email already exists') > 0) {
          console.log('could not register user since email alredy exists ');
          $('#loginModal .result-view .reg-ok').hide();
          $('#loginModal .result-view .user-exists').show();
          $('#loginModal .result-view').show();
        } else {
          //TODO: put this in dialog too...
          console.log('could not register user due to: ' + reason.responseJSON.error);
          alert('Något gick fel (38): ' + reason.responseJSON.error);
        }
      });
  };

  /* on startup we register listeners on the forms to handle submit button disabling etc.
   *
   */
  var _registerFormListeners = function() {
    // for the registration form we verify that all form inputs contains something
    // and that password is long enough
    $('#registrationForm input').keyup(function() {
      var empty = false;
      $('#registrationForm input').each(function() {
        if ($(this).val() == '') {
          empty = true;
        }
      });

      if (empty) {
        $('.signup-view-b .submit').attr('disabled', 'disabled');
      } else {
        var email = $('#registrationForm input[name=email]').val();
        var password = $('#registrationForm input[name=reg-pw]').val();
        var passwordRepeat = $('#registrationForm input[name=reg-pw-repeat]').val();
        if (password === passwordRepeat && password.length > 5 && email.indexOf('@') > 0) {
          $('.signup-view-b .submit').removeAttr('disabled');
        } else {
          $('.signup-view-b .submit').attr('disabled', 'disabled');
        }
      }
    });

    // for the login form we verify that both password and email contains something
    // and that email also contains an '@'
    $('#login2 .form-control').keyup(function() {
      var empty = false;
      $('#login2 .form-control').each(function() {
        if ($(this).val() == '') {
          empty = true;
        }
      });
      if (empty) {
        $('#login2 .login-submit').attr('disabled', 'disabled');
      } else {
        var email = $('#login2 input[type="email"]').val();
        if (email.indexOf('@') > 0) $('#login2 .login-submit').removeAttr('disabled');
        else $('#login2 .login-submit').attr('disabled', 'disabled');
      }
    });
  };
  _registerFormListeners();

  var move = function() {
    var elem = $('#loginModal .scroller');
    if (elem.hasClass('move')) elem.removeClass('move');
    else elem.addClass('move');
    //$("#loginModal .scroller").addClass("move");
  };

  return {
    init: init,
    loginCallback: loginCallback,
    loginSubmit: loginSubmit,
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    registerUser: registerUser,
    move: move,
    isRecommended: isRecommended,
    getUser: getUser,
  };
})();
