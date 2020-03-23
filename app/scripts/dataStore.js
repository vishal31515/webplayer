var DataStore = (function() {
  var CONSUMER_URL = 'https://api.papereed.com/rest/v0.5';

  var _articles;
  var _magazines;
  var _categories;
  var _magazinesIncludingEmptyOnes;
  var _allNarrators = [];
  var _addArticlesCallback = null;
  var _lastFilter = undefined;
  var _playlistArticleCache;

  /**
   * Get the articles of a page
   *
   * Map ( pageIndex , Map(article ID, item))
   */
  var _articlesPages;

  /**
   * At which page is the article
   *
   * Map (Article ID, pageIndex)
   */
  var _articleInPage;

  /**
   * Next page token with each page
   *
   * Map (page Index, page token)
   */
  var _pageNextPageToken;
  var _currentPage;
  var _currentSort = '-listenerPublishDate'; // by date default
  var _pageSize = 24; // default
  var _articlesCount;
  var _totalPages;

  var initialize = function() {
    initData();
  };

  var initData = function() {
    _articles = undefined;
    _lastFilter = undefined;
    _currentPage = 0;
    _totalPages = 0;
    _articlesCount = 0;
    _articlesPages = Immutable.Map();
    _articleInPage = Immutable.Map();
    _pageNextPageToken = Immutable.Map();
    _articles = Immutable.Map();
    _playlistArticleCache = Immutable.Map();
  };

  var getCurrentSort = function() {
    return _currentSort;
  };
  var setCurrentSort = function(nv) {
    _currentSort = nv;
  };

  var isAtLastPage = function() {
    if (_pageNextPageToken.get(_currentPage) == undefined) return true;
    return false;
  };

  var getPageSize = function() {
    return _pageSize;
  };
  var setPageSize = function(nv) {
    _pageSize = nv;
  };
  var getPageCount = function() {
    return _totalPages;
  };
  var getArticlesCount = function() {
    return _articlesCount;
  };
  var setArticlesCount = function(nv) {
    _articlesCount = nv;
  };
  var getCurrentPage = function() {
    return _currentPage;
  };
  var setCurrentPage = function(nv) {
    _currentPage = nv;
  };

  var getArticlesPages = function() {
    return _articlesPages;
  };

  var setArticlesPages = function(nv) {
    _articlesPages = nv;
  };

  var getArticlesInPage = function(index) {
    if (_articlesPages.has(index)) return _articlesPages.get(index);
    else {
      console.log('ERROR: getArticlesInPage', index);
      return [];
    }
  };

  var setUrl = function(url) {
    CONSUMER_URL = url;
  };

  var createPlaylistArticlesQuery = function(playlists) {
      var query = "filter=";
      for (var i = 0; i < playlists.length; i++) {
        if (playlists[i].articleRefs) {
          for (var j = 0; j < playlists[i].articleRefs.length; j++) {
            query += "id EQ \"" + playlists[i].articleRefs[j] + "\" OR ";
          }
        }
      }
      return query.slice(0,-4);
  };

  var getUserContent = function(params) {
    _magazines = [];
    _categories = [];

    var user = LoginController.getUser();

    var deferred = $.Deferred();
    var userCall = LoginHelper.sendRequestA('GET', CONSUMER_URL + '/users?filter=roles CO \"NARRATOR\"', null);
    //var userCall = null;
    var magazineCall = LoginHelper.sendRequestA('GET', CONSUMER_URL + '/magazines?filter=language EQ \"sv\"', null);
    var categoryCall = LoginHelper.sendRequestA('GET', CONSUMER_URL + '/categories', null);
    var playlistArticlesCall = null;

    if (user && user.playlists) {
        var queryParams = createPlaylistArticlesQuery(user.playlists);
        playlistArticlesCall = LoginHelper.sendRequestA('GET', CONSUMER_URL + '/articles?'+queryParams, null);
    }


    var privateMagCall = null;
    // if we have private articles (publishState=64) we must get all magazines
    if (params.private) {
      privateMagCall = LoginHelper.sendRequestA('GET', CONSUMER_URL + '/magazines?includeEmpty', null);
    }

    $.when(userCall, magazineCall, categoryCall, playlistArticlesCall, privateMagCall)
      .done(function(responseUser, responseMag, responseCategories, responsePlaylists, privateMag) {
        if (responseUser && responseUser.items) _allNarrators = responseUser.items;
        _magazines = responseMag.items;
        _categories = responseCategories.items;

        if (responsePlaylists && responsePlaylists.items) {
            responsePlaylists.items.map(function(article) {
                _modifyMetadata(article);
              _playlistArticleCache = _playlistArticleCache.set(article.id, article);
            });

        }
        if (privateMag) _magazinesIncludingEmptyOnes = privateMag.items;
        Filter.populateFilters();
        deferred.resolve();
      })
      .fail(function(response) {
        deferred.reject();
      });

    return deferred.promise();
  };

  var _currentFilter = null;

  var startDataFetch = function(params, callback) {
    var pageSize = Grid.getPageSize();
    if (params.id && params.private) {
      _currentFilter = 'filter=id EQ "' + params.id + '"';
      _currentFilter += '&sort=-listenerPublishDate';
    } else if (params.id) {
      _currentFilter = 'filter=id EQ "' + params.id + '"';
      _currentFilter += '&filter=publishState EQ "3" OR publishState EQ "2"';
      _currentFilter += '&sort=-listenerPublishDate';
    } else if (params.magazine) {
      _currentFilter = 'filter=magazineRef EQ "' + params.magazine + '"';
      _currentFilter += '&filter=publishState EQ "3" OR publishState EQ "2"';
      _currentFilter += '&maxResults=' + pageSize;
      _currentFilter += '&sort=-listenerPublishDate';
    } else {
      _currentFilter = 'filter=publishState EQ "3" OR publishState EQ "2"';
      _currentFilter += '&maxResults=' + pageSize;
      _currentFilter += '&sort=-listenerPublishDate';
    }
    if (callback) {
      _addArticlesCallback = callback;
    }
    getArticles(_currentFilter).then(function(nextPageToken) {
      DataStore.setCurrentPage(1);
      Grid.buildActivePage(1);
      _addArticlesCallback();
    });
  };

  // safety counter.. to be removed...
  var tmp = 0;

  var fetchNextPage = function() {
    if (_articlesPages.has(DataStore.getCurrentPage() + 1)) return;
    const nextPageToken = _pageNextPageToken.get(_currentPage);
    if (nextPageToken) getArticles(_lastFilter, nextPageToken);
  };



  /**
   * A method that gets a page of articles
   */
  var getArticles = function(filter, nextPageToken) {
    // if not specified which page these articles are to
    // set to next page
    const page = getCurrentPage() + 1;
    const nextPageTokenFilter = !!nextPageToken ? '&pageToken=' + nextPageToken : '';
    _lastFilter = filter;

    return new Promise(function(res, rej) {
      //console.log(tmp+': GET ARTICLES: '+filter);
      LoginHelper.sendRequestA('GET', CONSUMER_URL + '/articles?' + filter + nextPageTokenFilter, null).done(function(data) {
        //var newArticles = [];
        var newArticles = _removeUnplayableArticles(data.items);
        // _removeDuplicates(newArticles);

        res(data.nextPageToken);

        setArticlesPages(
          getArticlesPages().set(
            page,
            newArticles.map(function(__article) {
              return __article.id;
            })
          )
        );
        // for each article we ...
        for (var i = 0; i < newArticles.length; i++) {
          _modifyMetadata(newArticles[i]);
        }

        newArticles.map(function(article) {
          _articleInPage = _articleInPage.set(article.id, page);
          _articles = _articles.set(article.id, article);
          return article;
        });

        _pageNextPageToken = _pageNextPageToken.set(page, data.nextPageToken);
        _articlesCount = data.totalNumOfItems;
        _totalPages = _articlesCount == 0 ? 0 : Math.ceil(_articlesCount / _pageSize);
      });
    });
  };

  var getMagazines = function() {
    return _magazines;
  };

  var getCategories = function() {
    return _categories;
  };

  /* Get the magazine title
   *
   */
  var getMagazineTitle = function(magazineRef) {
    for (var i = 0; i < _magazines.length; i++) {
      if (_magazines[i].id === magazineRef) {
        return _magazines[i].name;
      }
    }
    return null;
  };

  var getMagazineId = function(magazineName) {
    for (var i = 0; i < _magazines.length; i++) {
      if (_magazines[i].name === magazineName) {
        return _magazines[i].id;
      }
    }
    return null;
  };

  /* Get the magazine url
   *
   */
  var getMagazineUrl = function(magazineRef) {
    for (var i = 0; i < _magazines.length; i++) {
      if (_magazines[i].id === magazineRef) {
        return _magazines[i].webUrl;
      }
    }
  };

  /* Return the full article object based on the article id.
   *
   */
  var getArticle = function(id) {
    return _articles.get(id);
  };

  var getPlaylistArticle = function(id) {
    return _playlistArticleCache.get(id);
  };

  /* Remove all articles from the newArticles list that are already in the article store (_articles)
   */
  var _removeDuplicates = function(newArticles) {
    for (var i = newArticles.length - 1; i >= 0; i--) {
      if (_articleIsInList(newArticles[i].id)) {
        newArticles.splice(i, 1);
      }
    }
  };

  /* Check if articleId is in _articles list
   *
   */
  var _articleIsInList = function(articleId) {
    return _articles.has(article);
  };

  /* Modify the article metadata
   */
  var _modifyMetadata = function(article) {
    article.playbacktrack = article.playable;

    article.playbacktrack.readers[0] = _getNarratorName(article.playbacktrack.readers[0]);

    /*if (LoginController.isRecommended(article.playbacktrack.id) ) {
            article.liked = true;
        }
        else {
            article.liked = false;
        }*/

    if (article.playbacktrack.opinion && article.playbacktrack.opinion.recommendations) {
      article.likes = article.playbacktrack.opinion.recommendations;
    } else {
      article.likes = 0;
    }

    // resolve magazine properties
    article.magazineName = '';
    article.magazineUrl = '';
    for (var i = 0; i < _magazines.length; i++) {
      if (_magazines[i].id === article.magazineRef) {
        article.magazineName = _magazines[i].name;
        article.magazineUrl = _magazines[i].webUrl;
      }
    }
    // manage private article magazine reference
    if (article.publishState === 64) {
      for (var i = 0; i < _magazinesIncludingEmptyOnes.length; i++) {
        if (_magazinesIncludingEmptyOnes[i].id === article.magazineRef) {
          article.magazineName = _magazinesIncludingEmptyOnes[i].name;
          article.magazineUrl = _magazinesIncludingEmptyOnes[i].webUrl;
        }
      }
    }
  };

  var _removeUnplayableArticles = function(articles) {
    var readyArticles = [];
    if (articles) {
      readyArticles = $.grep(articles, function(article) {
        return article.playable != null;
      });
    }
    return readyArticles;
  };

  var _getNarratorName = function(narratorId) {
    if (_allNarrators && _allNarrators.length) {
        for (var i = 0; i < _allNarrators.length; i++) {
          if (_allNarrators[i].id === narratorId) {
            return _allNarrators[i].firstName + ' ' + _allNarrators[i].lastName;
          }
        }
    }
    else {
        return "okänd namn";
    }
    return narratorId;
  };

  var filterUpdated = function(newFilter) {
    initData();
    if (newFilter) newFilter += '&filter=publishState EQ "3" OR publishState EQ "2"';
    else {
      newFilter = 'filter=publishState EQ "3" OR publishState EQ "2"';
      $('.filtered-mode').css('display', 'none');
      $('#magazine-filter input[type=checkbox], #magazine-filter input[type=checkbox]').prop('checked', false);
    }
    newFilter += '&maxResults=' + _pageSize;
    newFilter += '&sort=' + _currentSort;

    _currentFilter = newFilter;

    getArticles(newFilter).then(function(nextPageToken) {
      Grid.clearGridItems();
      DataStore.setCurrentPage(1);
      Grid.buildActivePage(1);
    });
  };

  /* Note: this function currently relies on sort always being part
     of _currentFilter*/
  var sortingUpdated = function(newSorting) {
    initData();
    _currentSort = newSorting;

    var _arr = _currentFilter.split('&sort=');
    _arr[_arr.length - 1] = newSorting;
    var newFilter = _arr.join('&sort=');

    getArticles(newFilter).then(function(nextPageToken) {
      Grid.clearGridItems();
      DataStore.setCurrentPage(1);
      Grid.buildActivePage(1);
    });
  };

  return {
    initialize: initialize,
    getUserContent: getUserContent,
    getArticles: getArticles,
    getMagazines: getMagazines,
    getCategories: getCategories,
    startDataFetch: startDataFetch,
    fetchNextPage: fetchNextPage,
    getArticle: getArticle,
    getPlaylistArticle: getPlaylistArticle,
    getMagazineTitle: getMagazineTitle,
    getMagazineId: getMagazineId,
    getCurrentPage: getCurrentPage,
    setCurrentPage: setCurrentPage,
    isAtLastPage: isAtLastPage,
    getArticlesInPage: getArticlesInPage,
    getArticlesCount: getArticlesCount,
    getPageCount: getPageCount,
    filterUpdated: filterUpdated,
    getCurrentSort: getCurrentSort,
    sortingUpdated: sortingUpdated,
    setUrl: setUrl,
  };
})();
