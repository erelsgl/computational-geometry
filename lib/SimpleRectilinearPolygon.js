/**
 * The SimpleRectilinearPolygon class represents a hole-free (simply-connected) rectilinear polygon.
 * Contains special data structures for calculating the minimum square covering.
 * Based on Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
 * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
 * 
 * @author Erel Segal-Halevi
 * @since 2014-07
 */


var jsts = require('jsts');


/**
 * Constructs a simply-connected rectilinear polygon.
 * @param xy an array of alternating x and y values. 
 * The points of the polygon are: (xy[0],xy[1]), (xy[2],xy[1]), (xy[2],xy[3]), ...
 * @note the first side is always horizontal.
 * @constructor
 */
var SimpleRectilinearPolygon = jsts.geom.SimpleRectilinearPolygon = function(xy, factory) {
	if (!Array.isArray(xy))
		throw new Error("xy should be an array but is "+JSON.stringify(xy));
	if (xy.length==0)
		throw new Error("xy is empty: "+JSON.stringify(xy));
	if (!factory)
		throw new Error("factory is empty");

	var points;
	var first = xy[0];
	if ((typeof first === 'object') && ('x' in first)) {
		points = xy;	// xy is already an array of points
		if (points.length%2==0)
			throw new Error("even number of points: "+JSON.stringify(points));
	} else {
		if (xy.length%2==1)
			throw new Error("odd number of xy values: "+JSON.stringify(xy));
		points = [];	// xy is an array of x-y-x-y-x-y-...
		for (var i=0; i<xy.length; i+=2) {
			points.push({x:xy[i], y:xy[i+1]});
			points.push({x:xy[i+2<xy.length? i+2: 0], y:xy[i+1]});
		}
		point = {x:xy[0], y:xy[1]};	points.push(point);	// last point is identical to first point
	}
	
	jsts.geom.LinearRing.apply(this, [factory.createCoordinates(points), factory]);
};

SimpleRectilinearPolygon.prototype = new jsts.geom.LinearRing();
SimpleRectilinearPolygon.constructor = SimpleRectilinearPolygon;


SimpleRectilinearPolygon.prototype.getPolygon = function() {
	if (!this.polygon)
		this.polygon = this.factory.createPolygon(this);
	return this.polygon;
}

/**
 * Creates and returns a full copy of this {@link Polygon} object. (including
 * all coordinates contained by it).
 *
 * @return a clone of this instance.
 */
SimpleRectilinearPolygon.prototype.clone = function() {
	return new SimpleRectilinearPolygon(this.points, this.factory);
};

SimpleRectilinearPolygon.prototype.relate2 = function(g) {
	return this.getPolygon().relate2(g)
}

/**
 * @return {String} String representation of Polygon type.
 */
SimpleRectilinearPolygon.prototype.toString = function() {
	return 'SimpleRectilinearPolygon with '+this.points.length+' corners:\n'+this.points+"\n)";
};
 
SimpleRectilinearPolygon.prototype.CLASS_NAME = 'SimpleRectilinearPolygon';

/**
 * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
 * 
 * Can be called either with 4 parameters (minx,miny, maxx,maxy)
 * or with a single parameter with 4 fields (minx,miny, maxx,maxy).
 */
jsts.geom.GeometryFactory.prototype.createSimpleRectilinearPolygon = function(xy) {
	return new SimpleRectilinearPolygon(xy, this);
};


