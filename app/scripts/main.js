var Listener = (function() {
  var _PLAYER_SMALL_HEIGHT = 102;
  var _PLAYER_BIG_HEIGHT = 255;

  var PRODUCTION_URL = 'https://api.papereed.com/rest/v0.5';

  var PLAYER_STATE = { HIDDEN: 0, SMALL: 1, BIG: 2, SHOW: 3  };

  var WEBPLAYER_MODE = { STANDARD: 0, SINGLE_ARTICLE: 1, SINGLE_MAGAZINE: 2 };

  var _currentPlayerState = 0;
  var _webplayerMode = WEBPLAYER_MODE.STANDARD;
  var USE_TEST_DATA = false;
  var TEST_DATA_SETS =
    [{
        desc:'test for a single magazine (Allt om Vetenskap)',
        testMode: WEBPLAYER_MODE.SINGLE_MAGAZINE,
        testMagazine: '3f7def8e-5de8-41c4-ad8e-723caa378388',
        testArticleId: null,
        privateMode: false,
    }, {
        desc:'test for a single article (Pingstpastorn vann...)',
        testMode: WEBPLAYER_MODE.SINGLE_ARTICLE,
        testMagazine: null,
        testArticleId: '916e2c32-e61d-40eb-a32a-4b46c7c2f9af',
        privateMode: false,
    }, {
        desc:'test for a non-existing articles',
        testMode: WEBPLAYER_MODE.SINGLE_ARTICLE,
        testMagazine: null,
        testArticleId: '916e2c32-e61d-40eb-a32a-000000000000',
        privateMode: false,
    }, {
        desc:'test for a single magazine in private mode (publishState=64)',
        testMode: WEBPLAYER_MODE.SINGLE_MAGAZINE,
        testMagazine: '4cc73aea-8b4d-4cfa-bbf3-1c405d3bd8de',
        testArticleId: null,
        privateMode: true,
    }];

    var _testData = TEST_DATA_SETS[0];

  var _screenIdleTime = 6; // > _buttonFadeOutPeriod to make sure buttons fade in diectly at first interaction
  var _alertIdleTime = 0;
  var _buttonFadeOutPeriod = 10; // 10/2 = 5 seconds
  var _alertFadeOutPeriod = 3; // 0.5 seconds

  var _ascendingSortOrder = true;
  // publishdate, title, duration, listenings, likes
  var _currentSortOrder = 'publishdate';

  //title of the magazine where the "single mode"
  // article belongs.
  var _singleModeMagazine = null;

  //the article on which the share dialog is opened, needed if
  // FB is selected in 2nd step.
  var _shareableArticle = null;

  var _queryParams = null;

  var _firstPageLoaded = false;

  //used for analytic, to ensure it is not possible to press play a 100
  //times to register 100 playbacks on the same article... although if user
  //reloads the app 100 times and do play each time he will get 100 registrations...
  var _articlesPlayedAlready = [];

  $(document).ready(function() {
    Listener.initialize();
  });

  /*
    category = 'playback'|'share'
    action = article-id
    label = magazine name (for playback), social-media-name (for share)
    */
  var sendAnalyticsEvent = function(category, action, label) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  };



  /*
   * Called once at startup
   */
  var initialize = function() {
    DataStore.initialize();
    _resolveQueryParams();

    var storedLanguage = Util.getCookie('language');
    if (storedLanguage) {
        i18n.populateGui(storedLanguage);
    } else {
        var lang = navigator.language || navigator.userLanguage;
        if (lang.indexOf('sv') >= 0) {
            i18n.populateGui('sv');
        } else {
            i18n.populateGui('en');
        }
    }

    if (USE_TEST_DATA) {
        _webplayerMode = _testData.testMode;
        _queryParams.magazine = _testData.testMagazine;
        _queryParams.id = _testData.testArticleId;
        _queryParams.private = _testData.privateMode;
    }

    //cannot use js-socials for FB since it seems to use only http (not https)
    //for connection to fb Graph API.
    $('#share').jsSocials({
      //shares: ['twitter', 'linkedin', 'email'],
      shares: ['twitter', 'email'],
      shareIn: 'popup',
      showLabel: false,
      showCount: 'inside',
      on: {
        click: function(e) {
          sendAnalyticsEvent('share', this.share, _shareableArticle.id);
        },
      },
    });

    Grid.initialize();

    LoginController.init(userChangedCallback);

    $('#sortMenu').on('click', 'li a', _sort);


    /* FILTER MENU ****************************************/

    $('#filterButton').on('click', function() {
      var value = parseInt($('#menu-panel').css('right'));
      if (value < 0) {
        //show panel
        $('#menu-panel').css('right', '0px');
      }
    });

    $('#closeFilter').on('click', function() {
      var value = parseInt($('#menu-panel').css('right'));
      if (value >= 0) {
        //hide panel
        $('#menu-panel').css('right', '-323px');
      }
    });

    $('.menu-content').on('swiperight', function(e) {
      $('#menu-panel').css('right', '-323px');
    });

    // To make menu button fade out when inactive, uncomment this and set
    // display:none on .circle-button in css.
    /*var grid = $('#grid');
    grid.bind('mousemove touchmove tap swipeleft swipeup swipedown swiperight', function(e) {
        if (_screenIdleTime > 5) $('.circle-button').fadeIn('slow');
        _screenIdleTime = 0;
    });*/



    //Make buttons fade out after period of inactivity
    setInterval(function() {
      _screenIdleTime++;
      _alertIdleTime++;
      /*if (_screenIdleTime > _buttonFadeOutPeriod) {
            $('.circle-button').fadeOut('slow');
        }*/
      if (_alertIdleTime > _alertFadeOutPeriod) {
        $('#alert')
          .removeClass('in')
          .addClass('out');
      }
    }, 500);

    /* PLAYLIST MENU ****************************************/
    Playlist.initialize();
    var playlistArea = $('#playlistArea');

    $('#playlistButton').on('click', function() {
      var value = parseInt($('#playList').css('left'));
      if (value < 0) {
        //show panel
        $('#playList').css('left', '0px');
      }
    });
    $('.close-playlist-handler').on('click', function() {
      var value = parseInt($('#playList').css('left'));
      if (value >= 0) {
        //hide panel
        $('#playList').css('left', '-323px');
      }
    });

    playlistArea.on('swipeleft', function(e) {
      $('#playList').css('left', '-323px');
    });

    playlistArea.on('touchmove', function(e) {
      //console.log('moving');
    });

    /* PLAYBAR MENU ****************************************/

    $('#playbarButton').on('click', function() {
      var value = parseInt($('#play-panel').css('right'));
      if (value < 0) {
        //show panel
        movePlayer('0px');
      }
    });

    $('#closePlaybar').on('click', function() {
      var value = parseInt($('#play-panel').css('bottom'));
      if (value >= 0) {
        //hide panel
        //movePlayer('-200px');
        movePlayer(PLAYER_STATE.SMALL);
      } else {
        movePlayer(PLAYER_STATE.BIG);
      }
    });

    $('.play-panel-content').on('swipedown', function(e) {
      //movePlayer('-200px');
      movePlayer(PLAYER_STATE.SMALL);
    });

    $('.play-panel-content').on('swipeup', function(e) {
      //movePlayer('-200px');
      movePlayer(PLAYER_STATE.BIG);
    });

    // ---

    $('#magazine-filter').on('change', 'input', function(event) {
      if (event.target.checked) {
        var magazineId = DataStore.getMagazineId(event.target.value);
        sendAnalyticsEvent('filter', 'magazine', magazineId);
      }
      _filter('magazine-filter');
    });

    $('#category-filter').on('change', 'input', function(event) {
      if (event.target.checked) {
        sendAnalyticsEvent('filter', 'category', event.target.value);
      }
      _filter('category-filter');
    });
  };

  var shareOnFB = function() {
    FB.ui({
      method: 'share',
      href: 'https://www.papereed.com/play/' + _shareableArticle.id,
    });

    sendAnalyticsEvent('share', 'facebook', _shareableArticle.id);
  };

  var setLanguage = function(lang) {
      if (i18n.getCurrentLang() == lang) return;
      i18n.populateGui(lang);
      Util.setCookie('language', lang, 1000);
  }

  /* Callback from logincontroller each time the user has changed
   *
   */
  var userChangedCallback = function() {
    var user = LoginController.getUser();
    if (user) {
      gtag('set', { user_id: user.id });
      sendAnalyticsEvent('onboarding', 'login', user.id);
      gtag('event', 'custom-dim', { dimension1: user.id });
    } else {
      gtag('event', 'custom-dim', { dimension1: 'anonymous' });
    }

    //_getUserContent();
    Grid.clearGridItems();
    _firstPageLoaded = false;
    DataStore.getUserContent(_queryParams)
      .done(function() {
          var user = LoginController.getUser();
          if (user && user.playlists) Playlist.loadSavedPlaylists(user.playlists);

        //configure top menu with Magazine name
        if (_webplayerMode === WEBPLAYER_MODE.SINGLE_MAGAZINE) {
          _singleModeMagazine = DataStore.getMagazineTitle(_queryParams.magazine);
          if (_singleModeMagazine) {
            Filter.setFilter('magazine-filter', [_queryParams.magazine]);
            $('.mnb-title-mag').text(_singleModeMagazine);
            $('.single-magazine-mode').css('display', 'block');

            $('.standard-mode').css('display', 'none');
          } else {
            //handle the case when a bad magazine id is provided
            $('.single-magazine-mode').css('display', 'none');
            $('.standard-mode').css('display', 'block');
            _queryParams.magazine = null;
            _webplayerMode === WEBPLAYER_MODE.STANDARD;
          }
        } else {
          $('.single-magazine-mode').css('display', 'none');
          $('.standard-mode').css('display', 'block');
        }

        DataStore.startDataFetch(_queryParams, articlesAdded);
      })
      .fail(function(response) {
        console.log('failure when getting /grades or/playlists, we continue to show articles anyway');
      });
  };


// TODO can be removed.
 /* var allArticlesLoaded = function() {
      if(LoginController.isLoggedIn()) {
          var userPlaylists = LoginController.getUser().playlists;
          if (userPlaylists) Playlist.loadSavedPlaylists(userPlaylists);
      }
  };*/

  /* Callback from DataStore when new articles are added
   *
   */
   var articlesAdded = function() {
       if (!_firstPageLoaded) {
           if (_webplayerMode === WEBPLAYER_MODE.SINGLE_ARTICLE) {
               if (DataStore.getArticlesCount() > 0) {
                   $('.single-mode-only').css('display', 'block');
                   $('.filtered-mode').css('display', 'block');
                   $('.multi-mode-only').css('display', 'none');
                   var magRef = DataStore.getArticle(_queryParams.id).magazineRef;
                   _singleModeMagazine = DataStore.getMagazineTitle(magRef);

                   if (_queryParams.private) {
                       $('#infoModal #info-header').text('Privat artikel');
                       $('#infoModal #info-body').text('Artikeln du nu ser är privat och nås bara via denna unika länk.');
                       $('#infoModal').modal('toggle');
                   }

                   var playButton = $('.article-item .playBtn');


                   // on iOS we cannot start playback directly since it is forbidden,
                   // user must touch the screen first.
                   if (!_isIOS()) {
                       // TODO ENABLE THIS AGAIN, BUT FIX EXCEPTION THAT HAPPENS...
                        // _playArticle(playButton);
                   }
                   //console.log(e);
               } else {
                   //couldnt find article, show info modal
                   $('#infoModal').modal('toggle');
                   $('.filtered-mode').css('display', 'block');
                   $('.multi-mode-only').css('display', 'none');
               }
           }
       }
       _firstPageLoaded = true;
       $('.login-menu').css('display', 'inline-block');
   };

  var _isIOS = function() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    var iOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    return iOS;
  };

  /* To show all articles from the same magazine. Called from single-mode button:
   * 'more from xxx'
   */
  var showMoreArticles = function() {
    var magRef = DataStore.getArticle(_queryParams.id).magazineRef;
    $('input[type=checkbox][value="' + magRef + '"]').prop('checked', true);
    $('.single-mode-only').css('display', 'none');
    $('.multi-mode-only').css('display', 'inline-block');
    //Filter.sort(_currentSortOrder, _ascendingSortOrder);
    //Grid.updatePageIndex();
    _filter('magazine-filter');
  };

  /* To show all articles. Called from single-mode button:
   * 'show all'
   */
  var showAllArticles = function() {
    $('.single-mode-only').css('display', 'none');
    $('.filtered-mode').css('display', 'none');
    $('.multi-mode-only').css('display', 'inline-block');

    $('.single-magazine-mode').css('display', 'none');
    $('.standard-mode').css('display', 'block');

    $('#magazine-filter input[type=checkbox], #magazine-filter input[type=checkbox]').prop('checked', false);

    _filter('magazine-filter');
  };


  /* show alert with text, used to display playlist info when user press +-sign */
  var showAlert = function(text) {
    var w = $(window).width();
    var alert = $('#alert');
    alert.empty();
    alert.append(text);
    var alertWidth = alert.outerWidth();
    if (alertWidth === 0) alertWidth = 100;
    var xPos = w / 2 - alertWidth / 2;
    alert.css('margin-left', xPos + 'px');
    alert.removeClass('out').addClass('in');
    _alertIdleTime = 0;
  };

  /* Play button action handler.
   *
   */
  var play = function(event) {
    var button = $(event.target);
    _playArticle(button);
  };

  var _playArticle = function(button) {
    var item = button.parent().parent();
    var id = item.attr('data-id');

    if (PlPlayer.isPlaying(id)) {
      if (button.hasClass('playing')) {
        PlPlayer.instance.pause();
      } else PlPlayer.instance.play();
    } else {
      //play new track
      var article = DataStore.getArticle(id);

      var position = button.offset();
      $('#load-indicator').css(position);
      $('#load-indicator').fadeIn(300);
      $('#playbarButton').css('opacity', '0.85');

      movePlayer(PLAYER_STATE.SMALL);

      var playlist = [{ title: article.title, playbacktrack: article.playbacktrack, id: article.id }];
      PlPlayer.setPlaylist(playlist, button, id);
      PlPlayer.instance.play();

      if (_articlesPlayedAlready.indexOf(id) < 0) {
        sendAnalyticsEvent('playback', 'play', id);
        _articlesPlayedAlready.push(id);
      }
    }
  };

  /* Move the player bar into view */
  var movePlayer = function(state) {
    if (_currentPlayerState === state) return;
    if (state === PLAYER_STATE.SHOW) {
      if (_currentPlayerState === PLAYER_STATE.HIDDEN) {
        state = PLAYER_STATE.SMALL;
      } else return;
    }
    _currentPlayerState = state;
    var position;
    if (state === PLAYER_STATE.SMALL) {
      position = _PLAYER_BIG_HEIGHT - _PLAYER_SMALL_HEIGHT;
      $('#closePlaybar .opened').hide();
      $('#closePlaybar .closed').show();
    } else if (state === PLAYER_STATE.BIG) {
      position = 0;
      $('#closePlaybar .opened').show();
      $('#closePlaybar .closed').hide();
    } else if (state === PLAYER_STATE.HIDDEN) {
      position = _PLAYER_BIG_HEIGHT + 5;
    }

    $('#play-panel').css('bottom', '-' + position + 'px');
  };

  /* Method called by landing page sort buttons
   */
 /* var landingSort = function(criteria) {
      console.log(criteria);
    if (criteria.indexOf('SENASTE') >= 0 && _currentSortOrder !== 'publishdate') {
      _currentSortOrder = 'publishdate';
      $('#landingSortPopular').removeClass('active');
      $('#landingSortLatest').addClass('active');
      Filter.sort(_currentSortOrder, _ascendingSortOrder);
      $('#sortMenu .r-label').text(criteria);
      Grid.updatePageIndex();
      Grid.buildPage();
    } else if (criteria.indexOf('POPULÄRAST') >= 0 && _currentSortOrder !== 'listenings') {
      _currentSortOrder = 'listenings';
      $('#landingSortPopular').addClass('active');
      $('#landingSortLatest').removeClass('active');
      Filter.sort(_currentSortOrder, _ascendingSortOrder);
      $('#sortMenu .r-label').text(criteria);
      Grid.updatePageIndex();
      Grid.buildPage();
    }
};*/

  /*
   * Called when the 'sort by' select box is clicked. The selected sort category
   * is sent to the Filter class.
   */
  var _sort = function() {
    var criteria = $(this).text();
    var buttonText = $('#sortMenu .r-label');

    if (buttonText.text() === criteria) return;
    $('#landingSortPopular').removeClass('active');
    $('#landingSortLatest').removeClass('active');

    buttonText.text(criteria);
    Filter.changeSort(i18n.translateSortCriteria(criteria));

  };

  /*
   * iterates over all filter checkboxes and call the Filter class
   * with the checked ones.
   */
  var _filter = function(filterId) {
    var $checked = $('#' + filterId).find('input:checked');
    var groups = [];
    if ($checked.length !== 0) {
      $('.filtered-mode').css('display', 'block');
      $checked.each(function() {
        groups.push(this.value);
      });
    } else {
      $('.filtered-mode').css('display', 'none');
    }
    Filter.filter(filterId, groups);

    /*Grid.updatePageIndex();
    Grid.buildPage();*/
  };

  var setShareableArticle = function(article) {
    _shareableArticle = article;
  };

  /* Get query params if any
   *
   */
  var _resolveQueryParams = function() {
    _queryParams = {};

    _queryParams['id'] = _getQueryVariable('id');
    _queryParams['private'] = _getQueryVariable('private');
    _queryParams['magazine'] = _getQueryVariable('magazine');
    var apiUrl = _getQueryVariable('apiUrl');

    if (apiUrl) {
        DataStore.setUrl(apiUrl);
    }
    else {
        DataStore.setUrl(PRODUCTION_URL);
    }


    if (_queryParams['id']) _webplayerMode = WEBPLAYER_MODE.SINGLE_ARTICLE;
    else if (_queryParams['magazine']) _webplayerMode = WEBPLAYER_MODE.SINGLE_MAGAZINE;

    // if confilcting parameters are set we ignore everything
    if ((_queryParams.magazine && (_queryParams.id || _queryParams.private)) || (_queryParams.private && !_queryParams.id)) {
      _queryParams.magazine = false;
      _queryParams.private = false;
      _queryParams.id = false;
      _webplayerMode = WEBPLAYER_MODE.STANDARD;
    }
  };

  /* Example URL:
   *  http://www.example.com/index.php?id=1&image=awesome.jpg
   *  Calling getQueryVariable("id") - would return "1".
   */
  var _getQueryVariable = function(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return false;
  };

  return {
    PLAYER_STATE: PLAYER_STATE,
    initialize: initialize,
    play: play,
    showAlert: showAlert,
    userChangedCallback: userChangedCallback,
    showMoreArticles: showMoreArticles,
    showAllArticles: showAllArticles,
    shareOnFB: shareOnFB,
    setShareableArticle: setShareableArticle,
    /*landingSort: landingSort,*/
    articlesAdded: articlesAdded,
    movePlayer: movePlayer,
    sendAnalyticsEvent: sendAnalyticsEvent,
    setLanguage: setLanguage,
  };
})();
