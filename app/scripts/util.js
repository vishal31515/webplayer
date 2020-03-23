var Util = (function() {
  var API_URL = 'https://api.papereed.com/rest/v0.5';
  /* Utility method
   * Format x seconds to mm:ss
   */
  var formatMinSec = function(time, includeText) {
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;

    var finalTime;
    if (includeText) finalTime = minutes + 'min ' + _str_pad_left(seconds, '0', 2) + 's';
    else finalTime = minutes + ':' + _str_pad_left(seconds, '0', 2);
    return finalTime;
  };

  var _str_pad_left = function(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  };

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * Using Math.round() will give you a non-uniform distribution!
   */
  var random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var randomTime = function(start, end) {
    // get the difference between the 2 dates, multiply it by 0-1,
    // and add it to the start date to get a new date

    var diff = end.getTime() - start.getTime();
    var new_diff = diff * Math.random();
    var date = new Date(start.getTime() + new_diff);
    return date;
  };

  var getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  var getRandomSessionId = function() {
      var array = new Uint32Array(4);
      var cryptoObj = window.crypto || window.msCrypto; // for IE 11
      cryptoObj.getRandomValues(array);

      var id = "";
      array.forEach(function(entry) {
            id = id.concat(entry.toString(36));
        });
      return id;
  };

  var setCookie = function(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

var getCookie = function(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

  return {
    API_URL: API_URL,
    formatMinSec: formatMinSec,
    randomTime: randomTime,
    random: random,
    getRandomColor: getRandomColor,
    getRandomSessionId: getRandomSessionId,
    getCookie: getCookie,
    setCookie: setCookie,
  };
})();
