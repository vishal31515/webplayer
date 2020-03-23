var Grid = (function() {
  var $grid;
  var $paginationPrevious;
  var $pageNumber;
  var $lastPageNumber;
  var $paginationNext;
  var $resetFilterButton;
  var _gridItems = []; //all articles
  var _categories = [];
  var _magazines = [];
  var _pageSize = 0;
  if (screen.width > 599 && screen.width < 900) {
    _pageSize=22;
    // $("#grid").css("justify-content", "center");
    // $("#grid").last().css("justify-content", "left");

  }
  else if (screen.width > 319 && screen.width < 600) {
    _pageSize=21;
  }
  else {
    _pageSize=24;
    // $("#grid").last().css("justify-content", "left");
  }
  console.log("_pageSize");
  console.log(_pageSize);
  // if (_pageSize > 20) {
  //   $(".article-item").css('color', 'red');  
  //   console.log("-----------------IF-----------");
  // }
  var _curDisplayPos = 0; //where to start the display
  var _pageIndex = [];
  var _isRetinaDisplay = window.devicePixelRatio > 1;
  var _token = null;

  /*var $pagination = $('#pager ul');
  var defaultOpts = {
        prev: '<span aria-hidden="true">&laquo;</span>',
        next: '<span aria-hidden="true">&raquo;</span>',
        onPageClick: function (page, evt) {
            changePage2(evt);
        }
  };*/

  var getPageSize = function() {
    return _pageSize;
  };

  /*
   * Private method which constructs an article "display card" based on
   * an article json structure.
   */
  var _buildGridItem = function(article) {
    /*var keywords = '["all"';
    if(article.keywords) {
      jQuery.each( article.keywords, function( i, keyword ) {
        keywords += ',"'+keyword+'"';
      });
    }

    keywords += ']';*/

    var categories = '["all"';
    if (article.categories) {
      jQuery.each(article.categories, function(i, category) {
        categories += ',"' + category + '"';
      });
    }
    categories += ']';

    var item = $('<div class="article-item"/>');
    var title = article.title ? article.title : 'ospecad';
    var description = article.shortDescription ? article.shortDescription : 'Ingen artikelbeskrivning finns.';
    //var likes = article.likes ? article.likes : 0;

    var listenings = article.playbacktrack.listenings ? article.playbacktrack.listenings : 0;
    //var listenings = (article.playbacktrack.duration)? Math.floor(article.playbacktrack.listeningDur/article.playbacktrack.duration) : 0;

    var duration = article.playbacktrack.duration ? article.playbacktrack.duration : 0;

    //var posterImg = (article.posters && article.posters[0]) ? article.posters[0] : null;
    var posterImg = _getPosterImage(article);
    var imageUrl = null;
    if (posterImg) imageUrl = posterImg.url;
    // demo content had 2 differnt images, one retina, one normal
    // until we have better retina support we expect each image in two resolutions
    // [2x-resolution, standard-resolution]

    /*var imageUrl = (article.posters && article.posters[0].url) ? article.posters[0].url : null;
    if (!_isRetinaDisplay) {
      imageUrl = (imageUrl && article.posters[1] && article.posters[1].url) ? article.posters[1].url : imageUrl;
    }*/
    item.attr('data-id', article.id);
    item.attr('data-title', article.title);
    item.attr('data-magazine', article.magazineName);
    //item.attr('data-keywords', keywords);
    item.attr('data-categories', categories);
    //item.attr('data-publishdate', article.publishDate);
    item.attr('data-publishdate', article.listenerPublishDate);
    //item.attr('data-likes', likes);
    //item.attr('data-quality', quality);
    item.attr('data-listenings', listenings);
    item.attr('data-duration', duration);

    item.append('<div class="title"><p>' + title + '</p></div>');

    var img = $('<img />');
    var posterCover = $('<div class="poster-cover"></div>');

    if (imageUrl) {
      // no need for access token since jan 2017...
      //imageUrl += '?access_token='+_token;

      posterCover.append($('<div class="loading-circle"></div>'));
      img.bind('load', { msg: posterCover }, function(event) {
        poster.css('background-image', 'url(' + imageUrl + ')');
        event.data.msg.fadeOut(400, function() {
          $(this).remove();
        });
      });
      img.bind('error', { msg: posterCover }, function(event) {
        // if image loading fails we remove the loading indicator and just use colored poster
        event.data.msg.find('.loading-circle').remove();
      });

      img.attr('src', imageUrl);
    }

    var poster = $('<div class="poster"></div>');
    var description = $('<div class="description">' + description + '</div>');
    poster.bind('click', function(e) {
      Carousel.swipeCarousel(e);
    });
    description.bind('click', function(e) {
      Carousel.swipeCarousel(e);
    });

    // using Touchy
    poster.bind('swipeleft', function(e) {
      Carousel.swipeCarousel(e);
    });
    description.bind('swiperight', function(e) {
      Carousel.swipeCarousel(e);
    });

    posterCover.css('background-color', Util.getRandomColor);

    poster.append(posterCover);

    poster.append($('<div class="duration">' + Util.formatMinSec(duration, false) + '</div>'));

    item.append(Carousel.buildCarousel('poster-' + article.id, [poster, description]));

    // first page of the metadata below the poster
    var metaData_page1 = $('<div class="metadata-block"></div>');
    metaData_page1.bind('click', function(e) {
      Carousel.swipeCarousel(e);
    });
    metaData_page1.bind('swiperight', function(e) {
      Carousel.swipeCarousel(e);
    });
    buildMetadataPrimaryView(metaData_page1, article);

    // second page of the metadata below the poster
    var metaData_page2 = $('<div class="metadata-block"></div>');
    metaData_page2.bind('click', function(e) {
      Carousel.swipeCarousel(e);
    });
    metaData_page2.bind('swipeleft', function(e) {
      Carousel.swipeCarousel(e);
    });
    buildMetadataSecondaryView(metaData_page2, article, posterImg);

    item.append(Carousel.buildCarousel('meta-' + article.id, [metaData_page1, metaData_page2]));

    var buttons = $('<div class="button-row"></div>');

    var shareBtn = $('<div class="shareBtn"></div>');
    shareBtn.on('click', function(event) {
      $('#shareModal-link').val('https://www.papereed.com/play/' + article.id);
      var text = 'Lyssna på "' + article.title + '"';
      text += ', från @Papereed1 #wereadyoulisten';

      // twitter max length 140, url in twitter is always 23 long, thus 117 chars remaining
      // if we get over this we truncate the title
      if (text.length > 116) {
        var overflow = text.length - 119;
        text = 'Lyssna på "' + article.title.substring(0, article.title.length - overflow) + '..."';
        text += ', från @Papereed1 #wereadyoulisten';
      }

      $('#share').jsSocials('option', 'text', text);
      $('#share').jsSocials('option', 'url', 'https://www.papereed.com/play/' + article.id);

      Listener.setShareableArticle(article);

      $('#shareModal').modal('toggle');
    });

    var lockBtn = $('<div class="lockBtn"></div>');
    lockBtn.on('click', function(event) {
      LoginController.login('last');
    });

    var addBtn = $('<div class="addBtn"></div>');
    addBtn.on('click', function(event) {
      Playlist.add2Playlist(event);
    });
    addBtn.attr('data-added', false);

    buttons.append(shareBtn);
    buttons.append(lockBtn);
    buttons.append(addBtn);

    if (LoginController.isLoggedIn()) {
      lockBtn.css('display', 'none');
      //shareBtn.css('display', 'none');
    } else {
      addBtn.css('display', 'none');
    }

    buttons.append('<div class="playBtn" onclick="Listener.play(event)"></div>');
    item.append(buttons);

    item.attr('data-filteredin', true);

    return item;
  };

  /* First tab of the article metadata field. Contains title, writer, reader, etc.
   */
  var buildMetadataPrimaryView = function(parent, article) {
    var audioPublishDate = article.listenerPublishDate ? moment(article.listenerPublishDate).format('YYYY-MM-DD') : 'okänt datum';
    var magazine = 'ospecifierad tidning';
    var magazineUrl = null;
    magazine = article.magazineName;
    magazineUrl = article.magazineUrl;
    var listenings = article.playbacktrack.duration ? Math.floor(article.playbacktrack.listeningDur / article.playbacktrack.duration) : 0;

    var writer = article.writers ? article.writers[0] : null;
    if (writer && writer.length > 23) writer = writer.substring(0, 23) + '...';
    var reader = article.playbacktrack.readers ? article.playbacktrack.readers[0] : 'ospecad';

    if (magazineUrl) {
      parent.append('<div class="writer"><a href="' + magazineUrl + '" target="_blank">' + magazine + '</a></div>');
    } else {
      parent.append('<div class="writer">' + magazine + '</div>');
    }

    var row2 = $('<div class="subrow"></div>');
    var containerDiv = $('<div class="reader"></div>');
    if (writer) containerDiv.append('<span class="left"><i class="fa fa-pencil" aria-hidden="true"></i> ' + writer + '</span>');
    //containerDiv.append('<span class="listenings">'+listenings+'<span class="glyphicon glyphicon-headphones" aria-hidden="true"></span></span>');
    row2.append(containerDiv);

    var row3 = $('<div class="subrow"></div>');
    row3.append('<div class="reader"><span class="left"><i class="fa fa-microphone" aria-hidden="true"></i> ' + reader + '</span><span class="publishDate">' + audioPublishDate + '</span></div>');

    parent.append(row2);
    parent.append(row3);
  };

  /* Second tab of the article metadata field. Contains photoinfo and paper publish date.
   */
  var buildMetadataSecondaryView = function(parent, article, poster) {
    var publishDate = article.publishDate ? moment(article.publishDate).format('YYYY-MM-DD') : 'okänt datum';
    var phototext = null;
    if (poster && poster.photographer) {
      phototext = poster.photographer;
      if (poster.licenseInfo) phototext = phototext + ' (' + poster.licenseInfo + ')';
    }
    if (poster && poster.licenseInfo) {
      if (!phototext) phototext = poster.licenseInfo;
      else phototext += ' (' + poster.licenseInfo + ')';
    }
    parent.append('<div class="writer">&nbsp;</div>');

    var row2 = $('<div class="subrow"></div>');
    var containerDiv = $('<div class="reader"></div>');
    containerDiv.append('<span class="left"><i class="fa fa-pencil" aria-hidden="true"></i> ' + publishDate + '</span>');
    row2.append(containerDiv);

    var row3 = $('<div class="subrow"></div>');
    if (phototext) row3.append('<div class="reader"><span class="left"><i class="fa fa-camera" aria-hidden="true"></i> ' + phototext + '</span></div>');

    parent.append(row2);
    parent.append(row3);
  };

  /* Initialize the grid before it is populated with articles
   */
  var initialize = function() {
    _gridItems = [];
    $grid = $('#grid');
    $paginationPrevious = $('.paginationPrevious');
    $paginationNext = $('.paginationNext');
    $pageNumber = $('#pageNumber');
    $lastPageNumber = $('#lastPageNumber');
    $resetFilterButton = $('#resetFilterButton');

    // $paginationPrevious.addClass('disabled');
    // $paginationNext.addClass('disabled');
    bindClickEvents();
    // var list = Listener.getArticleList();
    _token = LoginHelper.getAccessTokenA();
    Filter.initialize($grid, _categories, _magazines);
  };

  var bindClickEvents = function() {
    $paginationPrevious.on('click', paginationPreviousClick);
    $paginationNext.on('click', paginationNextClick);
    //$resetFilterButton.on('click', DataStore.filterUpdated);
    $resetFilterButton.on('click', Filter.clearFilter);
    // window.location.reload(0);
  };

  var paginationPreviousClick = function(e) {
    if (DataStore.getCurrentPage() == 1) return;
    buildActivePage(DataStore.getCurrentPage() - 1);
  };

  var paginationNextClick = function(e) {
    if (DataStore.isAtLastPage()) return;
    DataStore.fetchNextPage();
    buildActivePage(DataStore.getCurrentPage() + 1);
  };

  var buildActivePage = function(newPageIndex) {
    // clearGridItems();
    addArticlesToGrid(DataStore.getArticlesInPage(newPageIndex));
    buildPage();
    setActivePage(newPageIndex);
    DataStore.fetchNextPage();

    if (DataStore.getCurrentPage() == 1) {
      // $paginationPrevious.addClass('disabled');
    }
    if (DataStore.getCurrentPage() > 1) {
      // $paginationPrevious.removeClass('disabled');
    }

    if (DataStore.getCurrentPage() < DataStore.getPageCount()) {
      // $paginationNext.removeClass('disabled');

    } else {
      // $paginationNext.addClass('disabled');
    }

    if (DataStore.isAtLastPage()){
      $("#load_next_articles").css('display','none');
      $('.white-banner').hide();
      // $(".article-item").last().css('margin-bottom', "90px");
      // $(".article-item").last().css('background-color','red');
    }
    else{
      // $("#load_next_articles").css('display','block');
      $('.white-banner').show();
    }
  };

  $("#load_next_articles").click(function(){
    // $(".grid-loader").fadeIn(10);
    $(".grid-loader").fadeOut(2000, function() {
      $(".grid-new").fadeIn(1000);        
    });
    $('html, body').animate({scrollTop:$(document).height()-700}, 'slow');
        // return false;     
  });

  var setActivePage = function(index) {
    DataStore.setCurrentPage(index);
    if (DataStore.getPageCount()) $pageNumber.text(index + '/' + DataStore.getPageCount());
    else $pageNumber.text(0);
  };

  /* Initialize the grid before it is populated with articles
   */
  var addArticlesToGrid = function(articles) {
    jQuery.each(articles, function(i, article) {
      _gridItems.push(_buildGridItem(DataStore.getArticle(article)));
    });
    // updatePageIndex();
  };

  var _print = function() {
    console.log('******************');
    jQuery.each(_gridItems, function(i, item) {
      console.log(i + ': [magazine:' + item.attr('data-magazine') + ',   publishdate:' + item.attr('data-publishdate') + ', filteredin:' + item.attr('data-filteredin') + ']');
    });
  };

  /*
   * Construct a new page with _pageSize number of items. Only items in the current filtered set
   * are included. The _curDisplayPos indicates which page in the full article collection that
   * is to be displayed.
   */
  var buildPage = function() {
    $.when(_transitionOut()).done(function() {
      $grid.empty();
      $('#grid > .article-item').detach();
      _gridItems.map(function(el) {
        el.hide();
        $grid.append(el);
      });
      _transitionIn();
      $('#articleLoader').hide();
      $('#pager').css('visibility', 'visible');
    });
  };

  var getGridItems = function() {
    return _gridItems;
  };

  var clearGridItems = function() {
    _gridItems = [];
  };

  /* return poster with landscape factor */
  var _getPosterImage = function(article) {
    if (!article.posters) return null;
    var maxAR = 0;
    var bestMatch = -1;
    for (var i = 0; i < article.posters.length; i++) {
      var poster = article.posters[i];
      if (poster.aspectRatio > maxAR) {
        maxAR = poster.aspectRatio;
        bestMatch = i;
      }
    }
    if (bestMatch > -1) return article.posters[bestMatch];
    else return null;
  };

  var _transitionOut = function() {
    $grid.children().fadeOut('fast');
    return $grid.children().promise();
  };

  var _transitionIn = function() {
    return $grid.children().fadeIn('fast');
  };

  var updateGrid = function() {
    var loggedin = LoginController.isLoggedIn();
    jQuery.each(_gridItems, function(i, item) {
      var lockBtn = item.find('.lockBtn');
      var shareBtn = item.find('.shareBtn');
      var addBtn = item.find('.addBtn');
      if (loggedin) {
        lockBtn.css('display', 'none');
        shareBtn.css('display', 'none');
        addBtn.css('display', 'inline-block');
      } else {
        lockBtn.css('display', 'inline-block');
        shareBtn.css('display', 'inline-block');
        addBtn.css('display', 'none');
      }
    });
  };

  return {
    initialize: initialize,
    clearGridItems: clearGridItems,
    buildPage: buildPage,
    buildActivePage: buildActivePage,
    updateGrid: updateGrid,
    getGridItems: getGridItems,
    addArticlesToGrid: addArticlesToGrid,
    getPageSize: getPageSize,
  };
})();
