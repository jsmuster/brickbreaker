/**
 *  The brick breaker application
 *
 *  @namespace BrickBreaker
 */
BrickBreaker = new function()
{
  //########################################
  //Private member variables
  //########################################

  //DOM Nodes
  var DOM = {
    platform: null,
    ball: null,
    bricks: null,
    message: null
  };

  //Messages
  var messages = {
    start: 'Press the spacebar to start the game',
    round_win: 'Round won! Press the spacebar to go to the next level',
    won: 'You\'ve won! Press the spacebar to play again',
    lost: 'Uh Oh you lost! Press the spacebar to play again'
  };

  /**
   *  Each level contains 4 rows of at most 8 bricks
   *
   *  Brick Values:
   *    0: none
   *    1: default
   *    2: strong block (2 hits needed)
   *    3: invuln block
   */
  var levels = [

    //Starting level
    [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 2, 2, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0]
    ],

    //Mid Level
    [
      [0, 1, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 3, 3, 2, 2, 1],
      [2, 1, 2, 2, 2, 2, 1, 2],
      [0, 3, 1, 2, 2, 1, 3, 0]
    ],

    //Avd Level
    [
      [2, 2, 1, 1, 1, 1, 2, 2],
      [2, 2, 1, 2, 2, 1, 2, 2],
      [2, 2, 2, 3, 3, 2, 2, 2],
      [3, 1, 3, 3, 3, 3, 1, 3]
    ]
  ];

  //Current level index
  var current_level = 0;

  //Is the game in progress?
  var in_progress = false;

  /**
   *  When building the bricks based on the level, use this array to store brick info
   *
   *  Each item in the array should match the following format:
   *
   *  {
   *    elem: The HTMLElement
   *    rect: The rect provided by getBoundingClientRect(),
   *    type: The brick type:
   *      1: default
   *      2: strong
   *      3: invuln block
   *  }
   */
  var bricks = [];

  /**
   *  Keep track of the ball and platform directions
   *
   *  Value:
   *    -1: Ball or platform moving left
   *    0: Ball or platform not moving
   *    1: Ball or platform moving right
   */
  var tracking = {
    ball_x: -1,
    ball_y: 1,
    plat_x: 0
  };

  /**
   *  Modify the speed of the ball or platform
   *  A frame is rendered at roughly 60fps
   *
   *  1 second of movement = modifier * 60
   */
  var modifiers = {
    ball_x: 5,
    ball_y: 7,
    plat_x: 20
  };

  /**
   * Animation Request
   */
  let animRequest = null;

  let startTime;
  let changeDelta;

  // view bounding box
  let vwidth, vheight;

  let debugCache = localStorage.getItem('debugMode') == 'true',
      ballCoordinates = JSON.parse(localStorage.getItem('ballCoordinates')),
      trackingInfo = JSON.parse(localStorage.getItem('trackingInfo'));

  let debugMode = debugCache === true ? true : false;

  if(debugMode == true && trackingInfo != null)
  {
    tracking = trackingInfo;
  }
  //trackingInfo

  function main()
  {
    configure();
    initialize();
  }

  let Dot;
  //########################################
  //Private member functions
  //########################################
  function configure()
  {
    var DotProto = Object.create(HTMLElement.prototype);

    // Called when a custom element is created.
    DotProto.createdCallback = function() {}

    // Called when a custom element is inserted into the DOM.
    DotProto.attachedCallback = function() {}

    // Called when a custom element is removed from the DOM.
    DotProto.detachedCallback = function() {}

    // Called when an attribute on a custom element changes.
    DotProto.attributeChangedCallback = function(attrName, oldValue, newValue) {}

    Object.defineProperty(DotProto, 'badges', {
      value: 20,
      writable : true
    });

    Dot = document.registerElement('x-dot',  {
      prototype: DotProto
    });
  };
  /**
   *  Initialize our first level
   *
   *  @private
   *
   *  @return {undefined}
   */
  function initialize()
  {
    //Get DOM nodes
    //TODO
    // DOM

    DOM.platform = {el: document.getElementById("platform")};

    DOM.platform.rect = DOM.platform.el.getBoundingClientRect();
    
    console.log("DOM.platform.rect", DOM.platform.rect);

    DOM.platform.width = DOM.platform.el.clientWidth;
    DOM.platform.height = DOM.platform.el.clientHeight;

    DOM.platform.y = DOM.platform.el.offsetTop;
    DOM.platform.x = DOM.platform.el.offsetLeft;

    DOM.platform.setX = (function (x) {
      
      this.el.style.left = x + "px";
      this.x = x;

    }).bind(DOM.platform);

    DOM.ball = {el:document.getElementById("ball")};

    DOM.ball.rect = DOM.ball.el.getBoundingClientRect();

    DOM.ball.width = DOM.ball.el.clientWidth;
    DOM.ball.height = DOM.ball.el.clientHeight;

    DOM.ball.y = DOM.ball.el.offsetTop;
    DOM.ball.x = DOM.ball.el.offsetLeft;

    DOM.ball.setX = (function (x) {
      
      this.el.style.left = x + "px";
      this.x = x;
      
    }).bind(DOM.ball);

    DOM.ball.setY = (function (y) {
      
      this.el.style.top = y + "px";
      this.y = y;
      
    }).bind(DOM.ball);

    DOM.ball.reverseX = (function () {
      tracking.ball_x = tracking.ball_x * -1;
    });

    DOM.ball.reverseY = (function () {
      tracking.ball_y = tracking.ball_y * -1;
    });


    DOM.bricks = document.getElementById("bricks");
    DOM.message = document.getElementById("message");

    vwidth = document.documentElement.clientWidth;
    vheight = document.documentElement.clientHeight;

    // window.innerWidth
    // window.innerHeight
    // window.screen.height
    // window.screen.width

    //Start
    //TODO
    start();

    //Animate
    //TODO
    if(animRequest != null)
    {
      cancelAnimationFrame(animRequest);
    }
    
    doAnimate();
  }

  /**
   *  Start the brick breaker game
   *
   *  @return {undefined}
   */
  function start(arg_message)
  {
    //Position platform
    positionPlatform();

    //Position ball
    positionBall();

    //Build the bricks
    buildBricks();

    startTimer = Date.now();

    in_progress = true;
  };

  /**
   *  Reset the game
   *
   *  @private
   *
   *  @return {undefined}
   */
  function reset()
  {
    in_progress = false;

    tracking = {
      ball_x: 1,
      ball_y: 1,
      plat_x: 0
    };

    return start();
  }

  function gameOver(msg)
  {
    in_progress = false;

    tracking = {
      ball_x: 1,
      ball_y: 1,
      plat_x: 0
    };

    if(msg != null)
    {
      showMessage(msg);
    }

    if(animRequest != null)
    {
      cancelAnimationFrame(animRequest);
    }
  }

  /**
   *  Show a message
   *
   *  @private
   *
   *  @param  {string} msgUid The message key to display, null hides the message
   *
   *  @return {undefined}
   */
  function showMessage(msgUid)
  {
    var message = messages[msgUid];
    if (!message) return DOM.message.classList.remove('active');

    DOM.message.innerHTML = message;
    DOM.message.classList.add('active');
  }

  function createBrick(type)
  {
    let brick = document.createElement("div");

    if(type == 0)
    {
      brick.className = 'empty';
    }
    else if(type == 1)
    {
      
    }
    else if(type == 2)
    {
      brick.className = 'strong hit';
    }
    else if(type == 3)
    {
      brick.className = 'invuln';
    }

    return brick;
  }

  // draws a dot
  function createDot(x, y, color, size)
  {
    let dot = document.createElement("x-dot");
    
    dot.setAttribute('id', 'dot');

    if(size !=null && size != 0)
    {
      dot.style.left = (x - size / 2) + "px";
      dot.style.top = (y - size / 2) + "px";
    }
    else
    {
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    }

    if(color != null && color.length > 0)
    {
      dot.style.backgroundColor = color;
    }
    
    if(debugMode)
    {
      // removes a dot 5 seconds later
      setTimeout(function () {
        dot.parentNode.removeChild(dot);
      }, 100000);
    }
    else
    {
      // removes a dot 5 seconds later
      setTimeout(function () {
        dot.parentNode.removeChild(dot);
      }, 3000);
    }

    DOM.bricks.appendChild(dot);
    
    // dot.style.left = (x - dot.clientWidth / 2) + "px";
    // dot.style.top = (y - dot.clientHeight / 2) + "px";
    
    return dot;
  }

  // draws a line
  function createLine(x1, y1, x2, y2)
  {
    let line = document.createElement("div");

    let canvas = document.getElementById('canvas');

    let xdiff = x2 - x1,
        ydiff = y2 - y1;

    if(canvas.getContext != null)
    {
      let ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.abs(xdiff), Math.abs(ydiff));
      ctx.closePath();
      ctx.stroke();
    }

    line.appendChild(canvas);
    
    line.setAttribute('id', 'line');

    line.style.left = x1 + "px";
    line.style.top = y1 + "px";

    if(xdiff < 0)
    {
      canvas.style.left = xdiff + "px";
    }

    if(ydiff < 0)
    {
      canvas.style.top = ydiff + "px";
    }
    
    return line;
  };

  /**
   *  Build the brick DOM nodes for the current level
   *
   *  @private
   *
   *  @return {undefined}
   */
  function buildBricks()
  {
    /**
     *  TODO:
     *
     *  When adding elements to the <div id="bricks"> container follow this format:
     *    No Brick: <div class="empty"></div>
     *    Normal Brick: <div></div>
     *    Strong Brick: <div class="strong"></div>
     *    Strong HIT Brick: <div class="strong hit"></div>
     *    Invuln Brick: <div class="invuln"></div>
     *
     *  Be sure to:
     *    - Add brick elements to container
     *    - Set classes as needed
     *    - Store brick information in the bricks[] array
     */

    let lvl = levels[current_level], row, brick, brickType;

    window.DOM = DOM;

    for(const row of lvl)
    {
      for(const brickType of row)
      {
        brick = createBrick(brickType);

        DOM.bricks.appendChild(brick);

        bricks.push({
          elem: brick,
          rect: brick.getBoundingClientRect(),
          type: brickType
        });
      }
    }
  };

  //########################################
  //Collision Detection
  //########################################

  /**
   *  Are two rects intersecting?
   *
   *  @private
   *
   *  @param  {object} r1 The first rect
   *  @param  {object} r2 The second rect
   *
   *  @return {boolean} True if they intersect, false otherwise
   */
  // should work for browser coordinate space
  function isIntersecting(r1, r2)
  {
    return (r1.left <= r2.right && 
            r2.left <= r1.right && 
            r1.top <= r2.bottom && 
            r2.top <= r1.bottom);
  }

  // (a,b) -> (c,d) intersects (p,q) -> (r, s)
  function linesIntersect(a, b, c, d, p, q, r, s)
  {
    var det, gamma, lambda;

    det = (c - a) * (s - q) - (r - p) * (d - b);
    
    if(det === 0)
    {
      return false;
    }
    else
    {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
  };

  // checks if the point is inside a rectangle
  function isPointInside(x, y, rect)
  {
    return (rect.x <= x && x <= rect.x + rect.width && rect.y <= y && y <= rect.y + rect.height) ? 1 : 0;
  }

  function getCenterX(rect)
  {
    return (rect.left + (rect.left - rect.right) / 2);
  }

  function getCenterY(rect)
  {
    return (rect.top + (rect.top - rect.bottom) / 2);
  }
  /**
   *  Should the ball reverse the X direction when it hits/intersects with another object
   *
   *  @private
   *
   *  @param  {object} brect The ball rect
   *  @param  {object} orect The object rect
   *
   *  @return {boolean} True if the ball should reverse direction, false otherwise
   */
  function shouldReverseXv(ballrect, brickrect)
  {
    brickrect.x;

    let minAx = ballrect.x, minAy = ballrect.y, maxAx = ballrect.x + ballrect.width, maxAy = ballrect.y + ballrect.height;
    let minBx = brickrect.x, minBy = brickrect.y, maxBx = brickrect.x + brickrect.width, maxBy = brickrect.y + brickrect.height;

    let aLeftOfB = maxAx < minBx;
    let aRightOfB = minAx > maxBx;
    let aAboveB = minAy > maxBy;
    let aBelowB = maxAy < minBy;
    debugger;
    return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
  }

  function shouldReverseX(ballrect, brickrect)
  {
    let topleft = isPointInside(ballrect.x, ballrect.y, brickrect),
        topRight = isPointInside(ballrect.x + ballrect.width, ballrect.y, brickrect),
        btmLeft = isPointInside(ballrect.x, ballrect.y + ballrect.height, brickrect),
        btmRight = isPointInside(ballrect.x + ballrect.width, ballrect.y + ballrect.height, brickrect);

    let dir = getBallDirection();

    debugger;
  }

  function shouldReverseXx(ballrect, brickrect)
  {
    let w = 0.5 * (ballrect.width + brickrect.width);
    let h = 0.5 * (ballrect.height + brickrect.height);

    let dx = getCenterX(ballrect) - getCenterX(brickrect);
    let dy = getCenterY(ballrect) - getCenterY(brickrect);

    /* collision! */
    let wy = w * dy;
    let hx = h * dx;

    if(wy > hx)
    {
      if(!(wy > -hx))
      {
        // left
        return 1;
      }
    }
    else
    {
      if(wy > -hx)
      {
        // right
        return 2;
      }
    }

    return false;
  }

  /**
   *  Should the ball reverse the Y direction when it hits/intersects with another object
   *
   *  @private
   *
   *  @param  {object} ballrect The ball rect
   *  @param  {object} brickrect The brick rect
   *
   *  @return {boolean} True if the ball should reverse direction, false otherwise
   */

  function shouldReverseY(ballrect, brickrect)
  {
    let w = 0.5 * (ballrect.width + brickrect.width);
    let h = 0.5 * (ballrect.height + brickrect.height);

    let dx = getCenterX(ballrect) - getCenterX(brickrect);
    let dy = getCenterY(ballrect) - getCenterY(brickrect);

    let wy = w * dy;
    let hx = h * dx;

    if(wy > hx)
    {
      if(wy > -hx)
      {
        // top
        return 1;
      }
    }
    else if(!(wy > -hx))
    {
      // bottom
      return 2;
    }

    return false;
  }

  /**
   *  Checks the ball for any collisions between bricks, the platform, or the screen
   *
   *  The platform should not go past the screen boundaries
   *  If the ball hits an object it should change its direction
   *  If the ball goes past the platform and goes past the bottom edge, the game is over
   *  If the ball hits a brick:
   *    If its a normal brick, change the ball direction and hide the brick
   *    If its a strong brick, after one additional hit, change the ball direction and hide the brick
   *    If its an invuln brick, change the ball direction
   *
   *  @return {undefined}
   */
  function checkCollisions()
  {
    if (!in_progress) return;

    //Check screen collisions
    checkScreenCollisions();

    //Check platform collisions
    checkPlatformCollisions();

    //Check brick collisions
    checkBrickCollisions();
  }

  /**
   *  Check ball and platform collisions with the screen
   *
   *  @private
   *
   *  @return {undefined}
   */
  function checkScreenCollisions()
  {
    /**
     *  TODO
     *
     *  This function checks collisions between the ball/platform and the viewport
     *
     *  Since the platform only moves horizontally, you only need to check the X direction and use positionPlatform
     *  The ball moves in both the X and Y directions so be sure to set the X/Y tracking accordingly and use positionBall
     *
     *  If the ball goes PAST the platform and hits the bottom edge of the screen the game is over, reset the level to 0 and show a 'lost' message
     */


    // ball reaches the most left
    if(DOM.ball.x < 0)
    {
      DOM.ball.setX(0);
      tracking.ball_x = tracking.ball_x * -1;
    }
    // platform reached the most right
    else if(vwidth - DOM.ball.x - DOM.ball.width < 0)
    {
      DOM.ball.setX(vwidth - DOM.ball.width);

      // rev tracking.ball_x = tracking.ball_x * -1;
      DOM.ball.reverseX();
    }

    // ball reaches the most top
    if(DOM.ball.y < 0)
    {
      DOM.ball.setY(0);
      // rev tracking.ball_y = tracking.ball_y * -1;
      DOM.ball.reverseY();
    }
    // ball reached the most bottom
    else if(vheight - DOM.ball.y - DOM.ball.height < 0)
    {
      //DOM.ball.setY(vheight - DOM.ball.height);

      //tracking.ball_y = tracking.ball_y * -1;
      console.log("most bottom")
      gameOver('lost');
      //reset();
    }
    
    // platform reached the most left
    if(DOM.platform.x < 0)
    {
      DOM.platform.setX(0);
    }
    // platform reached the most right
    else if(vwidth - DOM.platform.x - DOM.platform.width < 0)
    {
      DOM.platform.setX(vwidth - DOM.platform.width);
    }
  }

  /**
   *  Check the ball for collisions with the platform
   *
   *  @private
   *
   *  @return {undefined}
   */
  function checkPlatformCollisions()
  {
    /**
     *  TODO
     *
     *  This function checks collisions between the ball and the platform
     *
     *  Be sure to use isIntersecting and shouldReverseX/shouldReverseY to change the ball tracking modifier
     *  Also be sure to account for the platform movement that can also change the ball direction
     */

     DOM.platform.rect = DOM.platform.el.getBoundingClientRect();
     DOM.ball.rect = DOM.ball.el.getBoundingClientRect();

     //DOM.platform.rect;
     //DOM.ball.rect;

     //console.log("DOM.platform.rect", DOM.platform.rect);
     //console.log("DOM.ball.rect", DOM.ball.rect);

     if(isIntersecting(DOM.platform.rect, DOM.ball.rect))
     {
      //DOM.ball.setY(vheight - DOM.ball.height);
      // rev tracking.ball_y = tracking.ball_y * -1;
      DOM.ball.reverseY();
     }

     //shouldReverseX();
     //shouldReverseY();
  }


  function midpoint(x1, y1, x2, y2, perc)
  {
    return {x: x1 + (x2 - x1) * perc, y: y1 + (y2 - y1) * perc};
  }

  // figures out last good point before rectangles intersect
  function lastGoodPointb4Collision(brickrect, ballrect, prevX, prevY)
  {
    let midp, 
        lastgoodp = {x:prevX, y: prevY}, 
        ball;

    let avgmod = Math.ceil(Math.ceil(modifiers.ball_x + modifiers.ball_y) / 2) * 3;

    let A = {x:prevX, y:prevY};
    let B = {x:ballrect.x, y:ballrect.y};
    //ball = {...ballrect};//{x:ballrect.x, y:ballrect.y, width: ballrect.width, height: ballrect.height};
    let C = extendLine({x:B.x, y:B.y}, {x:A.x, y:A.y}, avgmod);

    for(var i = 1, l = 20; i < l; i++)
    {
      // (x1,y1, x2,y2 => x3,y3, x4,y4)
      midp = midpoint(A.x, A.y, C.x, C.y, 0.05 * i);

      //ball.x = midp.x;
      //ball.y = midp.y;
      ball = {width: ballrect.width, height: ballrect.height, x:midp.x, y:midp.y, left: midp.x, top: midp.y};
      ball.right = ball.x + ball.width;
      ball.bottom = ball.y + ball.height;

      DOM.ball.setX(midp.x);
      DOM.ball.setY(midp.y);

      // uses left right top bottom
      if(!isIntersecting(brickrect, ball))
      {
        break;
      }
      else
      {
        lastgoodp = midp;
      }
    }

    return lastgoodp;
    
  }

  /**
   *  Checks the ball for collisions with any visibile bricks and handle hit tracking
   *
   *  @private
   *
   *  @return {undefined}
   */
  function checkBrickCollisions()
  {
    /**
     *  TODO
     *
     *  This function checks collisions between the ball and the bricks[] array
     *
     *  Be sure to use isIntersecting and shouldReverseX/shouldReverseY to change the ball tracking modifier
     *  When a brick is hit be sure to set/remove/add the correct classes
     *  Follow this format:
     *    Normal -> Empty
     *    Strong -> Normal
     *    Strong HIT -> Strong 
     *    Invuln -> Invuln
     */
    DOM.ball.rect = DOM.ball.el.getBoundingClientRect();
    let badbricks = [], bbrick;

    bricks.forEach((brick) => 
    {
      if(brick.type > 0 && isIntersecting(brick.rect, DOM.ball.rect))
      {
        badbricks.push(brick);
      }
    });

    if(badbricks.length)
    {

      if(badbricks.length == 1)
      {
        processCollision(badbricks[0]);
      }
      else
      {
        // least x & y, most x & y
        let left = null, top = null, right = null, bottom = null;
        
        // get the least and highest points and make a rectangle that will be used in collision
        badbricks.forEach(({rect}) => 
        {
          if(left == null || left > rect.x)
          {
            left = rect.x;
          }

          if(top == null || top > rect.y)
          {
            top = rect.y;
          }
          
          if(right == null || right < (rect.x + rect.width))
          {
            right = (rect.x + rect.width);
          }

          if(bottom == null || bottom < (rect.y + rect.height))
          {
            bottom = (rect.y + rect.height);
          }

        });

        bbrick = {rect:{x: left, y: top, width: (right - left), height: (bottom - top), left, right, top, bottom}};
        console.log("bbrick", bbrick);

        // bbrick.left = left;
        // bbrick.right = right;
        // bbrick.top = top;
        // bbrick.bottom = bottom;

        processCollision(bbrick);
      }
    }
  }

  // extends a line and gets us the end coordinate
  // You can do it by finding unit vector of your line segment and scale it to your desired length, 
  // then translating end-point of your line segment with this vector. Assume your line segment end points are A and B 
  // and you want to extend after end-point B (and lenAB is length of line segment).
  function extendLine(A, B, length)
  {
    let C = {};
    let lenAB = Math.sqrt(Math.pow(A.x - B.x, 2.0) + Math.pow(A.y - B.y, 2.0));

    C.x = B.x + (B.x - A.x) / lenAB * length;
    C.y = B.y + (B.y - A.y) / lenAB * length;

    return C;
  };

  function processCollision(brick)
  {
    let brect, side, ballrect, brickrect, topleft, topRight, btmLeft, btmRight, dir, psum, px, py, goodp, badbricks;

    console.log("intersecting ", brick);

    ballrect = DOM.ball.rect;
    brickrect = brick.rect;

    topleft = isPointInside(ballrect.left, ballrect.top, brickrect);
    topRight = isPointInside(ballrect.right, ballrect.top, brickrect);
    btmLeft = isPointInside(ballrect.left, ballrect.bottom, brickrect);
    btmRight = isPointInside(ballrect.right, ballrect.bottom, brickrect);
    
    psum = topleft + topRight + btmLeft + btmRight;

    // usually 1 or 2 points would be inside a rectangle
    if(psum == 2)
    {
      // check pairs of points
      if(topleft && topRight)
      {
        DOM.ball.reverseY();
      }
      else if(topRight && btmRight)
      {
        DOM.ball.reverseX();
      }
      else if(btmLeft && btmRight)
      {
        DOM.ball.reverseY();
      }
      else if(topleft && btmLeft)
      {
        DOM.ball.reverseX();
      }
    }
    // only one point, edge case
    else if(psum == 1)
    {
      //dir = getBallDirection();

      // extend line by average of ball movement per frame
      let A, B, B2, A2, avgmod = Math.ceil(Math.ceil(modifiers.ball_x + modifiers.ball_y) / 2);

      createDot(prevX, prevY, 'blue', 3);
      createDot(DOM.ball.x, DOM.ball.y, 'green', 3);

      if(topleft)
      {
        A = {x: prevX, y: prevY};
        B = {x: DOM.ball.x, y: DOM.ball.y};

        A2 = extendLine({x:B.x, y:B.y}, {x:A.x, y:A.y}, avgmod);
        B2 = extendLine({x:A.x, y:A.y}, {x:B.x, y:B.y}, avgmod);

        createDot(A.x, A.y, "yellow", 3);
        createDot(B.x, B.y, "yellow", 3);

        createDot(A2.x, A2.y, "red", 3);
        createDot(B2.x, B2.y, "red", 3);

        // btm brick line
        if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
          brickrect.left, brickrect.bottom, brickrect.right, brickrect.bottom))
        {
          DOM.ball.reverseY();
        }
        // right brick side
        else 
           if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
           brickrect.right, brickrect.top, brickrect.right, brickrect.bottom))
        {
          DOM.ball.reverseX();
        }
      }
      else if(topRight)
      {
        A = {x: prevX + DOM.ball.width, y: prevY};
        B = {x: (DOM.ball.x + DOM.ball.width), y: DOM.ball.y};

        A2 = extendLine({x:B.x, y:B.y}, {x:A.x, y:A.y}, avgmod);
        B2 = extendLine({x:A.x, y:A.y}, {x:B.x, y:B.y}, avgmod);

        createDot(A.x, A.y, "yellow", 3);
        createDot(B.x, B.y, "yellow", 3);

        createDot(A2.x, A2.y, "red", 3);
        createDot(B2.x, B2.y, "red", 3);

        // btm brick line
        if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
          brickrect.left, brickrect.bottom, brickrect.right, brickrect.bottom))
        {
          DOM.ball.reverseY();
        }
        // left brick side
        else 
           if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
           brickrect.left, brickrect.top, brickrect.left, brickrect.bottom))
        {
          DOM.ball.reverseX();
        }
      }
      else if(btmRight)
      {
        A = {x: prevX + DOM.ball.width, y: prevY + DOM.ball.height};
        B = {x: (DOM.ball.x + DOM.ball.width), y: DOM.ball.y + DOM.ball.height};

        A2 = extendLine({x:B.x, y:B.y}, {x:A.x, y:A.y}, avgmod);
        B2 = extendLine({x:A.x, y:A.y}, {x:B.x, y:B.y}, avgmod);

        createDot(A.x, A.y, "yellow", 3);
        createDot(B.x, B.y, "yellow", 3);

        createDot(A2.x, A2.y, "red", 3);
        createDot(B2.x, B2.y, "red", 3);

        // top brick line
        if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
          brickrect.left, brickrect.top, brickrect.right, brickrect.top))
        {
          DOM.ball.reverseY();
        }
        // left brick side
        else
          if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
           brickrect.left, brickrect.top, brickrect.left, brickrect.bottom))
        {
          DOM.ball.reverseX();
        }
      }
      else if(btmLeft)
      {
        A = {x: prevX, y: prevY + DOM.ball.height};
        B = {x: DOM.ball.x, y: DOM.ball.y + DOM.ball.height};

        A2 = extendLine({x:B.x, y:B.y}, {x:A.x, y:A.y}, avgmod);
        B2 = extendLine({x:A.x, y:A.y}, {x:B.x, y:B.y}, avgmod);

        createDot(A.x, A.y, "yellow");
        createDot(B.x, B.y, "yellow");

        createDot(A2.x, A2.y);
        createDot(B2.x, B2.y);

        // top brick line
        if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
          brickrect.left, brickrect.top, brickrect.right, brickrect.top))
        {
          DOM.ball.reverseY();
        }
        // right brick side
        else
          if(linesIntersect(A2.x, A2.y, B2.x, B2.y, 
           brickrect.right, brickrect.top, brickrect.right, brickrect.bottom))
        {
          DOM.ball.reverseX();
        }
      }
    }
    else
    {
      // shouldn't really happen
      console.log("odd behavior, the ball is inside a rectangle fully")
    }

    ballrect = DOM.ball.rect;

    goodp = lastGoodPointb4Collision(brick.rect, ballrect, prevX, prevY);
    console.log("last good point", goodp);
    DOM.ball.setX(goodp.x);
    DOM.ball.setY(goodp.y);

    return;
    /***** old code ****/
    side = shouldReverseX(DOM.ball.rect, brick.rect);

    if(side)
    {
      DOM.ball.reverseX();
      //debugger
      // left
      if(side == 1)
      {
        DOM.ball.setX(Math.ceil(brick.rect.right));
      }
      // right
      else
      {
        DOM.ball.setX(Math.ceil(brick.rect.x) - Math.ceil(DOM.ball.width));
      }
    }

    side = shouldReverseY(brick.rect, DOM.ball.rect);

    if(side)
    {
      DOM.ball.reverseY();

      // top
      if(side == 1)
      {
        DOM.ball.setY(Math.ceil(brick.rect.bottom));
      }
      // bottom
      else
      {
        DOM.ball.setY(Math.ceil(brick.rect.y) - Math.ceil(DOM.ball.height));
      }
    }
  };

  //########################################
  //Event Handlers
  //########################################

  /**
   *  A keydown event was caught, handle it
   *
   *  @private
   *
   *  @param  {Event} evt The event object
   *
   *  @return {undefined}
   */
  function onKeydown({keyCode})
  {
    /**
     *  TODO
     *
     *  Handle a keydown event, follow this format:
     *
     *  Space: Start the game and clear any visible messages
     *  Escape: Reset the game
     *  Left/Right: Move the platform by changing the tracking modifier
     */

    switch(keyCode)
    {
      // d
      case 68:
        // toggle debug mode with key d
        debugMode = debugMode ? false : true;
        //debugger
        localStorage.setItem('debugMode', debugMode);
        localStorage.setItem('trackingInfo' , JSON.stringify(tracking));
        localStorage.setItem('ballCoordinates' , JSON.stringify({x: DOM.ball.x, y: DOM.ball.y}));
        
        if(debugMode == false && animRequest == null)
        {
          animRequest = requestAnimationFrame(doAnimate);
        }

      break;
      // ]
      case 221:
        doAnimate();
        cancelAnimationFrame(animRequest);
      break;
      // >
      case 190:
      break;
      // space
      case 32:
        
      break;
      // right
      case 37:
      //console.log("right");
        tracking.plat_x = 1;
        startTimer = Date.now();
      break;
      // left
      case 39:
      //console.log("left");
        tracking.plat_x = -1;
        startTimer = Date.now();
      break;
      // escape
      case 27:
      break;
    }
  }

  /**
   *  A keyup event was caught, handle it
   *
   *  @private
   *
   *  @param  {Event} evt The event object
   *
   *  @return {undefined}
   */
  function onKeyup({keyCode})
  {
    console.log("onKeyup", keyCode)
    /** 
     *  TODO
     *
     *  Handle a keyup event, follow this format:
     *
     *  Left/Right: Stop moving the platform
     */

    switch(keyCode)
    {
      // space
      case 32:
      
      break;
      // right
      case 37:
      //console.log("key up right", tracking);
        tracking.plat_x = 0;
        //console.log("tracking",tracking);
      break;
      // left
      case 39:
      //console.log("key up left", tracking);
        tracking.plat_x = 0;
        //console.log("tracking",tracking);
      break;
      // escape
      case 27:
      break;
    }
  };

  let prevX, prevY;

  function getBallDirection(x, y)
  {
    let xDirection, yDirection;

    //deal with the horizontal case
    if (prevX < x)
    {
      xDirection = "right";
    }
    else
    {
      xDirection = "left";
    }

    //deal with the vertical case
    if (prevY < y)
    {
      yDirection = "down";
    }
    else
    {
      yDirection = "up";
    }

    return {x: xDirection, y: yDirection};
  }

  /**
   *  This function is called each time a frame should be rendered
   *
   *  @private
   *
   *  @return {undefined}
   */
  function doAnimate()
  {
    /**
     *  TODO
     *
     *  This function handles all animation
     *
     *  Be sure to:
     *    - If the platform is moving, position it
     *    - Position the ball based on the tracking and modifiers
     *    - Check for collisions using checkCollisions()
     *    - Check to see if there are no more bricks and either go to the next round or show a win message and start over
     */
     

    if(debugMode == false)
    {
      animRequest = requestAnimationFrame(doAnimate);
    }
    else
    {
      animRequest = null;
    }

    let now = Date.now();

    changeDelta = (now) % 1000 / 1000;
    
    let msg = ("delta : " + (now - startTimer) % 1000 / 1000);
    //DOM.message.innerHTML = JSON.stringify(tracking);

    if(tracking.ball_x != 0 || tracking.ball_y != 0)
    {
      positionBall(modifiers.ball_x * tracking.ball_x, modifiers.ball_y * tracking.ball_y, true);
    }

    if(tracking.plat_x != 0)
    {
      //let platformChange = changeDelta * modifiers.plat_x;
      positionPlatform(modifiers.plat_x * tracking.plat_x * -1, true, 1134);
    }

    msg = vwidth - DOM.platform.x - DOM.platform.width;
    msg = DOM.platform.x;

    DOM.message.innerHTML = msg;

    // this should execute after we change our position
    checkCollisions();

    // save to understand direction
    prevX = DOM.ball.x;
    prevY = DOM.ball.y;

    //startTimer = Date.now();

    //checkCollisions();
  }

  //########################################
  //Element Positioning
  //########################################

  /**
   *  Position the platform
   *
   *  @private
   *
   *  @param  {number} position The positive or negative number to position the platform
   *                                If the value is positive, it moves the platform that many pixels to the right
   *                                If the value is negative, it moves the platform that many pixels to the left
   *                                If the value is not a number, it centers the platform
   *  @param  {boolean} increment Defaults to true, increment the positions rather than setting
   *
   *  @return {undefined}
   */
  function positionPlatform(position, increment, from)
  {
    //console.log("positionPlatform", from);
    //TODO
    if(position != null)
    {
      if(increment)
      {
        DOM.platform.setX(DOM.platform.x + position);
      }
      else
      {
        DOM.platform.setX(position);
      }
    }
    else
    {
      DOM.platform.setX((vwidth - DOM.platform.width) /2);
    }
  };

  /**
   *  Position the ball
   *
   *  @private
   *
   *  @param  {number} left The positive or negative number to position the ball horizontally
   *                            If the value is positive, it moves the ball that many pixels to the right horizontally
   *                            If the value is negative, it moves the ball that many pixels to the left horizontally
   *                            If the value is not a number, it centers the ball above the platform
   *  @param  {number} top The positive or negative number to position the ball vertically
   *                           If the value is positive, it moves the ball that many pixels to the top vertically
   *                           If the value is negative, it moves the ball that many pixels to the bottom vertically
   *                           If the value is not a number, it centers the ball 20px above the platform
   *  @param  {boolean} increment Defaults to true, increment the positions rather than setting
   *
   *  @return {undefined}
   */
  function positionBall(left, top, increment)
  {
    //TODO
    if(isNaN(left))
    {
      // place ball in platform center
      
      if(debugMode == true && ballCoordinates != null)
      {
        DOM.ball.setX(ballCoordinates.x);
      }
      else
      {
        DOM.ball.setX((DOM.platform.x + DOM.platform.width / 2) - DOM.ball.width / 2);
      }
      //DOM.ball.setX(685);
      //DOM.ball.setX(665);
      prevX = DOM.ball.x;
    }
    else
    {
      // move right
      if(increment)
      {
        DOM.ball.setX(DOM.ball.x + left);
      }
      else
      {
        DOM.ball.setX(left);
      }
    }

    if(isNaN(top))
    {
      if(debugMode == true && ballCoordinates != null)
      {
        DOM.ball.setY(ballCoordinates.y);
      }
      else
      {
        DOM.ball.setY((DOM.platform.y) - 20);
      }
      // place ball 20px above platform
      
      //DOM.ball.setY(450);
      //DOM.ball.setY(314.991);
      prevY = DOM.ball.y;
    }
    else
    {
      if(increment)
      {
        DOM.ball.setY(DOM.ball.y - top);
      }
      else
      {
        DOM.ball.setX(top);
      }
    }
  };

  //########################################
  //Initialization
  //########################################

  //Listeners
  window.addEventListener('DOMContentLoaded', main, false);
  window.addEventListener('keydown', onKeydown, false);
  window.addEventListener('keyup', onKeyup, false);

};
