(function() {
  var ANIMATIONS = {
    fadeIn: {
      'opacity': ['0', '1']
    },
    fadeOut: {
      'opacity': ['1', '0']
    },
    slideDown: {
      'transform': ['translate3d(0,0%,0)', 'translate3d(0,100%,0)'],
      operation: 'add'
    },
    slideUp: {
      'transform': ['translate3d(0,0%,0)', 'translate3d(0,-100%,0)'],
      operation: 'add'
    },
    slideLeft: {
      'transform': ['translate3d(0%,0,0)', 'translate3d(-100%, 0,0)'],
      operation: 'add'
    },
    slideRight: {
      'transform': ['translate3d(0%,0,0)', 'translate3d(100%,0,0)'],
      operation: 'add'
    },
    slideFromLeft: {
      'transform': ['translate3d(-100%,0,0)', 'translate3d(0%, 0,0)'],
      operation: 'add'
    },
    slideFromRight: {
      'transform': ['translate3d(100%,0,0)', 'translate3d(0%,0,0)'],
      operation: 'add'
    }
  };

  var DEFAULT_ANIMATION_CLASS = Animation;
  var ANIMATION_CLASSES = {
    'par': ParGroup,
    'seq': SeqGroup
  }

  function animationForType(inType) {
    return ANIMATION_CLASSES[inType] || DEFAULT_ANIMATION_CLASS;
  }

  function isGroupType(inType) {
    return Boolean(ANIMATION_CLASSES[inType]);
  }

  function propertiesForType(inType) {
    return ANIMATIONS[inType] || [];
  }

  var gAnimationPrototype = {
    duration: 0.3,
    fillMode: 'none',
    easing: 'linear',
    iterationCount: 1,
    startDelay: 0,
    type: 'fadeOut',
    target: null,
    animation: null,
    autoplay: false,
    properties: null,
    readyCallback: function() {
      document.utils.attributesToProperties(this);
      this.properties = [];
      this.job('apply');
    },
    play: function() {
      this.completeJob('apply');
      if (this.animation) {
        if (this.player) {
          this.player.source = null;
        }
        this.player = document.timeline.play(this.animation);
        //console.log('play', this.player);
        this.player.paused = false;
        this.player.currentTime = 0;
        this.monitor();
      }
    },
    apply: function() {
      this.cancelJob('apply');
      if (this.type) {
        this.properties = propertiesForType(this.type);
      }
      this.animation = null;
      var ctor = animationForType(this.type), group = isGroupType(this.type);
      if (this.target && !group) {
        //console.log('apply', this.target, this.properties, this.timingProps);
        this.animation = new ctor(this.target, this.properties, this.timingProps);
      } else if (group) {
        if (this.target) {
          this.doOnChildren(function(c) {
            c.target = this.target;
          });
        }
        var children = this.childAnimations;
        //if (children.length) {
          //console.log('apply', this.target, this.properties, this.timingProps);
          this.animation = new ctor(children, this.timingProps);
        //}
      }
      if (this.autoplay && this.animation) {
        this.play();
      }
      if (this.animation) {
        this.asyncApplyParent();
      }
      return this.animation;
    },
    asyncApply: function() {
      this.job('apply');
    },
    addType: function(inType, inProps) {
      ANIMATIONS[inType] = inProps;
    },
    getType: function(inType) {
      return ANIMATIONS[inType];
    },
    durationChanged: function() {
      this.asyncApply();
    },
    fillModeChanged: function() {
      this.asyncApply();
    },
    easingChanged: function() {
      this.asyncApply();
    },
    iterationCountChanged: function() {
      this.asyncApply();
    },
    startDelayChanged: function() {
      this.asyncApply();
    },
    kindChanged: function() {
      this.asyncApply();
    },
    typeChanged: function() {
      this.asyncApply();
    },
    targetChanged: function() {
      this.asyncApply();
    },
    asyncApplyParent: function() {
      var p = this.parentNode;
      if (p && p.asyncApply) {
        p.asyncApply();
      }
    },
    doOnChildren: function(inFn) {
      Array.prototype.forEach.call(this.children, inFn, this);
    },
    get childAnimations() {
      var list=[];
      Array.prototype.forEach.call(this.children, function(c) {
        c.completeJob('apply');
        if (c.animation) {
          list.push(c.animation);
        }
      });
      return list;
    },
    get timingProps() {
      var props = {
        fillMode: this.fillMode,
        timingFunction: this.easing,
        iterationCount: this.iterationCount,
        startDelay: this.startDelay
      }
      if (!isGroupType(this.type) || this.hasOwnProperty('duration')) {
        props.duration = this.duration;
      }
      return props;
    },
    monitor: function() {
      // TODO(sorvell): adding brittle support for an end event
      if (this.player && this.player.source && 
          this.player._isPastEndOfActiveInterval()) {
        this.complete();
      } else {
        webkitRequestAnimationFrame(this.monitor.bind(this));
      }
    },
    // intended for user implementation
    complete: function() {
    }
  };
  
  document.utils.setupProperties(gAnimationPrototype);
  document.utils.job.bindTo(gAnimationPrototype);
  
  gAnimationPrototype.__proto__ = HTMLElement.prototype;
  

  document.register('g-animation', {
    prototype: gAnimationPrototype
  });
})();