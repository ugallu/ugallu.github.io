var app;
var output;
var lastTime= new Date();


var App = function(canvas, output)
{
    this.canvas = canvas;
    this.canvas.height = 600;
    this.canvas.width = 600; 
    this.gl = canvas.getContext("experimental-webgl");
    if (this.gl == null) {
        output.textContent = ">>> No WebGL support <<<";
        return;
    }
    //OpenGL rajzolás viewportjának beállítása -> canvas méretére, arra rajzolunk.
    this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
    this.quad = new Quad(this.gl);
    this.camera = new Camera();

}

//prototypeba tesszük bele a függvényt.
App.prototype.update = function()
{
    time = new Date();
    dt = (time - lastTime) / 1000.0;
    lastTime = time;
    this.camera.update(dt);

    this.gl.clearColor(0.6, 0.0, 0.3, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.quad.draw(this.gl,this.camera);
    window.requestAnimationFrame(function (){ app.update();});
}

App.prototype.clicked = function(event) {
    console.log(document.pointerLockElement,document.mozPointerLockElement,document.webkitPointerLockElement)
    if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
    {
        this.canvas.requestPointerLock();
        this.ownMouse = true;
    }
    else
        this.canvas.mozRequestPointerLock();
}

App.prototype.pointerLockChange = function(event) {
    if (document.pointerLockElement != null ||
        document.mozPointerLockElement != null ||
        document.webkitPointerLockElement != null) {
        this.ownMouse = true;
    }
    else
        this.ownMouse = false;
  }

App.prototype.keyDown = function(event) {
    if (!this.ownMouse) return;
    this.camera.keydown(event.keyCode);
  }
App.prototype.keyUp = function(event) {
    if (!this.ownMouse)  return;
    this.camera.keyup(event.keyCode);
  }
App.prototype.mouseMove = function(event) {
    if (!this.ownMouse) return;
    this.camera.mouseDelta.add( new Vector2(event.movementX, event.movementY));
    console.log(event.movementX,event.movementY);
    event.preventDefault();
}



function start()
{
    var canvas = document.getElementById("container");
    output = document.getElementById("output");
    app = new App(canvas, output);
    document.addEventListener('mozpointerlockchange', function(event){  app.pointerLockChange(event); }, false);
    canvas.onclick = function(event) { app.clicked(event); } ;
    document.onkeydown = function(event){  app.keyDown(event); };
    document.onkeyup = function(event){  app.keyUp(event); };
    document.onmousemove = function(event){  app.mouseMove(event)};
    window.requestAnimationFrame(function(){app.update();});

}
