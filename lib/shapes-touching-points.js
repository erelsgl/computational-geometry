/**
 * Find a set of candidate shapes based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes such that:
 * a. Each shape touches two points.
 * b. No shape contains a point.
 * @note the output can be used as input to jsts.algorithm.maximumDisjointSet
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */

require("./factory-utils");
require("./AxisParallelRectangle");

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

	
/**
 * Find a set of shapes based on a given set of points.
 * 
 * @param shapeName (string) name of string to create. Current options are: axisParallelSquares, rotatedSquares, RAITs.
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes such that:
 * a. Each shape touches two points: one at a corner and one anywhere at the boundary.
 * b. No shape contains a point.
 */
jsts.geom.GeometryFactory.prototype.createShapesTouchingPoints = function(shapeName, points, envelope) {
	var shapes = (
			shapeName==="rotatedSquares"? this.createRotatedSquaresTouchingPoints(points, envelope):
			shapeName==="RAITs"? this.createRAITsTouchingPoints(points, envelope):
			shapeName==="axisParallelSquares"? this.createSquaresTouchingPoints(points, envelope):
			[]);
	return shapes;
}


/**
 * Find a set of axis-parallel squares based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes (Polygon's) such that:
 * a. Each square touches two points: one at a corner and one anywhere at the boundary.
 * b. No square contains a point.
 */
jsts.geom.GeometryFactory.prototype.createSquaresTouchingPoints = function(points, envelope) {
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	var pointObjects = this.createPoints(points);
	var shapes = [];
	for (var i=0; i<points.length; ++i) {
		for (var j=0; j<i; ++j) {
			var p1 = points[i];
			var p2 = points[j];
			var minx = Math.min(p1.x,p2.x);
			var maxx = Math.max(p1.x,p2.x);
			var dist_x = maxx-minx;
			var miny = Math.min(p1.y,p2.y);
			var maxy = Math.max(p1.y,p2.y);
			var dist_y = maxy-miny;

			if (dist_x>dist_y) {
				var ySmall = Math.max(maxy-dist_x, envelope.getMinY());
				var yLarge = Math.min(miny+dist_x, envelope.getMaxY());
				var square1 = this.createAxisParallelRectangle({minx: minx, miny: ySmall, maxx: maxx, maxy: ySmall+dist_x});
				var square2 = this.createAxisParallelRectangle({minx: minx, miny: yLarge-dist_x, maxx: maxx, maxy: yLarge});
			} else {
				var xSmall = Math.max(maxx-dist_y, envelope.getMinX());
				var xLarge = Math.min(minx+dist_y, envelope.getMaxX());
				var square1 = this.createAxisParallelRectangle({minx: xSmall, miny: miny, maxx: xSmall+dist_y, maxy: maxy});
				var square2 = this.createAxisParallelRectangle({minx: xLarge-dist_y, miny: miny, maxx: xLarge, maxy: maxy});
			}

			square1.groupId = square2.groupId = shapes.length;
			if (jsts.algorithm.numWithin(pointObjects,square1)==0)  // don't add a square that contains a point.
				shapes.push(square1);
			if (jsts.algorithm.numWithin(pointObjects,square2)==0)  // don't add a square that contains a point.
				shapes.push(square2);
		}
	}
	return colorByGroupId(shapes);
}

/**
 * Find a set of shapes based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * @param createShapesTouchingTwoPoints a function that creates shapes touching two given points.
 * 
 * @return a set of shapes (of type jsts.geom.Polygon), such that:
 * a. Each shape touches two points, based on the function createShapesTouchingTwoPoints.
 * b. No shape contains a point.
 */
jsts.geom.GeometryFactory.prototype.createPolygonsTouchingPoints = function(coordinates, envelope, createShapesTouchingTwoPoints) {
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	coordinates = this.createCoordinates(coordinates);
	var pointObjects = this.createPoints(coordinates);
	var shapes = [];
	for (var i=0; i<coordinates.length; ++i) {
		var c1 = coordinates[i];
		for (var j=0; j<i; ++j) {
			var c2 = coordinates[j];
			var coords = createShapesTouchingTwoPoints(c1,c2);
			var groupId = shapes.length;
			for (var k=0; k<coords.length; ++k) {
				var curCoords = coords[k];

				// don't add a shape outside the envelope:
				var numPointsOutsideEnvelope = 0;
				for (var c=0; c<curCoords.length; ++c) {
					if (!envelope.intersects(curCoords[c]))
						numPointsOutsideEnvelope++;
				}
				if (numPointsOutsideEnvelope>0) 	continue;

				newShape = this.createPolygon(this.createLinearRing(curCoords));
				newShape.groupId = groupId;
				
				// don't add a shape that contains a point:
				var numPointsWithinNewShape = 0;
				for (var p=0; p<pointObjects.length; ++p) {
					if (p!=i && p!=j && pointObjects[p].within(newShape))
						numPointsWithinNewShape++;
				}
				if (numPointsWithinNewShape>0) continue;
				
				shapes.push(newShape);
			}
		}
	}
	return colorByGroupId(shapes);
}



jsts.geom.GeometryFactory.prototype.createRotatedSquaresTouchingPoints = function(coordinates, envelope) {
	return this.createPolygonsTouchingPoints(coordinates, envelope, 
		function squaresTouchingTwoPoints(c1, c2) {
			var dist_x = c2.x-c1.x;
			var dist_y = c2.y-c1.y;
			var mid_x = (c1.x+c2.x)/2;
			var mid_y = (c1.y+c2.y)/2;
			return [
			        [c1, c2, coord(c2.x-dist_y,c2.y+dist_x), coord(c1.x-dist_y,c1.y+dist_x), c1],
			        [c1, coord(mid_x-dist_y/2,mid_y+dist_x/2), c2, coord(mid_x+dist_y/2,mid_y-dist_x/2), c1],
			        [c1, c2, coord(c2.x+dist_y,c2.y-dist_x), coord(c1.x+dist_y,c1.y-dist_x), c1],
			];
		}
	);
}

// RAIT = Right-Angled-Isosceles-Triangle
jsts.geom.GeometryFactory.prototype.createRAITsTouchingPoints = function(coordinates, envelope) {
	return this.createPolygonsTouchingPoints(coordinates, envelope, 
		function RAITsTouchingTwoPoints(c1, c2) {
			var dist_x = c2.x-c1.x;
			var dist_y = c2.y-c1.y;
			var mid_x = (c1.x+c2.x)/2;
			var mid_y = (c1.y+c2.y)/2;

			return [
					[c1, c2, coord(c2.x-dist_y,c2.y+dist_x), c1],
					[c1, c2, coord(c1.x-dist_y,c1.y+dist_x), c1],
					[c1, coord(mid_x-dist_y/2,mid_y+dist_x/2), c2, c1],
					[c1, c2, coord(mid_x+dist_y/2,mid_y-dist_x/2), c1],
					[c1, c2, coord(c2.x+dist_y,c2.y-dist_x), c1],
					[c1, c2, coord(c1.x+dist_y,c1.y-dist_x), c1],
		        ];
		}
	);
}



/*---------------- UTILS ---------------*/


/**
 * @return the number of shapes from the "shapes" array that are within the interior of "referenceShape".
 */
jsts.algorithm.numWithin = function(shapes, referenceShape) {
	return shapes.reduce(function(prev,cur) {
		return prev + cur.within(referenceShape)
	}, 0);
};


var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}
function colorByGroupId(shapes) {
	shapes.forEach(function(shape) {
		shape.color = color(shape.groupId);
	});
	return shapes;
}