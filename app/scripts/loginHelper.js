var LoginHelper = (function() {
  var AUTH_URL = 'https://oauth.papereed.com/oauth/token';
  var API_URL = 'https://api.papereed.com/rest/v0.5';
  var _accessToken = 'unauthorized';
  var _refreshTokenOngoing = false;
  var _previousUser = null;
  var _rememberUser = false;

  /* PUBLIC METHOD. Get an access token for user 'user'
   * Returns a Promise.
   */
  var getAccessToken = function(user, pw) {
    return _getAccessToken(true, user, pw);
  };

  /* PUBLIC METHOD. Get an access token for user 'user'
   * Returns a Promise.
   */
  var getAccessTokenA = function() {
    return _accessToken;
  };

  /* PUBLIC METHOD. Send a request to the server. The method automatically logs in
   * with user/pw.
   * Returns a Promise.
   */
  var sendRequest = function(verb, url, postbody, user, pw, rememberUser) {
    _rememberUser = rememberUser;
    if (!_rememberUser) {
      localStorage.removeItem('refresh_token');
    }
    return _sendRequest(verb, url, postbody, false, user, pw);
  };

  /* PUBLIC METHOD. Send a request to the server for the already logged in user,
   * i.e. by using the access_token already fetched.
   * Returns a Promise.
   */
  var sendRequestA = function(verb, url, postbody) {
    var deferred = $.Deferred();
    if (_accessToken !== 'unauthorized') {
      return _makeAccessedRequestA(verb, url, postbody);
    } else {
      return _sendRequest(verb, url, postbody, false, 'default@555.com', 'd3fau1t');
      //deferred.reject();
      //return deferred.promise();
    }
  };

  /* PUBLIC METHOD.
   */
  // var loginUser = function(user, pw) {
  //     return _loginUser(user, pw);
  // };

  /* PUBLIC METHOD. Does automatic login by using the refresh token. If login
   * is successful the /me User is retreived and returned in the callback.
   */
  var autoLoginA = function(callback) {
    // check if we have a refresh_token, if so we try to log in directly
    if (localStorage.getItem('refresh_token') !== null) {
      _refreshAccess(localStorage.getItem('refresh_token'), callback);
    } else {
      callback(null);
    }
  };

  var loginUserA = function(mail, pw, rememberUser) {
    var deferred = $.Deferred();

    _rememberUser = rememberUser;
    if (!_rememberUser) {
      localStorage.removeItem('refresh_token');
    }

    return _requestAccessToken('POST', AUTH_URL + '?grant_type=password&username=' + mail + '&password=' + pw, null).then(
      function successCallback(data) {
        if (data.hasOwnProperty('error') && data.error) {
          deferred.reject(data.error);
        } else if (data.hasOwnProperty('access_token')) {
          _accessToken = data.access_token;
          _previousUser = mail;
          if (_rememberUser) {
            _storeRefreshToken(name, data);
          }
          deferred.resolve();
        }

        return deferred.promise();
      },
      function errorCallback(response) {
        deferred.reject(response);
        return deferred.promise();
      }
    );
  };

  /* PUBLIC METHOD.
   */
  var logoutA = function() {
    console.log('removing');
    _accessToken = 'unauthorized';
    localStorage.removeItem('refresh_token');
  };

  /* Refresh login by using the refreshToken. On successful login the
   * logged in user is returned with the callback.
   */
  var _refreshAccess = function(refreshToken, callback) {
    var storageInfo = JSON.parse(refreshToken);
    var name = storageInfo.name;
    var token = storageInfo.refresh_token;
    var promise = _requestAccessToken('POST', AUTH_URL + '?grant_type=refresh_token&refresh_token=' + token, null);

    promise.done(function(data, status, xhr) {
      if (data.hasOwnProperty('error') && data.error) {
        logoutA();
        callback(null);
      } else if (data.hasOwnProperty('access_token')) {
        _accessToken = data.access_token;

        _sendRequest('GET', API_URL + '/me', '', null, null).then(
          function successCallback(response) {
            callback(response);
          },
          function errorCallback(response) {
            logoutA();
            callback(null);
          }
        );
      }
    });
    promise.fail(function(xhr, status, errorThrown) {
      console.log(xhr.responseJSON.error);
      console.log(xhr.responseJSON.error_description);
      logoutA();
      callback(null);

      //TODO remove spinning circle and show wome message!!
    });
  };

  /* Refresh login by using the refreshToken. On successful login the
   * logged in user is returned with the callback.
   */
  var _refreshAccessA = function(refreshToken) {
    var deferred = $.Deferred();
    var storageInfo = JSON.parse(refreshToken);
    var name = storageInfo.name;
    var token = storageInfo.refresh_token;
    return _requestAccessToken('POST', AUTH_URL + '?grant_type=refresh_token&refresh_token=' + token, null).done(function(data, status, xhr) {
      if (data.hasOwnProperty('error') && data.error) {
        console.log('error 32');
        deferred.reject();
      } else if (data.hasOwnProperty('access_token')) {
        _accessToken = data.access_token;
        deferred.resolve();
      }
      return deferred.promise();
    });
  };

  /* PUBLIC METHOD. Get an access token for user 'user'
   * Returns a Promise.
   */
  var refreshAccessToken = function(user, pw) {
    return _getAccessToken(true, user, pw);
  };

  /* Make a server request for the method. refresh tells if
   * a new access_token should be fetched or not. By default the
   * stored token is used but if no token is stored or has expired
   * a new token is fetched automatically.
   *
   * A view typically specifies: ng-click="makeRequest({{method}}, false)"
   *
   */
  var _sendRequest = function(verb, url, postbody, refresh, user, pw) {
    var deferred = $.Deferred();

    return _getAccessToken(refresh, user, pw).then(
      function successCallback(token) {
        return _makeAccessedRequest(verb, url, postbody, token, user, pw);
      },
      function errorCallback(response) {
        deferred.reject(response);
        return deferred.promise();
      }
    );
  };

  /*
   * If the user hasen't changed, retreive the stored access token
   * otherwise login the new user.
   */
  var _getAccessToken = function(refresh, user, pw) {
    var deferred = $.Deferred();

    if (_previousUser === user && !refresh && _accessToken && _accessToken !== 'unauthorized') {
      deferred.resolve(_accessToken);
    } else {
      _previousUser = user;

      _loginUser(user, pw).then(
        function() {
          deferred.resolve(_accessToken);
        },
        function() {
          deferred.reject('access token could not be retreived');
        }
      );
    }
    return deferred.promise();
  };

  /*
   * Login the user, essentially fetch and store the user's
   * access token in ram
   */
  var _loginUser = function(name, pw) {
    var deferred = $.Deferred();

    return _requestAccessToken('POST', AUTH_URL + '?grant_type=password&username=' + name + '&password=' + pw, null).then(
      function successCallback(data) {
        if (data.hasOwnProperty('error') && data.error) {
          deferred.reject(data.error);
        } else if (data.hasOwnProperty('access_token')) {
          _accessToken = data.access_token;
          if (_rememberUser) {
            _storeRefreshToken(name, data);
          }
          deferred.resolve(data);
        }

        return deferred.promise();
      },
      function errorCallback(response) {
        deferred.reject(response);
        return deferred.promise();
      }
    );
  };

  /*
   * Make a request for retreiving the access token from the oauth server.
   */
  var _requestAccessToken = function(method, url, body) {
    var contenttype = false;
    var query = '';

    if (method === 'POST') contenttype = 'application/json';
    if (body) query = body;

    var promise = $.ajax({
      type: method,
      url: url,
      dataType: 'json',
      contentType: contenttype,
      data: query,
      timeout: 3000,
    });
    return promise;
  };

  /*
   *  Make a request towards Papereed API.
   */
  var _makeAccessedRequest = function(verb, url, postbody, token, user, pw) {
    var query = '';
    var deferred = $.Deferred();

    var contenttype = false;
    if (verb === 'POST' || verb === 'PUT') {
      query = postbody;
      contenttype = 'application/json';
    }

    return $.ajax({
      method: verb,
      url: url,
      dataType: 'json',
      contentType: contenttype,
      data: query,
      headers: {
        Authorization: 'Bearer ' + token,
      },
    }).then(
      function successCallback(response) {
        _refreshTokenOngoing = false;
        deferred.resolve(response);
        return deferred.promise();
      },
      function errorCallback(response) {
        if (response.status === 401 && !_refreshTokenOngoing) {
          //unautorized, could be access token has expired, trying to refresh it
          _refreshTokenOngoing = true;
          return _sendRequest(verb, url, postbody, true, user, pw);
        } else {
          //console.log('SOMETHING WRONG: '+response.status +' '+response.statusText);
          _refreshTokenOngoing = false;
          deferred.reject(response.status + ' ' + response.statusText);
          return deferred.promise();
        }
      }
    );
  };

  /*
   *  Make a request towards Papereed API.
   */
  var _makeAccessedRequestA = function(verb, url, postbody) {
    var query = '';
    var deferred = $.Deferred();

    var contenttype = false;
    if (verb === 'POST' || verb === 'PUT') {
      query = postbody;
      contenttype = 'application/json';
    }

    return $.ajax({
      method: verb,
      url: url,
      dataType: 'json',
      contentType: contenttype,
      data: query,
      headers: {
        Authorization: 'Bearer ' + _accessToken,
      },
    }).then(
      function successCallback(response) {
        _refreshTokenOngoing = false;
        deferred.resolve(response);
        return deferred.promise();
      },
      function errorCallback(response) {
        if (response.status === 401 && !_refreshTokenOngoing) {
          //unautorized, could be access token has expired, trying to refresh it
          if (localStorage.getItem('refresh_token') !== null) {
            _refreshTokenOngoing = true;
            return _refreshAccessA(localStorage.getItem('refresh_token')).then(
              function successCallback(response) {
                return _makeAccessedRequestA(verb, url, postbody);
              },
              function errorCallback(response) {
                _refreshTokenOngoing = false;
                deferred.reject();
                return deferred.promise();
              }
            );
          } else {
            deferred.reject(response);
            return deferred.promise();
          }
        } else {
          _refreshTokenOngoing = false;
          deferred.reject(response);
          return deferred.promise();
        }
      }
    );
  };

  var _storeRefreshToken = function(name, data) {
    if (data.hasOwnProperty('refresh_token')) {
      try {
        var storageStr = '{"name":"' + name + '", "refresh_token":"' + data.refresh_token + '"}';
        localStorage.setItem('refresh_token', storageStr);
      } catch (error) {
        console.log('Could not store the refresh_token persistently');
      }
    }
  };

  return {
    getAccessToken: getAccessToken,
    getAccessTokenA: getAccessTokenA,
    refreshAccessToken: refreshAccessToken,
    sendRequest: sendRequest,
    sendRequestA: sendRequestA,
    autoLoginA: autoLoginA,
    loginUserA: loginUserA,
    logoutA: logoutA,
  };
})();
