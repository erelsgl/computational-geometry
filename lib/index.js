var jsts = require("jsts");
require("./AxisParallelRectangle");
require("./SimpleRectilinearPolygon");
require("./Side");
require("./MinSquareCovering");
require("./MaxDisjointSetSync");
require("./MaxDisjointSetAsync");
jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;
