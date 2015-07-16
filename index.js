var event = require('event');
var throttle = require('throttle');
var offset = require('offset');
var scrollTo = require('scroll-to');
var emitter = require('emitter');

var toArray = function(collection) {
  var arr = [];
  for (var i = 0; i < collection.length; i++) {
    arr.push(collection[i]);
  }
  return arr;
};

function ScrollSpy(el, options) {
  var self = this;
  this._started = false;

  this._onWindowScroll = throttle(this._onWindowScroll, 50).bind(this);
  this._onClick = this._onClick.bind(this);
  this._onWindowResize = throttle(this._onWindowResize, 500).bind(this);

  this.el = el;
  this.options = options || {};
  this.links = toArray(this.el.querySelectorAll('a'));

  // When clicking links in the nav
  this.links.forEach(function(el){
    event.bind(el, 'click', self._onClick);
  });

  this.recalculate();
  this.render();
  this.start();
}

emitter(ScrollSpy.prototype);

ScrollSpy.prototype.recalculate = function() {
  var self = this;
  this.offsets = [];
  this.links.forEach(function(el){
    var id = el.getAttribute('href');
    var target = document.body.querySelector(id);
    var elOffset = el.getAttribute('data-offset') * 1 || 0;
    var point = document.body.scrollTop + offset(target).top + elOffset;
    self.offsets.push(point);
  });
};

ScrollSpy.prototype.update = function() {
  this.recalculate();
  this.render();
};

ScrollSpy.prototype._onWindowResize = function() {
  this.update();
};

ScrollSpy.prototype._onWindowScroll = function() {
  this.render();
};

ScrollSpy.prototype.getElementOffset = function(el) {
  if(this.options.offsetAttribute) {
    return el.getAttribute(this.options.offsetAttribute) * 1;
  }
  return 0;
};

ScrollSpy.prototype.render = function() {
  var currentScroll = document.body.scrollTop || document.querySelector('html').scrollTop;
  var active = 0;
  this.offsets.forEach(function(offset, i){
    if( currentScroll >= offset ) {
      active = i;
    }
  }, this);
  this.activate(active);
};

ScrollSpy.prototype._onClick = function(event) {
  if(this.isAnimating) {
    return false;
  }

  var self = this;
  var el = event.target || event.srcElement;
  var index = this.links.indexOf(el);
  var target = document.querySelector(el.getAttribute('href'));
  var offset = this.getElementOffset(el);

  this.stop();
  this.activate(index);
  this.isAnimating = true;

  scrollTo(target, 2000, 'outExpo');

  setTimeout(function(){
    self.start();
    self.isAnimating = false;
  }, 2000);

  this.emit('click', index, el, target);

  return false;
};

ScrollSpy.prototype.activate = function(index) {
  if( this._current === index ) return;
  this.links.forEach(function(el){
    el.classList.remove('is-selected');
  });
  this.links[index].classList.add('is-selected');
  this._current = index;
};

ScrollSpy.prototype.start = function() {
  if(this._started) {
    return;
  }
  this._started = true;
  event.bind(window, 'scroll', this._onWindowScroll);
  event.bind(window, 'resize', this._onWindowResize);
  this._checkDocumentHeight();
};

ScrollSpy.prototype._checkDocumentHeight = function() {
  if(this._started === false ) {
    return;
  }

  if(!this._height) {
    this._height = document.body.offsetHeight;
    this.update();
  }
  else {
    var newHeight = document.body.offsetHeight;
    if(newHeight !== this._height) {
      this.update();
      this._height = newHeight;
    }
  }

  // Keep calling this method to update the height
  setTimeout(this._checkDocumentHeight.bind(this), 500);
};

ScrollSpy.prototype.stop = function() {
  event.unbind(window, 'scroll', this._onWindowScroll);
  event.unbind(window, 'resize', this._onWindowResize);
  this._started = false;
};

ScrollSpy.create = function(selector, options) {
  Array.prototype.forEach.call(document.querySelectorAll(selector), function(el){
    return new ScrollSpy(el, options);
  });
};

module.exports = ScrollSpy;
