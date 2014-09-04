var jsts = require("../computational-geometry");

// Create an L-shaped simple rectilinear polygon:
var srp = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,10, 20,20]);
console.log("The polygon:")
console.dir(srp.getCoordinates());

// Find the minimum square covering:
var covering = jsts.algorithm.minSquareCovering(srp);
console.log("A minimum square covering:")
console.dir(covering);
