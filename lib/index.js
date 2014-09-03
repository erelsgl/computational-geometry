var jsts = require("jsts");
require("./SimpleRectilinearPolygon");
require("./Side");
require("./PolygonSquareCovering");
jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;
