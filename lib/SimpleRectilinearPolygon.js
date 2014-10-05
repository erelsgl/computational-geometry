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

var round4 = function(x) { return Math.round(x*10000)/10000; }


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
		points = xy.map(function(point) {return {x:round4(point.x),y:round4(point.y)}});	// xy is already an array of points
		if (points.length<5)
			throw new Error("only "+points.length+" points: "+JSON.stringify(points));
		if (points.length%2==0)
			throw new Error("even number of points: "+JSON.stringify(points));
		
		if (SimpleRectilinearPolygon.FORCE_FIRST_SEGMENT_HORIZONTAL && points[0].x==points[1].x) {
			points.shift();
			points.push(points[0]);
		}

	} else {
		xy = xy.map(round4);
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
SimpleRectilinearPolygon.FORCE_FIRST_SEGMENT_HORIZONTAL = true;


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
	return 'SimpleRectilinearPolygon with '+(this.points.length-1)+' corners: '+this.points;
};

var cornerToKey = function(corner) {
	return corner.x+","+corner.y;
}


SimpleRectilinearPolygon.prototype.hasCorner = function(corner) {
	if (!this.hashOfCorners) {
		this.hashOfCorners = {};
		this.points.forEach(function(point) {
			this.hashOfCorners[cornerToKey(point)]=true;
		}, this);
	}
	
	return this.hashOfCorners[cornerToKey(corner)];
}

SimpleRectilinearPolygon.prototype.pushIfNotMyCorner = function(newPoints, corner) {
	if (!this.hasCorner(corner))
		newPoints.push(corner);
}


function isCornerOf(point, rectangle) {
	return (
		(point.x==rectangle.minx || point.x==rectangle.maxx) &&
		(point.y==rectangle.miny || point.y==rectangle.maxy) );
}


/**
 * @author http://engblog.nextdoor.com/post/86430627239/fast-polygon-self-intersection-detection-in-javascript
 */
SimpleRectilinearPolygon.prototype.selfIntersectionPoints = function() {
	var jstsPolygon = this.getPolygon();
	var res = [];

	// if the geometry is aleady a simple linear ring, do not
	// try to find self intersection points.
	var validator = new jsts.operation.IsSimpleOp(jstsPolygon);
	if (validator.isSimpleLinearGeometry(jstsPolygon)) {
		return [];
	}
		 
	var graph = new jsts.geomgraph.GeometryGraph(0, jstsPolygon);
	var cat = new jsts.operation.valid.ConsistentAreaTester(graph);
	var r = cat.isNodeConsistentArea();
	if (!r) {
		var pt = cat.getInvalidPoint();
		res.push([pt.x, pt.y]);
	}
	return res;
}


/**
 * Remove a certain rectangular land-plot from this polygon.
 * 
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} contained in the polygon and adjacent to the border.
 * @return this SimpleRectilinearPolygon with the landplot removed.
 * (this polygon is not changed).
 */
SimpleRectilinearPolygon.prototype.removeRectangle = function(landplot) {
		if (landplot.minx==landplot.maxx || landplot.miny==landplot.maxy) { // empty landplot
			console.log("\nWARNING: empty landplot: "+JSON.stringify(landplot))
			return this;
		}
		var newPoints = [];
		var landplotIsAdjacentToBorder = false;  // If this flag remains false, this is an error since the result is not simply-connected.
		
		var thisPolygon = this;
		
		var setLandplotAdjacentToBorder = function()  {
			if (landplotIsAdjacentToBorder) { 
				throw new Error("landplot meets the border more than once - the result will be disconnected!\n\tthis.points="+JSON.stringify(thisPolygon.points)+"\n\tremoveRectangle("+JSON.stringify(landplot)+"):");
			}
			landplotIsAdjacentToBorder = true;
		}
		
		for (var i=1; i<this.points.length; ++i) {
			var corner0 = this.points[i-1];
			var corner1 = this.points[i];
			var corner0isCornerOfLandplot = isCornerOf(corner0, landplot);
						
			if (corner0isCornerOfLandplot) {
				if (newPoints.length>0) {
					// handle the special case in which landplot covers two adjacent corners:
					lastCornerAdded = newPoints[newPoints.length-1];
					if (corner0.x==lastCornerAdded.x&&corner0.y==lastCornerAdded.y)
						newPoints.pop();
				}
				continue;
			} else {
				newPoints.push(corner0);
			}
			
			if (corner0.x==corner1.x) {  // vertical wall
				var x = corner0.x;       // x value of wall
				if (landplot.minx==x) {  // landplot is adjacent to western vertical wall
					//console.log("\tlandplot is adjacent to western vertical wall");
					if (corner0.y>corner1.y) {   // wall goes from north to south
						if (corner0.y>=landplot.miny && landplot.miny>=corner1.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						} else if (corner1.y==landplot.maxy) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						}
					} else if (corner0.y<corner1.y) { // wall goes from south to north
						if (corner1.y>=landplot.maxy && landplot.maxy>=corner0.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						} else if (corner1.y==landplot.miny) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} else if (landplot.maxx==x) {  // landplot is adjacent to eastern vertical wall
					//console.log("\tlandplot is adjacent to eastern vertical wall");
					if (corner0.y>corner1.y) {   // wall goes from north to south
						if (corner0.y>=landplot.miny && landplot.miny>=corner1.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						} else if (corner1.y==landplot.maxy) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						}
					} else if (corner0.y<corner1.y) { // wall goes from south to north
						if (corner1.y>=landplot.maxy && landplot.maxy>=corner0.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						} else if (corner1.y==landplot.miny) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} // else, landplot is not adjacent to current wall.
			} else if (corner0.y==corner1.y) {  // horizontal wall
				var y = corner0.y;       //  value of wall
				if (landplot.miny==y) {  
					//console.log("\tlandplot is adjacent to southern horizontal wall")
					if (corner0.x>corner1.x) {   // wall goes from east to west
						if (corner0.x>=landplot.minx && landplot.minx>=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						} else if (corner1.x==landplot.maxx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						}
					} else if (corner0.x<corner1.x) { // wall goes from west to east
						if (corner0.x<=landplot.maxx && landplot.maxx<=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						} else if (corner1.x==landplot.minx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} else if (landplot.maxy==y) {  // landplot is adjacent to northern horizontal wall
					//console.log("\tlandplot is adjacent to northern horizontal wall")
					if (corner0.x>corner1.x) {   // wall goes from east to west
						if (corner0.x>=landplot.minx && landplot.minx>=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						} else if (corner1.x==landplot.maxx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						}
					} else if (corner0.x<corner1.x) { // wall goes from west to east
						if (corner0.x<=landplot.maxx && landplot.maxx<=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						} else if (corner1.x==landplot.minx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} // else, landplot is not adjacent to current wall
			} else {   // corner0 and corner1 are different in both coordinates - not an axis-parallel polygon
				throw new Error("Illegal border - not an axis-parallel polygon: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
			}
		}
		
		if (!landplotIsAdjacentToBorder) {
			throw new Error("Landplot is not adjacent to border - the result is not a simply-connected polygon")
		}
		
		// remove redundant corners of the landplot, that overlap corners of the polygon:
		lastCornerAdded = newPoints[newPoints.length-1];
		if (corner1.x==lastCornerAdded.x&&corner1.y==lastCornerAdded.y)
			newPoints.pop();
		if (this.points[1].x==lastCornerAdded.x && this.points[1].y==lastCornerAdded.y)
			newPoints.pop();

		// keep the border cyclic:
		newPoints.push(newPoints[0]);
		
		var newPolygon = this.factory.createSimpleRectilinearPolygon(newPoints);
		
		// check validity of new polygon:
		var newPolygonIntersectionPoints = newPolygon.selfIntersectionPoints();
		if (newPolygonIntersectionPoints.length>0) {
			console.dir("this.points="+JSON.stringify(this.points));
			console.dir("removeRectangle("+JSON.stringify(landplot)+") returns:");
			console.dir(JSON.stringify(newPolygon.points));
			throw new Error("New polygon has self-intersections at: "+JSON.stringify(newPolygonIntersectionPoints));
		}
		
		return newPolygon;
}


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


