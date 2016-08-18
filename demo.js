var jsts = require("../computational-geometry");
var factory = new jsts.geom.GeometryFactory();

var app = new jsts.geom.AxisParallelRectangle(0,0, 10,5, factory);
console.log("An axis-parallel rectangle with area "+app.getArea())

var srp0 = factory.createSimpleRectilinearPolygon([0,0, 10,10]);  // square
var point0 = factory.createPointFromXY(3,3);
console.dir(point0)
console.log((srp0.contains(point0)? "  contains ": " does not contain ")+point0)
process.exit(1)

var srp = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,5, 20,20], factory);
console.log("An L-shaped simple rectilinear polygon with coordinates:")
console.dir(srp.getCoordinates());
console.dir(srp.isClosed());

console.dir(srp.contains(point0))

var covering = jsts.algorithm.minSquareCovering(srp);
console.log("A minimum square-covering:")
console.dir(covering);

var squares = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}, {x:1,y:2}]);
console.log("A collection of "+squares.length+" squares spanned by points:")
console.dir(squares);

var disjointset = jsts.algorithm.maximumDisjointSet(squares);
console.log("A maximum disjoint set of "+disjointset.length+" squares:");
console.dir(disjointset);
process.exit(1);
