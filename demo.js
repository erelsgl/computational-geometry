var jsts = require("../computational-geometry");
var factory = new jsts.geom.GeometryFactory();

var srp = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,10, 20,20]);
console.log("An L-shaped simple rectilinear polygon:")
console.dir(srp.getCoordinates());

var covering = jsts.algorithm.minSquareCovering(srp);
console.log("A minimum square-covering:")
console.dir(covering);

var squares = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}, {x:1,y:2}]);
console.log("A collection of "+squares.length+" squares spanned by points:")
console.dir(squares);

var disjointset = jsts.algorithm.maximumDisjointSet(squares);
console.log("A maximum disjoint set of "+disjointset.length+" squares:");
console.dir(disjointset);
