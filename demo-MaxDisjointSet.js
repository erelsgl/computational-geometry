var jsts = require("./lib");
var maximumDisjointSet = jsts.algorithm.maximumDisjointSet; // shorthand

var factory = new jsts.geom.GeometryFactory();

var r0101 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:0,maxy:1});
var r0112 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:1,maxy:2});
var r0123 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:2,maxy:3});
var r0134 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:3,maxy:4});
var r1201 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:0,maxy:1});
var r2301 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:0,maxy:1});
var r3401 = factory.createAxisParallelRectangle({minx:3,maxx:4, miny:0,maxy:1});

var r1212 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:1,maxy:2});
var r2323 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:2,maxy:3});
var r3434 = factory.createAxisParallelRectangle({minx:3,maxx:4, miny:3,maxy:4});

var r0202 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:0,maxy:2});
var r0213 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:1,maxy:3});
var r0224 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:2,maxy:4});
var r1302 = factory.createAxisParallelRectangle({minx:1,maxx:3, miny:0,maxy:2});
var r2402 = factory.createAxisParallelRectangle({minx:2,maxx:4, miny:0,maxy:2});

var r1313 = factory.createAxisParallelRectangle({minx:1,maxx:3, miny:1,maxy:3});
var r2424 = factory.createAxisParallelRectangle({minx:2,maxx:4, miny:2,maxy:4});
var r0303 = factory.createAxisParallelRectangle({minx:0,maxx:3, miny:0,maxy:3});
var r1414 = factory.createAxisParallelRectangle({minx:1,maxx:4, miny:1,maxy:4});
var r0404 = factory.createAxisParallelRectangle({minx:0,maxx:4, miny:0,maxy:4});

console.dir(maximumDisjointSet([r0101,r2323]))
