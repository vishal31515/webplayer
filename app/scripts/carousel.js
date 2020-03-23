var Carousel = (function() {
  // var to prevent the unwanted click after a swipe release
  var _ghostClick = false;

  /* Called when a swipe (pan event) or click is captured on a carousel component.
   * e is the event.
   */
  var swipeCarousel = function(e) {
    _flipCarousel(e);
  };

  /*var swipeCarousel = function(e) {
    console.log('EVENT: '+e.target);
    if(e.type == "panstart") {
        console.log('panstart event');
        _ghostClick = false;
    } 
    else if(e.type == "click") {
        console.log('click event');
        if(_ghostClick) _ghostClick = false;
        else _flipCarousel(e);
        return;
    }

    if (e.gesture.direction === Hammer.DIRECTION_LEFT) {
        _flipCarousel(e, 'right');
    }
    else if (e.gesture.direction === Hammer.DIRECTION_RIGHT) { 
      _flipCarousel(e, 'left');
    }
  };  */

  /* Build a Bootstrap carousel with items inside
   *
   */
  var buildCarousel = function(id, items) {
    var carousel = $('<div class="carousel slide" data-interval="false"></div>');
    carousel.attr('id', 'carousel-' + id);

    var ol = $('<ol class="carousel-indicators"></ol>');
    ol.append('<li data-target="#carousel-' + id + '" data-slide-to="0" class="active"></li>');
    ol.append('<li data-target="#carousel-' + id + '" data-slide-to="1"></li>');
    carousel.append(ol);

    var carouselInner = $('<div class="carousel-inner" role="listbox"></div>');

    var itm1 = $('<div class="item active"></div>');
    itm1.append(items[0]);
    var itm2 = $('<div class="item"></div>');
    itm2.append(items[1]);

    carouselInner.append(itm1);
    carouselInner.append(itm2);
    carousel.append(carouselInner);

    return carousel;
  };

  /* Moving the carousel one step to the left or to the right,
   * in order to support both swipe and click the direction
   * property can take the following values: 'left', 'right'
   * left/right only moves that direction (i.e. if carousel already is
   * in leftmost position and direction is left, no movement happens) but
   * all otehr values always moves the carousel.
   */
  var _flipCarousel = function(event, direction) {
    var elem = $(event.target);
    var carousel = elem.closest('.carousel');
    var active = carousel.find('li.active');
    var index = active.attr('data-slide-to');

    if (direction && direction === 'left' && index === '0') {
      _ghostClick = true;
      return;
    }
    if (direction && direction === 'right' && index === '1') {
      _ghostClick = true;
      return;
    }

    if (index === '1') carousel.carousel(0);
    else carousel.carousel(1);
  };

  return {
    swipeCarousel: swipeCarousel,
    buildCarousel: buildCarousel,
  };
})();
