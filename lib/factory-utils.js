/**
 * Adds to jsts.geom.GeometryFactory some simple utility functions related to points.
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

/**
 * Constructs an array of <code>Coordinate</code>s from a given array of {x,y} points.
 */
jsts.geom.GeometryFactory.prototype.createCoordinates = function(points) {
	return points.map(function(point) {
		return coord(point.x, point.y);
	}, this);
};

/**
 * Constructs an array of <code>Point</code>s from a given array of {x,y} points.
 */
jsts.geom.GeometryFactory.prototype.createPoints = function(points) {
	return points.map(function(point) {
		return (point instanceof jsts.geom.Coordinate? 
			this.createPoint(point):
			this.createPoint(coord(point.x, point.y))
			);
	}, this);
};
