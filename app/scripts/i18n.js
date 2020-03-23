var i18n = (function() {

    var sv = i18nSwedish.TRANSLATIONS;
    var en = i18nEnglish.TRANSLATIONS;

    var _currentLang = "sv";

  var init = function() {
  };

  var populateGui = function(lang) {
      _currentLang = lang;
      // Menu bar
      $('.login-text').text(i18n.getString('login'));
      $('.logout-text').text(i18n.getString('logout'));
      $('#filterButton').text(i18n.getString('filter').toUpperCase());
      $('#sortButton').text(i18n.getString('sortBy').toUpperCase());
      $('#titleSortItem').text(i18n.getString('title').toUpperCase());
      $('#popularitySortItem').text(i18n.getString('popularity').toUpperCase());
      $('#latestSortItem').text(i18n.getString('latest').toUpperCase());
      $('#durationSortItem').text(i18n.getString('duration').toUpperCase());



      // set current selected sort label
      var currentSort = DataStore.getCurrentSort();
      $('#sortMenu .r-label').text(_getSortString(currentSort).toUpperCase());

      $('#playlistButton').text(i18n.getString('playlist').toUpperCase());

      // Playlist menu
      $('.close-string').text(i18n.getString('close').toUpperCase());
      $('#selectedList').text(i18n.getString('newList'));
      $('#archive').text(i18n.getString('archive'));
      $('.duration-text').text(i18n.getString('duration'));
      $('#playlistSaveButton').text(i18n.getString('save').toUpperCase());
      $('#playlistPlayButton').text(i18n.getString('play').toUpperCase());
      $('#noArticlesInPlaylist').text(i18n.getString('noArticlesInList'));
      $('#playlistPitch').text(i18n.getString('playlistPitch'));
      $('#playlistLoginInfo').text(i18n.getString('playlistLoginInfo'));
      $('.login-here-text').text(i18n.getString('loginHere'));
      $('#emptyArchive').text(i18n.getString('emptyArchive'));
      $('#saveListText').text(i18n.getString('saveListHere'));

      //Buttons below grid
      $('#moreArticlesFromMag').text(i18n.getString('moreArticlesFromMag'));
      $('#resetFilterButton').text(i18n.getString('showAllArticles'));

      //Loading articles
      $('#articleLoaderText').text(i18n.getString('loadingArticles').toUpperCase());
      $('#loadingErrorText').text(i18n.getString('loadingArticlesError').toUpperCase());
      $('#tryReloadText').text(i18n.getString('tryReloadPage'));

      //Bottom bar
      $('#aboutPapereed').text(i18n.getString('aboutPapereed'));

      //Filter menu
      $('.magazine-string').text(i18n.getString('magazines'));
      $('.categories-string').text(i18n.getString('categories'));
      $('#articlesFromAllText').text(i18n.getString('seeFromAllPublishers'));
      $('#showAllText').text(i18n.getString('showAll'));

      //save playlist form
      $('#newPlaylistNameString').text(i18n.getString('name'));
      $('#newPlaylistName').attr("placeholder", i18n.getString('namePlaylist'));
      $('.cancel-text').text(i18n.getString('cancel'));

      //playbar text in single article mode
      $('#currentArticleTitle').text(i18n.getString('pressPlayAgain'));

      //Loading missing article error
      $('#info-header').text(i18n.getString('missingArticle'));
      $('#info-body').text(i18n.getString('missingArticleExt'));

      //Article share dialog
      $('#shareArticleText').text(i18n.getString('shareArticle'));
      $('#shareableLinkText').text(i18n.getString('shareableLink'));

      //Signup dialog
      $('.register-text').text(i18n.getString('signup'));
      $('#badCredentials').text(i18n.getString('badCredentials'));
      //login section
      $('#username-text').text(i18n.getString('username'));
      $('#usrname').attr("placeholder", i18n.getString('yourEmail'));
      $('.password-text').text(i18n.getString('password'));
      $('#psw').attr("placeholder", i18n.getString('yourPassword'));
      $('#rememberUserText').text(i18n.getString('rememberMe'));
      $('#forgotPwText').text(i18n.getString('forgotPassword'));
      //registration section
      $('#registrationTitleText').text(i18n.getString('signupTitle'));
      $('#registrationBodyText1').text(i18n.getString('signupBody1'));
      $('#registrationBodyText2').text(i18n.getString('signupBody2'));
      $('#firstNameText').text(i18n.getString('firstName'));
      $('#lastNameText').text(i18n.getString('lastName'));
      $('.email-text').text(i18n.getString('email'));
      $('#signupPwPlaceholder').attr("placeholder", i18n.getString('pwConstraint'));
      $('#pwRepeatText').text(i18n.getString('pwRepeat'));
      $('#policyText').text(i18n.getString('policyText'));
      $('#signupCompletedText').text(i18n.getString('signupSuccess'));
      $('#signupCompletedInfo').text(i18n.getString('signupSuccessInfo'));
      $('#signupFailure').text(i18n.getString('userExists'));
      $('#signupFailureInfo').text(i18n.getString('tryToLogin'));
      $('#toLoginText').text(i18n.getString('toLogin'));

      //Magazine mode titlebar
      $('#contentFromText').text(i18n.getString('contentFrom').toUpperCase());

      $('#moreText').text(i18n.getString('more').toUpperCase());
      $('#enItemText').text(i18n.getString('english').toUpperCase());
      $('#svItemText').text(i18n.getString('swedish').toUpperCase());
      $('#appLangText').text(i18n.getString('appLang').toUpperCase());




  }

  var getCurrentLang = function() {
      return _currentLang;
  }

  var _getSortString = function(sortprop) {
      if (sortprop.indexOf('listenerPublishDate') >= 0) {
          return i18n.getString('latest');
      }
      if (sortprop.indexOf('playable/duration') >= 0) {
          return i18n.getString('duration');
      }
      if (sortprop.indexOf('popularity') >= 0) {
          return i18n.getString('popularity');
      }
      if (sortprop.indexOf('title') >= 0) {
          return i18n.getString('title');
      }
  }

  /* Quick hack to cover that sorting relies on Swedish text content in sort buttons
    TODO: refactor to not use language specific identifiers. */
  var translateSortCriteria = function(criteria) {
      if (_currentLang === 'sv') return criteria;
      else if (_currentLang === 'en') {
          if (criteria.toUpperCase() === _getString('title','en').toUpperCase() ) {
              return _getString('title','sv').toUpperCase();
          }
          if (criteria.toUpperCase() === _getString('popularity','en').toUpperCase() ) {
              return _getString('popularity','sv').toUpperCase();
          }
          if (criteria.toUpperCase() === _getString('duration','en').toUpperCase() ) {
              return _getString('duration','sv').toUpperCase();
          }
          if (criteria.toUpperCase() === _getString('latest','en').toUpperCase() ) {
              return _getString('latest','sv').toUpperCase();
          }
      }
  };

  var _getString = function(key, lang) {
      if (lang === 'en') {
          return en[key];
      }
      else return sv[key];
  }

  /*
   */
  var getString = function(key) {
      return _getString(key, _currentLang);
  };


  return {
    init: init,
    getString: getString,
    populateGui: populateGui,
    getCurrentLang: getCurrentLang,
    translateSortCriteria: translateSortCriteria,
  };
})();
