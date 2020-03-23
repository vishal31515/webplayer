var Filter = (function() {
  var $grid;
  var $categoryFilter;
  var $magazineFilter;
  var _categories = [];
  var _magazines = [];
  var _currentFilter = { _categories: _categories, _magazines: _magazines };

  var initialize = function(grid, categories, magazines) {

    $grid = grid;
    $categoryFilter = $('.category-filter');
    $magazineFilter = $('.magazine-filter');
    _categories = categories;
    _magazines = magazines;
    // $(".article-item").last().css('background-color','red');
    // _initFilters();
    // _initSort();
  };

  var getCurrentFilter = function() {
    return _currentFilter;
  };
  var setCurrentFilter = function(nv) {
    _currentFilter = nv;
  };

  var _populateMagazineFilter = function() {
    var magazines = DataStore.getMagazines();
    var container = $('#magazine-filter');
    container.empty();
    for (var i = 0; i < magazines.length; i++) {
      container.append('<div class="ck-button"><label><input type="checkbox" value="' + magazines[i].id + '"><span>' + magazines[i].name + '</span></label></div>');
    }
  };

  var _populateCategoryFilter = function() {
    var categories = DataStore.getCategories();
    var container = $('#category-filter');
    container.empty();
    for (var i = 0; i < categories.length; i++) {
      container.append('<div class="ck-button"><label><input type="checkbox" value="' + categories[i] + '"><span>' + categories[i] + '</span></label></div>');
    }
  };

  var populateFilters = function() {
    _populateMagazineFilter();
    _populateCategoryFilter();
  };

  /*
   * Filter the collection to only show the article with id=articleId
   * returns true if the article was found, false otherwise
   */
  var filterSingle = function(articleId) {
    var found = false;
    var griditems = Grid.getGridItems();

    jQuery.each(griditems, function(i, item) {
      if (item.attr('data-id') === articleId) {
        found = true;
        item.attr('data-filteredin', true);
      } else {
        item.attr('data-filteredin', false);
      }
    });

    // article wasn't found so instead of showing
    // nothing we show all articles.
    if (!found) {
      jQuery.each(griditems, function(i, item) {
        item.attr('data-filteredin', true);
      });
    }
    return found;
  };

  /*
   * Clear all filters
   */
  var clearFilter = function() {
    $('#magazine-filter input[type=checkbox], #magazine-filter input[type=checkbox]').prop('checked', false);
    $('#category-filter input[type=checkbox], #category-filter input[type=checkbox]').prop('checked', false);
    $('.single-mode-only').css('display', 'none');
    $('.filtered-mode').css('display', 'none');
    // $('.multi-mode-only').css('display', 'inline-block');
    $('.single-magazine-mode').css('display', 'none');
    $('.standard-mode').css('display', 'block');
    $('#load_next_articles').css('display', 'inline-block');

    _magazines = [];
    _categories = [];
    filter();
    /*var griditems = Grid.getGridItems();
    jQuery.each(griditems, function(i, item) {
      item.attr('data-filteredin', true);
  });*/
  };

  var filterToString = function(_currentFilter) {
    if (!_currentFilter._categories.length && !_currentFilter._magazines.length) return undefined ;

    var _f = '';
    var _c = [];
    var _m = [];


    _currentFilter._categories.map(function(cat) {
    _c = [..._c, encodeURIComponent(`categories CO "${cat}"`)];
      // _c = _c.concat(encodeURIComponent('categories CO \"'+ cat +'\"'));
    });
    _currentFilter._magazines.map(function(mag) {
      _m = [..._m, encodeURIComponent(`magazineRef EQ "${mag}"`)];
      // _m = _m.concat(encodeURIComponent('magazineRef EQ \"'+ mag +'\"'));
    });
    _c = _c.join(' OR ');
    _m = _m.join(' OR ');

    if (_currentFilter._categories.length && _currentFilter._magazines.length) _f = 'filter=' + _c + ' &filter=' + _m;
    else if (!_currentFilter._categories.length && _currentFilter._magazines.length) _f = 'filter=' + _m;
    else _f = 'filter=' + _c;
    return _f;
  };

  var setFilter = function(filterId, groups) {
      if (filterId === 'magazine-filter') {
        _magazines = groups;
      } else if (filterId === 'category-filter') {
        _categories = groups;
      }
      _currentFilter = {
        _magazines:_magazines,
        _categories:_categories,
      };
  };

  var filter = function(filterId, groups) {
    if (filterId === 'magazine-filter') {
      _magazines = groups;
    } else if (filterId === 'category-filter') {
      _categories = groups;
    }
    _currentFilter = {
      _magazines:_magazines,
      _categories:_categories,
    };
    DataStore.filterUpdated(filterToString(_currentFilter));
  };

  var changeSort = function(criteria) {
    var _s;
    switch (criteria) {
      case 'TITEL':
        _s = 'title';
        break;
      case 'POPULÄRAST':
        _s = '-playable/listenings';
        break;
      case 'LÄNGD':
        _s = 'playable/duration';

        break;
      case 'SENASTE':
      default:
        _s = '-listenerPublishDate';
    }

    if (_s != DataStore.getCurrentSort()) DataStore.sortingUpdated(_s);
  };

  return {
    initialize: initialize,
    filter: filter,
    filterSingle: filterSingle,
    clearFilter: clearFilter,
    setFilter: setFilter,
    populateFilters: populateFilters,
    getCurrentFilter: getCurrentFilter,
    changeSort: changeSort,
  };
})();
