var Playlist = (function() {
  var _unsavedPlaylist = { articles: [], duration: 0 }; //the unsaved playlist

  // the currently active playlist (on which new articles are added etc),
  // has the form: {'name': name, 'created': date, 'duration': _playlistDuration, 'articles': _unsavedPlaylist}
  var _activePlaylist;
  var _savedLists = [];
  var _unsavedMode = true;
  var _tab2DraggableList = $('#tab2DraggableArticleList');

  var initialize = function() {
    _activePlaylist = _unsavedPlaylist;
    var tab1ArticleList = document.getElementById('slippylist');
    _addDraggableListListeners(tab1ArticleList);
    new Slip(tab1ArticleList);

    var tab2ArticleList = document.getElementById('tab2DraggableArticleList');
    _addDraggableListListeners(tab2ArticleList);
    new Slip(tab2ArticleList);

    $('#playlistSaveButton').on('click', function(e) {
      $('#playlistSaveButton').addClass('disabled', 'disabled');
      $('#playlistPlayButton').addClass('disabled', 'disabled');
      $('#playlistSaveForm').slideDown('slow');
    });

    $('#playlistPlayButton').on('click', function(e) {
      PlPlayer.setPlaylist(_activePlaylist.articles, null, null);
    });

    $('#playlistCancelButton').on('click', function(e) {
      $('#newPlaylistName').val('');
      $('#playlistSaveForm').slideUp('slow');
      $('#playlistPlayButton').removeClass('disabled');
      $('#playlistSaveButton').removeClass('disabled');
    });

    $('#playlistOkButton').on('click', function(e) {
      _saveNewPlaylist();
    });

    $('#newPlaylistName').on('input', function(e) {
      var name = $(e.target).val();
      if (name == '' || _playlistNameExists(name)) {
        $('#playlistOkButton').addClass('disabled', 'disabled');
      } else {
        $('#playlistOkButton').removeClass('disabled');
      }
    });

    $('#selectedList').on('show.bs.tab', function(e) {
      var selected = $('#myLists .selected');
      var domArticleList = $('#tab2DraggableArticleList');
      _activePlaylist = _unsavedPlaylist;
      _unsavedMode = true;
      selected.removeClass('selected');
      _populateDOMArticlelist($('#slippylist'));
      domArticleList.slideUp(300);
    });
  };

  /* Called when a new user is logged in. His saved playlists are
   * loaded into the playlist component.
   */
  var loadSavedPlaylists = function(playlists) {
    _savedLists = [];
    for (var i = 0; i < playlists.length; i++) {
      _savedLists.push(playlists[i]);
      _savedLists[i].articles = [];
      // the full article is stored in the local playlists instead of just
      // the articleRef. This can be optimized, only title and playbacktrack
      // info is needed.
      if (playlists[i].articleRefs) {
        for (var j = 0; j < playlists[i].articleRefs.length; j++) {
          var article = DataStore.getPlaylistArticle(playlists[i].articleRefs[j]);
          _savedLists[i].articles.push(article);
        }
      }
    }

    // build the DOM object for each saved playlist
    var list = $('#myLists');
    list.empty();
    for (var i = 0; i < _savedLists.length; i++) {
      list.append(_buildSavedPlaylistItem(_savedLists[i]));
    }
    if (_savedLists.length >= 1) $('#emptyArchiveInfo').fadeOut();
  };

  /* Called when a user is logged out.
   */
  var clearSavedPlaylists = function() {
    _savedLists = [];
    var list = $('#myLists');
    list.empty();
    $('#emptyArchiveInfo').fadeIn();
  };

  /* each time the active playlist (the one currently selected for editing)
   * is changed (article added, deleted or moved) we need
   * to post the change to the server.
   */
  var _updatePlaylist = function() {
    var articleRefs = '[';
    for (var i = 0; i < _activePlaylist.articles.length; i++) {
      articleRefs += '"' + _activePlaylist.articles[i].id + '",';
    }
    if (articleRefs.length > 1) articleRefs = articleRefs.substr(0, articleRefs.length - 1);
    articleRefs += ']';

    var postBody = '{"name":"' + _activePlaylist.name + '", "articleRefs":' + articleRefs + '}';

    LoginHelper.sendRequestA('POST', Util.API_URL + '/me/playlists/', postBody).then(
      function successCallback(response) {},

      function errorCallback(response) {
        console.log('could not modify the playlist');
      }
    );
  };

  var _playlistNameExists = function(name) {
    for (var i = 0; i < _savedLists.length; i++) {
      if (_savedLists[i].name === name) return true;
    }
    return false;
  };

  /* Called each time an article is added/removed from the current playlist
   *
   */
  var add2Playlist = function(event) {
    var buttonClicked = $(event.target);
    var articleItem = buttonClicked.parent().parent();
    var domList;
    var separatorElement = null;
    if (_unsavedMode) {
      domList = $('#slippylist');
    } else {
      domList = $('#tab2DraggableArticleList');
      separatorElement = domList.children('.expanded-list-end');
    }

    var articleId = articleItem.attr('data-id');
    var domArticleItem = domList.children('[data-id="' + articleId + '"]');
    var articleDuration = parseInt(articleItem.attr('data-duration'));

    if (buttonClicked.attr('data-added') === 'true') {
      //REMOVE
      deleteArticleFromPlaylist(domArticleItem);
      Listener.showAlert('<p>'+i18n.getString('articleRemoved') +'</p> <p style="color:#BE1522;font-size:22px;font-weight:bold;">' + Util.formatMinSec(_activePlaylist.duration, false) + '</p>');
    } else {
      //ADD
      buttonClicked.attr('data-added', true);
      buttonClicked.addClass('added');
      var domItem = _buildArticleItem(articleId, articleItem.attr('data-title'), articleDuration);

      if (separatorElement) domItem.insertBefore(separatorElement);
      else domList.append(domItem);
      //only store needed properties in the playlist
      var listItem = { id: articleId, title: articleItem.attr('data-title'), playbacktrack: DataStore.getArticle(articleId).playbacktrack };
      _activePlaylist.articles.push(listItem);
      if (_unsavedMode) _toggleTab1Info();
      _activePlaylist.duration += articleDuration;
      _updateTimeInfo();

      Listener.showAlert('<p>'+i18n.getString('articleAdded') +'</p> <p style="color:#BE1522;font-size:22px;font-weight:bold;">' + Util.formatMinSec(_activePlaylist.duration, false) + '</p>');
    }
    if (!_unsavedMode) _updatePlaylist();
  };

  var deleteArticleFromPlaylist = function(domArticleItem) {
    var articleId = domArticleItem.attr('data-id');
    var addBtn = $('[data-id="' + articleId + '"] .addBtn');
    addBtn.removeClass('added');
    addBtn.attr('data-added', false);

    //if we delete last article in list we remove entire playlist
    if (!_unsavedMode && _activePlaylist.articles.length === 1) {
      var playlistDeleteBtn = $('[data-name="' + _activePlaylist.name + '"] .list-title .delete-button');
      deletePlaylistFromArchive(playlistDeleteBtn);
      return;
    }

    domArticleItem.remove();

    //remove article from playlist
    var removedDuration;
    for (var i = 0; i < _activePlaylist.articles.length; i++) {
      if (_activePlaylist.articles[i].id == articleId) {
        removedDuration = _activePlaylist.articles[i].playbacktrack.duration;
        _activePlaylist.articles.splice(i, 1);
        break;
      }
    }
    _activePlaylist.duration -= removedDuration;
    _updateTimeInfo();

    if (!_unsavedMode) {
      _updatePlaylist();
    } else _toggleTab1Info();
  };

  var _updateTimeInfo = function() {
    if (_unsavedMode) {
      if (_activePlaylist.duration > 0) $('#newListLength .duration-text').text(Util.formatMinSec(_activePlaylist.duration));
    } else $('[data-name="' + _activePlaylist.name + '"] .list-dur').text(Util.formatMinSec(_activePlaylist.duration, false));
  };

  /*
   * Delete a playlist
   */
  var deletePlaylistFromArchive = function(deleteButton) {
    var playlistName = deleteButton
      .parent()
      .parent()
      .attr('data-name');
    var playlistId = null;
    //remove playlist from archive
    for (var i = 0; i < _savedLists.length; i++) {
      if (_savedLists[i].name === playlistName) {
        playlistId = _savedLists[i].id;
        _savedLists.splice(i, 1);
        break;
      }
    }

    if (playlistId) {
      LoginHelper.sendRequestA('DELETE', Util.API_URL + '/me/playlists/' + playlistId, '').then(
        function successCallback(response) {
          if (_savedLists.length === 0) $('#emptyArchiveInfo').fadeIn();
          //remove playlist from DOM list
          $('#myLists')
            .children('[data-name="' + playlistName + '"]')
            .remove();
        },

        function errorCallback(response) {
          console.log('could not delete playlists');
        }
      );
    }
  };

  /* Called when a playlist has been clicked in the archives tab list
   *
   */
  var _playlistSelected = function(e) {
    var titleElement = $(e.target);
    var liElement = titleElement.closest('li');
    var name = liElement.attr('data-name');

    // find previosly selected list, if any
    var selected = $('#myLists .selected');

    if (selected.length && name !== selected.attr('data-name')) {
      //select list from previously selected state
      _unsavedMode = false;
      _activePlaylist = _getPlaylist(name);
      selected.removeClass('selected');
      _tab2DraggableList
        .slideUp(300)
        .promise()
        .done(function() {
          //remove the expanded ist item in the DOM
          _tab2DraggableList = $('#tab2DraggableArticleList').detach();
          $('#myLists .expanded-li').remove();
          _expandSavedPlaylist(liElement, _tab2DraggableList);
        });
    } else if (selected.length && name === selected.attr('data-name')) {
      //deselect all lists
      _activePlaylist = _unsavedPlaylist;
      _unsavedMode = true;
      selected.removeClass('selected');

      _populateDOMArticlelist($('#slippylist'));
      _tab2DraggableList
        .slideUp(300)
        .promise()
        .done(function() {
          //remove the expanded ist item in the DOM
          $('#myLists .expanded-li').remove();
        });
    } else {
      //select list from previously unselected state
      _unsavedMode = false;
      _activePlaylist = _getPlaylist(name);
      _expandSavedPlaylist(liElement, _tab2DraggableList);
    }
  };

  /* Expand a saved playlist to show the articles inside it.
   *
   */
  var _expandSavedPlaylist = function(rootElement, articleList) {
    rootElement.addClass('selected');

    articleList.detach();
    _populateDOMArticlelist(articleList);
    var newLi = $('<li class="expanded-li" data-name="' + rootElement.attr('data-name') + '"></li>');
    articleList.append('<li class="expanded-list-end"><div></div></li>');
    newLi.append(articleList);
    rootElement.after(newLi);
    articleList.slideDown(300);
  };

  /* Given playlist name [playlistName] the correct playlist in the archive is fetched
   *  and DOM elements are created for each of the articles in the list and inserted in the
   *  provided DOM list [domList] (either in lis in tab 1 or in list in tab 2).
   *  When the unsaved list is to be populated playlistName should be null.
   *
   */
  var _populateDOMArticlelist = function(domList) {
    domList.empty();

    _clearAllGridAddButtons();

    //for each article build the DOM article element and add to domList
    $.each(_activePlaylist.articles, function(index, article) {
      domList.append(_buildArticleItem(article.id, article.title, article.playbacktrack.duration));

      // turn on +sign in grid
      var gridItems = Grid.getGridItems();
      $.each(gridItems, function(i, item) {
        if (item.attr('data-id') === article.id) {
          var addBtn = item.find('.addBtn');
          addBtn.attr('data-added', 'true');
          addBtn.addClass('added');
          return false;
        }
      });
    });
  };

  var _clearAllGridAddButtons = function() {
    var gridItems = Grid.getGridItems();
    $.each(gridItems, function(i, item) {
      var addBtn = item.find('.addBtn');
      if (addBtn.attr('data-added') === 'true') {
        addBtn.attr('data-added', 'false');
        addBtn.removeClass('added');
      }
    });
  };

  /* Called when the unsaved playlist is to be saved.
   *
   */
  var _saveNewPlaylist = function() {
    var name = $('#newPlaylistName').val();
    var articleRefs = '[';

    for (var i = 0; i < _activePlaylist.articles.length; i++) {
      articleRefs += '"' + _activePlaylist.articles[i].id + '",';
    }
    if (articleRefs.length > 1) articleRefs = articleRefs.substr(0, articleRefs.length - 1);
    articleRefs += ']';

    var postBody = '{"name":"' + name + '", "articleRefs":' + articleRefs + '}';

    LoginHelper.sendRequestA('POST', Util.API_URL + '/me/playlists/', postBody).then(
      function successCallback(response) {
        var d = new Date();
        var date = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toJSON().slice(0, 10); // 2015-08-11
        var newList = { name: name, created: date, duration: _activePlaylist.duration, articles: _activePlaylist.articles };
        _savedLists.push(newList);

        $('#playlistSaveForm')
          .slideUp(300)
          .promise()
          .done(function() {
            var list = $('#myLists');
            var newPlaylistItem = _buildSavedPlaylistItem(newList);
            list.append(newPlaylistItem);

            //when saved the 'new list' is cleared
            _unsavedPlaylist = { articles: [], duration: 0 };
            $('#slippylist').empty();

            $('#newPlaylistName').val('');
            if (_savedLists.length === 1) $('#emptyArchiveInfo').hide();
            $('#archive').tab('show');

            //the no-content info for tab 1 is turned on
            $('#noContentInfo').show();
            _unsavedMode = false;
            _activePlaylist = newList;
            _expandSavedPlaylist(newPlaylistItem, _tab2DraggableList);
          });
        $('#playlistPlayButton').removeClass('disabled');
        $('#playlistSaveButton').removeClass('disabled');
      },

      function errorCallback(response) {
        console.log('could not save the playlist');
      }
    );
  };

  /* Get playlist object based on name
   */
  var _getPlaylist = function(playlistName) {
    var result;
    //find the playlist model
    if (playlistName) {
      $.each(_savedLists, function(index, savedList) {
        if (savedList.name === playlistName) {
          result = savedList;
          return false;
        }
      });
    }
    return result;
  };

  /* Build a DOM playlist item, representing one saved playlist
   *
   */
  var _buildSavedPlaylistItem = function(listItem) {
    var li = $('<li data-name="' + listItem.name + '"></li>');
    var title = $('<div class="list-title"></div>');
    title.on('click', function(e) {
      _playlistSelected(e);
    });

    var creationDate = '-';
    if (listItem.created) {
      creationDate = listItem.created.split('T')[0];
    }

    var info = $('<div class="list-name">' + listItem.name + '</div><div class="list-dur">' + Util.formatMinSec(listItem.duration) + '</div><div class="list-date">' + creationDate + '</div>');
    var playBtn = $('<div class="play-button"></div>');
    var delBtn = $('<div class="delete-button">&times;</div>');
    playBtn.on('click', function(event) {
      var playButton = $(event.target);
      var playlistName = playButton
        .parent()
        .parent()
        .attr('data-name');
      var listToPlay = _getPlaylist(playlistName);
      PlPlayer.setPlaylist(listToPlay.articles, null, null);
      event.stopPropagation();
    });

    delBtn.on('click', function(event) {
      Playlist.deletePlaylistFromArchive($(event.target));
      event.stopPropagation();
    });
    title.append(info);
    title.append(playBtn);
    title.append(delBtn);
    li.append(title);
    return li;
  };

  /* Build a DOM playlist article item, representing one article in a playlist
   *
   */
  var _buildArticleItem = function(id, title, duration) {
    var li = $('<li data-id="' + id + '"/>');
    var item = $('<div class="playlist-item-row"></div>');
    var leftItems = $('<div class="playlist-items-left"></div>');
    leftItems.append('<div class="playlist-item-title">' + title + '</div>');
    leftItems.append('<div class="playlist-item-duration">' + Util.formatMinSec(duration) + '</div>');
    var delBtn = $('<div class="delete-button">&times;</div>');
    delBtn.on('click', function(event) {
      //var deleteButton = $(event.target);
      //var playlistItem = deleteButton.parent().parent();
      Playlist.deleteArticleFromPlaylist(
        $(event.target)
          .parent()
          .parent()
      );
    });
    item.append(leftItems);
    item.append(delBtn);
    li.append(item);
    return li;
  };

  var _addDraggableListListeners = function(ol) {
    ol.addEventListener(
      'slip:beforereorder',
      function(e) {
        var list = $(e.target.parentNode);
        if (list.find('.expanded-list-end').length) {
          e.preventDefault();
        }

        if (/demo-no-reorder/.test(e.target.className)) {
          e.preventDefault();
        }
      },
      false
    );

    ol.addEventListener(
      'slip:beforeswipe',
      function(e) {
        if (e.target.nodeName == 'INPUT' || /demo-no-swipe/.test(e.target.className)) {
          e.preventDefault();
        }
      },
      false
    );

    ol.addEventListener(
      'slip:beforewait',
      function(e) {
        if (e.target.className.indexOf('instant') > -1) e.preventDefault();
      },
      false
    );

    ol.addEventListener(
      'slip:afterswipe',
      function(e) {
        e.target.parentNode.appendChild(e.target);
      },
      false
    );

    ol.addEventListener(
      'slip:reorder',
      function(e) {
        var list = $(e.target.parentNode);

        //disallow move past end-line mark
        if (list.find('.expanded-list-end').length && e.detail.insertBefore === null) {
          e.preventDefault();
          return false;
        }
        e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);
        _moveElemInArray(_activePlaylist.articles, e.detail.originalIndex, e.detail.spliceIndex);
        if (!_unsavedMode) _updatePlaylist();
        return false;
      },
      false
    );
  };

  var _toggleTab1Info = function() {
    if (_activePlaylist.articles.length === 0) {
      $('#noContentInfo').fadeIn();
    } else if (_activePlaylist.articles.length === 1) {
      $('#noContentInfo').fadeOut();
    }
  };

  var _moveElemInArray = function(array, old_index, new_index) {
    if (new_index >= array.length) {
      var k = new_index - array.length;
      while (k-- + 1) {
        array.push(undefined);
      }
    }
    array.splice(new_index, 0, array.splice(old_index, 1)[0]);
  };

  return {
    initialize: initialize,
    add2Playlist: add2Playlist,
    deleteArticleFromPlaylist: deleteArticleFromPlaylist,
    deletePlaylistFromArchive: deletePlaylistFromArchive,
    loadSavedPlaylists: loadSavedPlaylists,
    clearSavedPlaylists: clearSavedPlaylists,
  };
})();
