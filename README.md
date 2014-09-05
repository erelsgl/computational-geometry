computational-geometry.js
=========================

Implementations of some computational geometry algorithms in Node.js.

The algorithms are implemented as extensions to the [JSTS](https://github.com/bjornharrtell/jsts) library.


Installation
------------

    git clone https://github.com/erelsgl/computational-geometry.git


Examples
--------

    var jsts = require("../computational-geometry");

    // Create an L-shaped simple rectilinear polygon:
    var srp = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,10, 20,20]);
    console.dir(srp.getCoordinates());

    // Find the minimum square covering:
    var covering = jsts.algorithm.minSquareCovering(srp);
    console.dir(covering);

    // Create a set of squares spanned by points:
    var squares = jsts.algorithm....
    
    
    // Find a  maximum disjoint set of squares:
    var disjointset = jsts.algorithm...
    
    
   