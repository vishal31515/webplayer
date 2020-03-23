var RequestHelper = (function() {
  var AUTH_URL = 'https://oauth.papereed.com/oauth/token';
  var _accessToken = null;
  var _refreshTokenOngoing = false;

  var _sendRequest = function(verb, url, postbody, refresh, user, pw) {
    var deferred = $.Deferred();
    var d2 = $.Deferred();
    _getAccessToken(refresh, user, pw)
      .done(function(token) {
        return _makeAccessedRequest(verb, url, postbody, token, user, pw, d2);
      })
      .fail(function(response) {
        console.log('_sendRequest fail');
        d2.reject(response);
        return d2.promise();
      });
    return d2.promise();
  };

  var _makeAccessedRequest = function(verb, url, postbody, token, user, pw, deferred) {
    var query = '';

    var contenttype = false;
    if (verb === 'POST' || verb === 'PUT') {
      query = postbody;
      contenttype = 'application/json';
    }

    $.ajax({
      method: verb,
      url: url,
      dataType: 'json',
      contentType: contenttype,
      data: query,
      headers: { Authorization: 'Bearer ' + token },
    })
      .done(function(data) {
        _refreshTokenOngoing = false;
        deferred.resolve(data);
        return deferred.promise();
      })
      .fail(function(response) {
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
      });

    return deferred.promise();
  };

  var _getAccessToken = function(refresh, user, pw) {
    var deferred = $.Deferred();

    if (!refresh && _accessToken) {
      deferred.resolve(_accessToken);
    } else {
      _loginUser(user, pw)
        .done(function() {
          deferred.resolve(_accessToken);
        })
        .fail(function() {
          deferred.reject('access token could not be retreived');
        });
    }
    return deferred.promise();
  };

  var _loginUser = function(name, pw) {
    var deferred = $.Deferred();

    _serverRequest('POST', AUTH_URL + '?grant_type=password&username=' + name + '&password=' + pw, null)
      .done(function(data) {
        if (data.hasOwnProperty('error') && data.error) {
          deferred.reject(data.error);
        } else if (data.hasOwnProperty('access_token')) {
          _accessToken = data.access_token;
          deferred.resolve(data);
        }

        return deferred.promise();
      })
      .fail(function(response) {
        deferred.reject(response);
        return deferred.promise();
      });
    return deferred.promise();
  };

  /*
   * Make a server request
   */
  var _serverRequest = function(method, url, body) {
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

  /* PUBLIC METHOD. Get an access token for user 'user'
   * Returns a Promise.
   */
  var refreshAccessToken = function(user, pw) {
    return _getAccessToken(true, user, pw);
  };

  var getAccessToken = function() {
    return _accessToken;
  };

  /* PUBLIC METHOD. Send a request to the server. The method automatically logs in
   * with user/pw.
   * Returns a Promise.
   */
  var sendRequest = function(verb, url, postbody, user, pw) {
    return _sendRequest(verb, url, postbody, false, user, pw);
  };

  return {
    getAccessToken: getAccessToken,
    refreshAccessToken: refreshAccessToken,
    sendRequest: sendRequest,
  };
})();
