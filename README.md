Plotter.js
=======

An HTML5 canvas sketch app that animates redrawing and outputs drawing data as serialized JSON

## Current Features
* Line history with undo and redo (until a new line is made)

* Line weight and color per individual line path

* Animated redraw

* Serialized JSON line data dump for storage. Can be loaded and redrawn (with animation as well)

* Adjustable canvas size

## Planned Features
* play and pause animated redraw

* fast forward or rewind redraw by speeding up the execution per frame or increasing the execution of drawing lines

* the ability to scrub through and select lines. the line color changes to indicate it is selected. basically we redraw until we hit the line, then change it's color temporarily.

* with line selection, we can delete them, move or rotate them (transform all the points in the line in whichever axis we move or rotate), change weight and color

* optional localstorage to save drawings offline?

* built in ui elements
    * color picker
    * lineweight picker
    * control buttons
    * playback slider

### TODO
* Add tests
