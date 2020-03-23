var PlPlayer = (function() {
  var _button = null; //the grid play button
  var _playId = null;
  var _playlist;
  var _lastProgressTimestamp = 0;

  var instance = new jPlayerPlaylist(
    {
      jPlayer: '#jquery_jplayer_1',
      cssSelectorAncestor: '#jp_container_1',
    },
    [],
    {
      playlistOptions: {
        enableRemoveControls: true,
        autoPlay: true,
        displayTime: 0,
      },
      ready: function(event) {
        // Hide the volume slider on mobile browsers. ie., They have no effect.
        if (event.jPlayer.status.noVolume) {
          $('.jp-gui').addClass('jp-no-volume');
        }
        $('#jp-clearQ').on('click', function() {
          instance.jPlayer('stop');
          _button.removeClass('playing');
          _button = null;
          _playId = null;
          Listener.movePlayer(Listener.PLAYER_HIDDEN_POS);
          $('#playbarButton').css('opacity', '0');
        });

        $('.jp-playlist').on('click', '.jp-playlist-item-remove', function() {
          var length = $('.jp-playlist li').length;

          if (length === 1) {
            if (_button) {
              _button.removeClass('playing');
              _button = null;
            }
            _playId = null;
            //$('#play-panel').css('right', '-325px');
            Listener.movePlayer(Listener.PLAYER_STATE.HIDDEN);
            $('#playbarButton').css('opacity', '0');
          } else if (length === 2) {
            $('.jp-previous, .jp-next').addClass('disabled');
          }
          if (length > 1) {
            //_adjustPlayPanelHeight(length-1);
            //_togglePlayQueue(true, length-1);
          }
        });
      },
      playing: function(event) {
        $('#playbarButton').css('opacity', '0.85');
        if (_button) {
          _button.addClass('playing');
          $('#load-indicator').hide();
        }
        Listener.movePlayer(Listener.PLAYER_STATE.SHOW);
      },
      play: function(event) {
        var current = instance.current,
          playlist = instance.playlist;
        $.each(playlist, function(index, obj) {
          if (index == current) {
            $('#currentArticleTitle').text(obj.title);
          }
        });

        AnalyticsService.sendEvent(instance.playlist[instance.current].id, "play", event.jPlayer.status.currentTime, event.jPlayer.status.playbackRate);
        _lastProgressTimestamp = event.jPlayer.status.currentTime;
      },
      pause: function(event) {
        if (_button) {
          _button.removeClass('playing');
        }
        AnalyticsService.sendEvent(instance.playlist[instance.current].id, "pause", event.jPlayer.status.currentTime, event.jPlayer.status.playbackRate);
      },
      ended: function(event) {
        AnalyticsService.sendEvent(instance.playlist[instance.current].id, "playback-completed", event.jPlayer.status.currentTime, event.jPlayer.status.playbackRate);
        _lastProgressTimestamp = 0;
      },
      seeked: function(event) {
        AnalyticsService.sendEvent(instance.playlist[instance.current].id, "seeked", event.jPlayer.status.currentTime, event.jPlayer.status.playbackRate);
      },
      rateChanged: function(event) {
        AnalyticsService.sendEvent(instance.playlist[instance.current].id, "playback-speed-changed", event.jPlayer.status.currentTime, event.jPlayer.status.playbackRate);
      },
      timeupdate: function(event) {
        if (30+_lastProgressTimestamp < event.jPlayer.status.currentTime) {
            AnalyticsService.sendEvent(instance.playlist[instance.current].id, "playback-in-progress", event.jPlayer.status.currentTime, event.jPlayer.status.playbackRate);
             _lastProgressTimestamp = event.jPlayer.status.currentTime;
         }
      },
      error: function(event) {
        $('#load-indicator').hide();
        console.log('ERROR: ' + event.jPlayer.error.message);
        console.log(event.jPlayer.error.hint);
      },
      swfPath: '../dist/jplayer',
      supplied: 'm4a, oga, mp3',
      wmode: 'window',
      useStateClassSkin: true,
      autoBlur: false,
      smoothPlayBar: true,
      keyEnabled: true,
      audioFullScreen: false,
    }
  );

  var _adjustPlayPanelHeight = function(numOfItems) {
    var listHeight = 20 + numOfItems * 44;
    var panelHeight = 200 + listHeight;
    $('#play-panel').css('height', panelHeight + 'px');

    Listener.movePlayer(Listener.PLAYER_STATE.SMALL);
  };

  var _togglePlayQueue = function(show, numOfItems) {
    if (show) {
      //show
      Listener.movePlayer(Listener.PLAYER_STATE.SMALL);
    } else {
      //hide
      var queueListHeight = 20 + numOfItems * 44;
      Listener.movePlayer('-' + queueListHeight + 'px');
    }
  };

  var setPlaylist = function(articleList, button, id) {
    if (_button) {
      _button.removeClass('playing');
    }

    _button = button;
    _playId = id;
    $('.jp-playlist ul').empty();
    $('.jp-previous, .jp-next').removeClass('disabled');

    if (articleList.length === 1) {
      $('.jp-previous, .jp-next').addClass('disabled');
    } else {
      $('.jp-previous, .jp-next').removeClass('disabled');
    }

    //_adjustPlayPanelHeight(articleList.length);

    var jPlayerplist = [];
    for (var i = 0; i < articleList.length; i++) {
      var url = articleList[i].playbacktrack.playbackLocations[0];
      jPlayerplist.push({ title: articleList[i].title, m4a: url, id: articleList[i].id});
    }

    instance.setPlaylist(jPlayerplist);

    /*var plist = document.getElementById('jp-playlist');
    	_addDraggableListListeners(tab1ArticleList);
    	new Slip(plist);*/
  };

  var isPlaying = function(id) {
    if (_playId === id) return true;
    return false;
  };

  return {
    instance: instance,
    setPlaylist: setPlaylist,
    isPlaying: isPlaying,
  };
})();
