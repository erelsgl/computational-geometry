/**
 * Adds to jsts.geom.GeometryFactory some simple utility functions related to points.
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

/**
 * Constructs an array of <code>Coordinate</code>s from a given array of {x,y} values.
 */
jsts.geom.GeometryFactory.prototype.createCoordinates = function(xy) {
	return xy.map(function(point) {
		return coord(point.x, point.y);
	}, this);
};


var oldCreatePoint = jsts.geom.GeometryFactory.prototype.createPoint;

/**
 * Constructs a point from x and y values.
 */
jsts.geom.GeometryFactory.prototype.createPoint = function(x,y) {
	if (!isNaN(x) && !isNaN(y))
		return oldCreatePoint.call(this, coord(x,y));
	else if (!isNaN(x.x) && !isNaN(x.y))
		return oldCreatePoint.call(this, coord(x.x, x.y));
	else if (point instanceof jsts.geom.Coordinate)
		return oldCreatePoint.call(this, x);
	else
		throw new Error("Illegal arguments to createPoint: "+JSON.stringify(x)+", "+JSON.stringify(y))
};


/**
 * Constructs an array of <code>Point</code>s from a given array of {x,y} points.
 */
jsts.geom.GeometryFactory.prototype.createPoints = function(xy) {
	return xy.map(function(point) {
		return 	this.createPoint(point);
	}, this);
};
