var AnalyticsService = (function() {
  var ANALYTICS_URL = "https://io340k5h38.execute-api.eu-west-1.amazonaws.com/rest/v0.5/analytics";
    var SESSION_ID = Util.getRandomSessionId();


  var sendEvent = function(articleId, action, progress, speed) {
        var event = {"action": action};
        event.articleId = articleId;
        event.timestamp = moment().format();
        event.speed = speed;
        event.referrer = document.location.href;
        event.type = "web-player";
        event.version = "1.0";

        event.sessionId = window.SESSION_ID;
        event.position = progress;

        if (LoginController.getUser()) {
            event.userId = LoginController.getUser().id;
        }

        var data = {};
        data.events = [event];

        fetch(ANALYTICS_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers:{
                'Content-Type': 'text/plain'
            }
        }).then(function(response) {
            //console.log('Analytics Post Success:', JSON.stringify(response));
        })
        .catch(function(error) {
            console.error('Analytics Post Error:', error);
        });
    };

  return {
    sendEvent: sendEvent,
  };
})();
