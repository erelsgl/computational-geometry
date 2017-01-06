var jsts = global.jsts =  Object.assign({}, require("jsts"));  // see http://stackoverflow.com/q/38827153/827927
jsts.algorithm = Object.assign({}, global.jsts.algorithm);
jsts.geom = Object.assign({}, global.jsts.geom);

jsts.inherits = function (c, p) {
  c.prototype = Object.create(p.prototype)
  c.prototype.constructor = c
}

require("./AffineTransformations");
require("./AxisParallelRectangle");
require("./SimpleRectilinearPolygon");
require("./Side");
require("./MinSquareCovering");

require("./intersection-cache");
require("./partition-utils");
require("./shapes-touching-points");
require("./numeric-utils");
require("./point-utils");
require("./factory-utils");

require("./MaxDisjointSetSync");
require("./MaxDisjointSetAsync");
require("./RepresentativeDisjointSetSync");

require("./SquareWithMaxPoints");

require("./fair-and-square-division");
require("./half-proportional-division-staircase");
require("./rectilinear-polygon-division");
require("./test-division-algorithm")

jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;
