/*! plotter - v0.1.0 - 2013-08-02
* http://github.com/trabus/plotter
* Copyright (c) 2013 Jake Bixby; Licensed  */
// Defines a module "plotter".

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.Plotter = factory();
    }
}(this, function () {
    'use strict';

    // pass in context and optional parameters
    var Plotter = function Plotter(width, height, props) {
        this.width = width;
        this.height = height;
        this.props = props || {};
    };
    Plotter.prototype.initialized = false;
    Plotter.prototype.props = null;
    Plotter.prototype.width = 800;
    Plotter.prototype.height = 600;
    Plotter.prototype.enabled = false;
    Plotter.prototype.animate = false;
    Plotter.prototype.title = " ";
    Plotter.prototype.data = {};
    Plotter.prototype.canvas = null;
    Plotter.prototype.ctx = null;
    Plotter.prototype.memcanvas = null;
    Plotter.prototype.memctx = null;
    Plotter.prototype.lines = [];
    Plotter.prototype.currentLine = 0;
    Plotter.prototype.currentPoint = 0;
    Plotter.prototype.lastPoint = {x: 0, y: 0};
    Plotter.prototype.redoQueue = [];
    /**
    *   Init creates canvas and sets listeners. only called once
    */
    Plotter.prototype.init =  function () {
        if (!this.initialized) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d');
            this.memcanvas = document.createElement('canvas');
            this.memcanvas.width = this.canvas.width;
            this.memcanvas.height = this.canvas.height;
            this.memctx = this.memcanvas.getContext('2d');
            this.enabled = false;
            this.lineWidth = this.props.lineWidth || 4;
            this.lineColor = this.props.lineColor || '#000000';
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.currentLine = 0;
            this.currentPoint = 0;
            var self = this;
            this.canvas.onmousedown = function (e) {
                //console.log('mousedown',e);
                var xpos = e.offsetX == null ? e.layerX - self.canvas.offsetLeft: e.offsetX;
                var ypos = e.offsetY == null ? e.layerY - self.canvas.offsetTop: e.offsetY;
                // should we stop animation on mousedown? probably
                self.lines[self.currentLine] = {lineColor: self.lineColor, lineWidth: self.lineWidth, points: [{
                    x: xpos,
                    y: ypos
                }]};
                self.ctx.lineWidth = self.lineWidth;
                self.ctx.strokeStyle = self.lineColor;
                self.enabled = true;
                // stop animating
                self.animate = false;
            };
            this.canvas.onmouseup = function (e) {
                if (self.lines[self.currentLine]) {
                    var p = self.lines[self.currentLine].points;
                    //console.log('up',e, p);//self.lines[self.currentLine]);
                    if (self.enabled) {
                        self.enabled = false;
                        if (p.length > 3) {
                            self.endLine(p);
                        }
                        self.currentLine++;
                    }
                }
            };
            this.canvas.onmousemove = function (e) {
                if (self.enabled) {
                    var xpos = e.offsetX == null ? e.layerX - self.canvas.offsetLeft: e.offsetX;
                    var ypos = e.offsetY == null ? e.layerY - self.canvas.offsetTop: e.offsetY;
                    var p = self.lines[self.currentLine].points;
                    p.push({
                        x: xpos,
                        y: ypos
                    });
                    if (p.length > 3) {
                        self.continueLine(p);
                    } else {
                        self.startLine(p);
                    }
                    //console.log(xpos,ypos);
                    //console.log('mouse',e.clientX,'w',self.canvas.offsetWidth,'x',self.canvas.offsetLeft);
                }
            };
            // if we're out of bounds kill the line
            this.canvas.onmouseout = function (e) {
                //console.log('mouseout',e);
                if (self.enabled) {
                    self.canvas.onmouseup();
                }
            };
            this.initialized = true;
        } else {
            //console.log('already initialized!');
        }
    };
    Plotter.prototype.resizeCanvas = function (width, height) {
        // resize canvas and adjust affected properties
        if (typeof width !== "undefined") {
            this.width = width;
        }
        if (typeof height !== "undefined") {
            this.height = height;
        }
        if (typeof this.canvas !== "undefined") {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.memcanvas.width = this.canvas.width;
            this.memcanvas.height = this.canvas.height;
        }
    };
    // cache canvas for so we can draw the current state later
    Plotter.prototype.cacheCanvas = function () {
        this.memctx.clearRect(0, 0, this.width, this.height);
        this.memctx.drawImage(this.canvas, 0, 0);
    };
    // write cached state to canvas
    Plotter.prototype.writeCacheToCanvas = function () {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.memcanvas, 0, 0);
    };
    // update plotter with new data
    Plotter.prototype.setData = function (data) {
        this.clearData();
        this.data = data;
        this.title = data.title || "Blank";
        this.lines = window.JSON.parse(data.lines);
        this.redoQueue = [];
    };
    // returns formatted date as string
    Plotter.prototype.getDate = function () {
        var d = new Date();
        return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    };
    // returns formatted time as string
    Plotter.prototype.getTime = function () {
        var d = new Date();
        return d.getHours() + ":" + d.getSeconds();

    };
    // clear plotter data
    Plotter.prototype.clearData = function () {
        this.data = {};
        this.lines = [];
        this.animate = false;
        this.enabled = false;
        this.redoQueue = [];
        this.currentLine = 0;
        this.currentPoint = 0;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.memctx.clearRect(0, 0, this.width, this.height);
    };
    // dump plotter data to json
    Plotter.prototype.dumpData = function () {
        this.data.title = this.title;
        this.data.date = this.getDate();
        this.data.time = this.getTime();
        this.data.lines = window.JSON.stringify(this.lines);
        //console.log(window.JSON.stringify(this.data));
        //console.log(window.JSON.parse(this.data.lines));
        return this.data;//window.JSON.stringify(this.data);
    };
    /**
    * Start a new line, taking into account the previous lines in the line
    */
    Plotter.prototype.startLine = function (p) {
        this.writeCacheToCanvas();
        // make sure we've got more than 3 points
        if (p.length > 3) {
            //console.log('drawline');
            this.ctx.lineWidth = this.lineWidth;
            this.strokeStyle = this.lineColor;
            this.ctx.beginPath();
            this.ctx.moveTo(p[0].x, p[0].y);
            var i, c, d;
            // loop through and redraw all lines in this line
            for (i = 1, len = p.length - 2; i < len; i++) {
                c = (p[i].x + p[i + 1].x) / 2;
                d = (p[i].y + p[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(p[i].x, p[i].y, c, d);
            }
            // final point
            this.ctx.quadraticCurveTo(p[i].x, p[i].y, p[i + 1].x, p[i + 1].y);
            this.ctx.stroke();
            this.cacheCanvas();
        }
    };
    /**
    * Continue line, taking into account the previous points in the line
    */
    Plotter.prototype.continueLine = function (p) {
        // clear and reset to memory
        this.writeCacheToCanvas();
        // make sure we've got more than 3 points
        if (p.length > 4) {
            //console.log('drawline');
            var i = p.length - 4;
            this.ctx.beginPath();
            this.ctx.moveTo((p[i - 1].x + p[i].x) / 2, (p[i - 1].y + p[i].y) / 2);
            this.ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
            this.ctx.stroke();
            this.cacheCanvas();
        }
    };
    /**
    * End line
    */
    Plotter.prototype.endLine = function (p) {
        // endline
        this.writeCacheToCanvas();
        //console.log('endline',p);
        var i = p.length - 3;
        this.ctx.beginPath();
        this.ctx.moveTo((p[i - 1].x + p[i].x) / 2, (p[i - 1].y + p[i].y) / 2);
        this.ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
        // final point
        this.ctx.quadraticCurveTo(p[i + 1].x, p[i + 1].y, p[i + 2].x, p[i + 2].y);
        this.ctx.stroke();
        this.cacheCanvas();
    };
    /**
    * Undo the last drawn line
    * and save it to the redo queue
    */
    Plotter.prototype.undo = function () {
        if (this.lines.length >= 1) {
            this.redoQueue.unshift(this.lines.pop());
            this.currentLine--;
            this.redraw();
        }
    };
    /**
    * Redo the first undone line
    * from the redo queue
    */
    Plotter.prototype.redo = function () {
        if (this.redoQueue.length >= 1) {
            this.lines.push(this.redoQueue.shift());
            this.currentLine++;
            this.redraw();
        }
    };
    /**
    * Redraws all lines at once
    */
    Plotter.prototype.redraw = function () {
        //console.log('redraw');
        var i, j, c, d, l, p, len, plen;
        // clear canvas
        this.memctx.clearRect(0, 0, this.width, this.height);
        // draw each line
        for (i = 0, len = this.lines.length; i < len; i++) {
            l = this.lines[i];
            p = l.points;
            //console.log('line ',i,l);
            // only redraw if we've got more than 3 points
            if (p.length > 3) {
                //console.log('drawing line',i);
                // clear update canvas
                this.writeCacheToCanvas();
                this.ctx.lineWidth = l.lineWidth;
                this.ctx.strokeStyle = l.lineColor;
                this.ctx.beginPath();
                this.ctx.moveTo(p[0].x, p[0].y);
                // loop through and redraw all lines in this line
                for (j = 1, plen = p.length - 2; j < plen; j++) {
                    c = (p[j].x + p[j + 1].x) / 2;
                    d = (p[j].y + p[j + 1].y) / 2;
                    this.ctx.quadraticCurveTo(p[j].x, p[j].y, c, d);
                }
                // final point
                this.ctx.quadraticCurveTo(p[j].x, p[j].y, p[j + 1].x, p[j + 1].y);
                this.ctx.stroke();
                // cache canvas
                this.cacheCanvas();
            } else {
                //console.log('too short, not drawing');
            }
        }
    };
    /**
    * Animates redrawing using requestAnimationFrame
    * currently makes use of local functions for redrawing each line
    */
    Plotter.prototype.animateredraw = function () {
        // clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.memctx.clearRect(0, 0, this.width, this.height);
        // reset the line counter
        this.currentLine = 0;
        // reset the point counter
        this.currentPoint = 0;
        this.animate = true;
        var self = this;
        // sets up a line for animated redraw
        var setupline = function setupline() {
            var l = self.lines[self.currentLine].points;
            if (l.length > 3) {
                //console.log('drawing line ',self.currentLine);
                self.ctx.lineWidth = self.lines[self.currentLine].lineWidth;
                self.ctx.strokeStyle = self.lines[self.currentLine].lineColor;
                self.ctx.beginPath();
                self.ctx.moveTo(l[0].x, l[0].y);
                requestAnimationFrame(redrawline);
            } else {
                //console.log('too short',self.currentLine);
                self.currentLine++;
                if (self.currentLine < self.lines.length) {
                    setupline();
                } else {
                    //console.log('done');
                }
            }
        };
        // redraw line animation function
        var redrawline = function redrawline() {
            if (self.animate) {
                //console.log('redrawline',self,self.currentLine,self.currentPoint);
                var l = self.lines[self.currentLine].points;
                var p = self.currentPoint;
                self.writeCacheToCanvas();
                // loop here later to draw multiple line segments in one pass for increased speed
                if (p < l.length - 2) {
                    self.ctx.quadraticCurveTo(l[p].x, l[p].y, (l[p].x + l[p + 1].x) / 2, (l[p].y + l[p + 1].y) / 2);
                    self.ctx.stroke();
                    self.currentPoint++;
                } else {
                    self.ctx.quadraticCurveTo(l[p].x, l[p].y, l[p + 1].x, l[p + 1].y);
                    self.ctx.stroke();
                    self.currentPoint = 0;
                    self.currentLine++;
                    self.cacheCanvas();
                }

                if (self.currentLine < self.lines.length) {
                    if (self.currentPoint === 0) {
                        setupline();
                    } else {
                        requestAnimationFrame(redrawline);
                    }
                } else {
                    //console.log('done');
                }
            }
        };
        if (this.lines.length >= 1) {
            setupline();
        }
    };
    return Plotter;
}));
