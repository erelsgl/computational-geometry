/**
 * Contains special data structures for calculating the minimum square covering of a SimpleRectilinearPolygon.
 * Based on Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
 * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
 * 
 * 
 * USAGE EXAMPLE:
 * 
 * var jsts = require("jsts");
 * require("lib/PolygonSquareCovering");
 * ...
 * var polygonXY = [0,0, 15,5, 20,20];
 * console.dir(jsts.minimalSquareCoveringOf(polygonXY));
 * 
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */



var jsts = require("jsts");
require("./SimpleRectilinearPolygon");
require("./Side");

var LinkedList = require('jsclass/src/linked_list').LinkedList;
var ListNode = LinkedList.Node;
var DoublyLinkedList = LinkedList.Doubly.Circular;
require('./DoublyLinkedList');


var error = function(msg) {throw new Error(msg);}

Math.compare = function(a,b) { return (a<b)-(a>b); }


/*-************ SEGMENT *******************-*/

/**
 * Construct a segment between two corners of a rectilinear polygon
 */
var Segment = function(c0, c1) {
	this.c0 = c0;
	this.c1 = c1;
	this.direction = (
		c0.y<c1.y? jsts.Side.North:
		c0.y>c1.y? jsts.Side.South:
		c0.x<c1.x? jsts.Side.East:
		c0.x>c1.x? jsts.Side.West:
		error("cannot detect the direction: "+JSON.stringify(c0)+", "+JSON.stringify(c1))
	);
	
	this.coveringSquares = new DoublyLinkedList();	 // All squares s selected for the cover and having the following properties:
		// a. s intersects the segment. (Note: every intersection of a square with the segment is on an original concave point???)
		// b. The two edges of s which are orthogonal to the segment are exposed.
		// c. There is a point in the polygon which is covered only by s (and not by any other square selected so far).
		// The squares for each segment are kept sorted by their appearance order.
}

Segment.prototype.initializeProjectionList = function() {
	this.projectionList = new DoublyLinkedList();	 // All vertices visible to this segment; filled during initialization of polygon
}

// this is a function because the corners change!
Segment.prototype.length = function() {
	return Math.abs(this.c0.x-this.c1.x)+Math.abs(this.c0.y-this.c1.y);
}

Segment.prototype.addVisibleCorner = function(corner)	 {	
	var node = new ListNode(corner);   // we need a node because the same corner participates in two different projection lists - positive and negative
	this.projectionList.push(node);
	return node;
}

Segment.prototype.isVertical = function()	 {	return jsts.isVertical(this.direction);	}
Segment.prototype.isHorizontal = function() {	return jsts.isHorizontal(this.direction);	}

Segment.prototype.xSign = function() {	return Math.compare(this.c0.x,this.c1.x);	}
Segment.prototype.ySign = function() {	return Math.compare(this.c0.y,this.c1.y);	}

Segment.prototype.setX = function(x) {
	if (!this.isVertical()) throw new Error("Set X is valid only for a vertical knob");
	this.c0.x = this.c1.x = x;
}

Segment.prototype.setY = function(y) {
	if (!this.isHorizontal()) throw new Error("Set Y is valid only for a horizontal knob");
	this.c0.y = this.c1.y = y;
}

Segment.prototype.getX = function() { return  this.isVertical()? this.c0.x: "["+this.c0.x+","+this.c1.x+"]"; }
Segment.prototype.getY = function() { return  this.isHorizontal()? this.c0.y: "["+this.c0.y+","+this.c1.y+"]"; }

Segment.prototype.yContains = function(point) {
	return 	(this.c0.y >= point.y && point.y >= this.c1.y) ||
			(this.c0.y <= point.y && point.y <= this.c1.y);
}

Segment.prototype.xContains = function(point) {
	return 	(this.c0.x >= point.x && point.x >= this.c1.x) ||
			(this.c0.x <= point.x && point.x <= this.c1.x);
}

Segment.prototype.contains = function(point) {
	if (this.isVertical()) 
		return this.c0.x == point.x && this.yContains(point);
	else 
		return this.c0.y == point.y && this.xContains(point);
}

Segment.prototype.isVerticalEastOf = function(point) {
	return (this.c0.x==this.c1.x) && (this.c0.x > point.x) && this.yContains(point);	}
Segment.prototype.isVerticalWestOf = function(point) {
	return (this.c0.x==this.c1.x) && (this.c0.x < point.x) && this.yContains(point);	}
Segment.prototype.isHorizontalNorthOf = function(point) {
	return (this.c0.y==this.c1.y) && (this.c0.y > point.y) && this.xContains(point);	}
Segment.prototype.isHorizontalSouthOf = function(point) {
	return (this.c0.y==this.c1.y) && (this.c0.y < point.y) && this.xContains(point);	}

Segment.prototype.isInDirectionOf = function(direction,point) {
	switch (direction) {
	case jsts.Side.East: return this.isVerticalEastOf(point);
	case jsts.Side.West: return this.isVerticalWestOf(point);
	case jsts.Side.South: return this.isHorizontalSouthOf(point);
	case jsts.Side.North: return this.isHorizontalNorthOf(point);
	}
}

Segment.prototype.isInDirectionOfSegment = function(direction,segment) {
	switch (direction) {
	case jsts.Side.East: return this.c0.x>segment.c0.x;  // vertical
	case jsts.Side.West: return this.c0.x<segment.c0.x;  // vertical
	case jsts.Side.North: return this.c0.y>segment.c0.y;  // horizontal
	case jsts.Side.South: return this.c0.y<segment.c0.y;  // horizontal
	}
}

Segment.prototype.distanceToCorner = function(corner) {
	return (this.isVertical()? 	
			Math.abs(corner.x-this.c0.x):
			Math.abs(corner.y-this.c0.y));
}

Segment.prototype.distanceToNearestConcaveCorner = function() {
	var nearestSoFar = Infinity;
	this.projectionList.forEach(function(node) {
		var corner = node.data;
		var distance = this.distanceToCorner(corner);
		if (distance<nearestSoFar)
			nearestSoFar = distance;
	}, this);
	return nearestSoFar;
}

Segment.prototype.isKnob = function() {
	return this.c0.isConvex && this.c1.isConvex;
}

Segment.prototype.distanceToNearestBorder = function() { // relevant mainly for knobs
	return Math.min(
		this.distanceToNearestConcaveCorner(),
		Math.min(
			this.c0.distanceToNearestSegment(jsts.inverseSide(this.prev.direction)),
			this.c1.distanceToNearestSegment(this.next.direction)
		)
	);
}

Segment.prototype.hasContinuator = function() {
	if (!this.isKnob())
		return false;
	if (this.distanceToNearestBorder() < this.length())
		return false;
	return true;
}

Segment.prototype.signOfPolygonInterior = function() {
	if (this.isVertical()) 
		return this.next.direction==jsts.Side.East? 1: -1;
	else
		return this.next.direction==jsts.Side.North? 1: -1;
}

Segment.prototype.continuator = function() {
	var x0, x1, y0, y1;
	if (this.isVertical()) {
		x0 = this.c0.x;
		x1 = x0 + this.signOfPolygonInterior() * this.length();
		y0 = this.c0.y;
		y1 = this.c1.y;
	} else {
		x0 = this.c0.x;
		x1 = this.c1.x;
		y0 = this.c0.y;
		y1 = y0 + this.signOfPolygonInterior() * this.length();
	}
	return {
		minx: Math.min(x0,x1),
		maxx: Math.max(x0,x1),
		miny: Math.min(y0,y1),
		maxy: Math.max(y0,y1),
	}
}

Segment.prototype.isAxisParallel = function() {
	return (this.c0.x==this.c1.x || this.c0.y==this.c1.y);
}

Segment.prototype.toString = function() {
	if (this.prev==null) 
		console.warn("this.prev is null!");
	if (this.next==null) 
		console.warn("this.next is null!");
	return "["+
		this.c0+" - "+this.c1+
		" , dir="+this.direction+
		(this.prev && this.next? ", tocorner="+this.distanceToNearestConcaveCorner()+", toborder="+this.distanceToNearestBorder(): "")+
		(this.knobCount? ", knobCount="+this.knobCount: "") +
		"]";
}





/*-************ CORNER *******************-*/

/**
 * Construct a corner structure for a given vertex
 */
var Corner = function(point) {
	this.x = point.x;
	this.y = point.y;
}

/**
 * Set the two segments that meet at the corner, and calculate the turn direction
 */
Corner.prototype.setSegments = function(s0,s1) {
	this.s0 = s0;  // incoming segment
	this.s1 = s1;  // outgoing segment
}

Corner.prototype.calculateConvexity = function(polygonTurnDirection) {
	this.turn = jsts.turn(this.s0.direction, this.s1.direction); // left=-1, right=1
	this.isConvex = (this.turn == polygonTurnDirection);
}

Corner.prototype.distanceToSegment = function(segment) {
	return segment.distanceToCorner(this);
}

/**
 * Set the two segments that see this (concave) corner, and remember our location in their projection lists.
 */
Corner.prototype.setVisibilityInfo = function(positiveVisibilitySegment,negativeVisibilitySegment) {
	if (this.isConvex)
		throw new Error("setVisibilityInfo should be called only for concave corners")
	this.positiveVisibilitySegment = positiveVisibilitySegment; // in the direction of the incoming segment, s0
	this.positiveVisibilityNode = positiveVisibilitySegment.addVisibleCorner(this);
	this.negativeVisibilitySegment = negativeVisibilitySegment; // in the opposite direction to the outgoing segment, s1
	this.negativeVisibilityNode = negativeVisibilitySegment.addVisibleCorner(this);
}

// remove this corner from ALL lists it participates in:
Corner.prototype.remove = function() {
	this.list.remove(this);
	if (this.positiveVisibilityNode)
		this.positiveVisibilityNode.list.remove(this.positiveVisibilityNode);
	if (this.negativeVisibilityNode)
		this.negativeVisibilityNode.list.remove(this.negativeVisibilityNode);
}

Corner.prototype.distanceToNearestSegment = function(direction) {
	if (this.isConvex) {
		if (direction==jsts.inverseSide(this.s0.direction)) {
			var segmentLength = this.s0.length();
			var nextCorner = this.s0.c0;
		} else if (direction==this.s1.direction) {
			var segmentLength = this.s1.length();
			var nextCorner = this.s1.c1;
		} else {
			return 0;
		}
		return segmentLength + 
			(nextCorner.isConvex? 0: nextCorner.distanceToNearestSegment(direction));
	} else {  // concave corner - use the visibility information:
		if (direction==this.s0.direction) {
			if (!this.positiveVisibilitySegment) throw new Error("missing positive visibility information");
			return this.distanceToSegment(this.positiveVisibilitySegment);
		}
		if (direction==jsts.inverseSide(this.s1.direction)) {
			if (!this.negativeVisibilitySegment) throw new Error("missing negative visibility information");
			return this.distanceToSegment(this.negativeVisibilitySegment);
		}
		return 0;
	}
}

Corner.prototype.toString = function() {
	return "("+this.x+","+this.y+"; "+this.turn+","+(this.isConvex?"convex":"concave")+")";
}



/*-************ STRUCTURES *******************-*/

var PolygonSquareCovering = jsts.PolygonSquareCovering = function(thePolygon) {
	/* Clone the sequence of corners in order to add more information: */
	var points = thePolygon.points;
	var corners = new DoublyLinkedList();
	for (var i=0; i<points.length-1; ++i) 
		corners.push(new Corner(points[i]));
	this.corners = corners;
	
	/* Calculate the sequence of segments and the turn directions of the corners: */
	var segments = new DoublyLinkedList();
	var previousSegment = null;
	var totalTurn = 0;
	corners.forEach(function(corner) {
		var segment = new Segment(corner, corner.next);
		segments.push(segment);
		if (previousSegment) {
			corner.setSegments(previousSegment,segment);
			totalTurn += corner.turn;
		}
		previousSegment = segment;
	}, this);
	this.segments = segments;
	corners.first.setSegments(segments.last, segments.first);
	totalTurn += corners.first.turn;
	this.turnDirection = jsts.turnDirection(totalTurn);
	this.calculateConvexityAndVisibility();
}

PolygonSquareCovering.prototype.calculateConvexityAndVisibility = function() {
	/* Decide whether the corners are convex or concave, and calculate visibility information: */
	console.log("calculateConvexityAndVisibility: "+this.corners.length)
	this.segments.forEach(function(segment) {
		segment.initializeProjectionList();
	});
	this.corners.forEach(function(corner) {
		corner.calculateConvexity(this.turnDirection);
		//console.log("turn="+corner.turn)
		if (!corner.isConvex) {   // concave corner - calculate visibility information:
			var positiveVisibilitySegment = this.findClosestSegment(corner.s0.direction, corner);
			var negativeVisibilitySegment = this.findClosestSegment(jsts.inverseSide(corner.s1.direction), corner);
			corner.setVisibilityInfo(positiveVisibilitySegment,negativeVisibilitySegment);
		}
	}, this);
	this.checkValid();
}


PolygonSquareCovering.prototype.isEmpty = function() {
	return this.corners.isEmpty();
}

PolygonSquareCovering.prototype.findClosestSegment = function(direction, point) {
	var segments = this.segments;
	var closestSoFar = null;
	segments.forEach(function(segment) {
		if (segment.isInDirectionOf(direction,point)) {
			if (!closestSoFar || closestSoFar.isInDirectionOfSegment(direction,segment))
				closestSoFar = segment;
		}
	});
	return closestSoFar;
}

/**
 * @param point {x,y}
 * @return true if the point is in the interior of the polygon.
 * Uses the "even-odd rule" algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
 */
PolygonSquareCovering.prototype.contains = function(point) {
	var intersections = 0;
	var onBoundary = false;
	this.segments.forEach(function(segment) {
		//console.dir(segment.c0+" - "+segment.c1);
		if (segment.contains(point))
			onBoundary = true; // point is on the boundary.
		else if (segment.isVerticalEastOf(point))
			intersections++;
	});
	if (onBoundary) return false;
	else return (intersections%2==1); // odd = internal; even = external
}


/**
 * @return the first knob in a continuator.
 */
PolygonSquareCovering.prototype.findContinuatorSegment = function() {
	var continuatorSegment = null;
	this.segments.forEach(function(segment) {
		if (!continuatorSegment && segment.hasContinuator()) {
			continuatorSegment = segment;
			// should break here, but it is not possible in JS...
		}
	});
	if (!continuatorSegment) {
		console.log(this.segments.toString());
		throw new Error("No continuator found - this is impossible!");
	}
	var knobCount = 1;
	var continuatorLength = continuatorSegment.length();
	while (continuatorSegment.prev.length()==continuatorLength && continuatorSegment.prev.isKnob() && knobCount<4) {
		continuatorSegment = continuatorSegment.prev;
		knobCount++;
	}
	var firstKnob = continuatorSegment;
	//console.log(firstKnob.toString())
	if (knobCount<3) {
		knobCount = 1;
		while (continuatorSegment.next.length() == continuatorLength && continuatorSegment.next.isKnob()) {
			continuatorSegment = continuatorSegment.next;
			knobCount++
		}
	}
	firstKnob.knobCount = knobCount;
	return firstKnob;
}

/**
 *  remove the given segments and their c0/c1 corners.
 *  Segments must be in increasing order.
 */
PolygonSquareCovering.prototype.removeSegments = function(segments, removeCornersBeforeSegments) {
	var prev = segments[0].prev;
	var next = segments[segments.length-1].next;
	for (var i=0; i<segments.length; ++i) {
		var segmentToRemove = segments[i];
		this.segments.remove(segmentToRemove);
		var cornerToRemove = removeCornersBeforeSegments? segmentToRemove.c0: segmentToRemove.c1;
		cornerToRemove.remove();
	}
	if (removeCornersBeforeSegments)  // prev.c1 is before segments[0] and hence removed:
		prev.c1 = next.c0;
	else                              // next.c0 is after segments.last and hence removed:
		next.c0 = prev.c1;
	prev.c1.s1 = next;
	next.c0.s0 = prev;
}


/**
 * @param knob a segment in this.segments.
 * @param knobCount a number between 1 and 4 describing the number of adjacent knobs (starting from knob)
 */
PolygonSquareCovering.prototype.removeErasableRegion = function(knob, knobCount) {
	if (!knob.isKnob()) {
		console.dir(knob);
		throw new Error("non-knob disguised as a knob!")
	}

	if (!knobCount) knobCount = 1;
	if (knobCount<1 || 4<knobCount) {
		console.dir(knob);
		throw new Error("illegal knobCount "+knobCount);
	}

	if (knobCount==4) {
		this.removeAll();
		return;
	}
	
	else if (knobCount==3) {  // a room with a door; remove the "balcony" of the room.
		var knob1=knob, knob2=knob.next, knob3=knob.next.next;
//			console.log("*** 3 knobs - remove balcony ***");
//			console.log("knob1="+knob1.toString()+"\nknob2="+knob2.toString()+"\nknob3="+knob3.toString());
		if (knob1.isVertical()) {
			var doorWidth = Math.abs(knob1.prev.c0.x - knob3.next.c1.x);
			knob1.setX(knob1.prev.c0.x);
			knob1.c1.y = knob1.c0.y + knob1.ySign()*doorWidth;
			knob1.c0.y = knob1.prev.prev.c0.y;
			knob3.setX(knob3.next.c1.x);
			knob3.c0.y = knob3.c1.y - knob3.ySign()*doorWidth;
			knob3.c1.y = knob3.next.next.c1.y;
		} else {
			var doorWidth = Math.abs(knob1.prev.c0.y - knob3.next.c1.y);
			knob1.setY(knob1.prev.c0.y);
			knob1.c1.x = knob1.c0.x + knob1.xSign()*doorWidth;
			knob1.c0.x = knob1.prev.prev.c0.x;
			knob3.setY(knob3.next.c1.y);
			knob3.c0.x = knob3.c1.x - knob3.xSign()*doorWidth;
			knob3.c1.x = knob3.next.next.c1.x;
		}
		this.removeSegments([knob1.prev.prev,knob1.prev], /*removeCornersBeforeSegments=*/true);
		this.removeSegments([knob3.next,knob3.next.next], /*removeCornersBeforeSegments=*/false);
		
		knob = knob2;  // this is a 1-knob continuator
		this.calculateConvexityAndVisibility();
		this.checkValid();
	}
	
	else if (knobCount==2) {     // a room with a wide opening; remove the "balcony" of the room.
		var knob1=knob, knob2=knob.next;
		var knobLength = knob.length(), prevLength = knob1.prev.length(), nextLength = knob2.next.length();
//		console.log("*** 2 knobs - remove balcony ***");
//		console.log("knob1="+knob1.toString()+"\nknob2="+knob2.toString()+"\nknob2.next="+knob2.next.toString());
		if ((prevLength<=nextLength && nextLength<=knobLength) ||    // type #2
 		    (prevLength<=knobLength && knobLength<=nextLength)) {      // type #1
			var doorWidth = knobLength-prevLength;
			if (knob1.isVertical()) {
				knob1.setX(knob1.prev.c0.x);
				knob1.c1.y = knob1.c0.y + knob1.ySign()*doorWidth;
				knob1.c0.y = knob1.prev.prev.c0.y;
				knob2.c1.y = knob2.c0.y; // = knob1.c1.y
			} else {
				knob1.setY(knob1.prev.c0.y);
				knob1.c1.x = knob1.c0.x + knob1.xSign()*doorWidth;
				knob1.c0.x = knob1.prev.prev.c0.x;
				knob2.c1.x = knob2.c0.x; // = knob1.c1.x
			}		
			this.removeSegments([knob1.prev.prev,knob1.prev], /*removeCornersBeforeSegments=*/true);
			knob = knob2;  // this is a 1-knob continuator
		} else if (	(nextLength<=prevLength && prevLength<=knobLength) ||  // type #2
			        (nextLength<=knobLength && knobLength<=prevLength))  {  // type #1
			var doorWidth = knobLength-nextLength;
//			console.log("doorWidth="+doorWidth)
			if (knob2.isVertical()) {
				knob2.setX(knob2.next.c1.x);
				knob2.c0.y = knob2.c1.y - knob2.ySign()*doorWidth;
				knob2.c1.y = knob2.next.next.c1.y;
				knob1.c0.y = knob1.c1.y; // = knob2.c0.y
			} else {
				knob2.setY(knob2.next.c1.y);
				knob2.c0.x = knob2.c1.x - knob2.xSign()*doorWidth;
				knob2.c1.x = knob2.next.next.c1.x;
				knob1.c0.x = knob1.c1.x; // = knob2.c0.x
			}
//			console.log("*** 2 knobs - removeD balcony ***");
//			console.log("knob1="+knob1.toString()+"\nknob2="+knob2.toString());
			
			this.removeSegments([knob2.next,knob2.next.next], /*removeCornersBeforeSegments=*/true);
			knob = knob1;  // this is a 1-knob continuator
		} 
		this.calculateConvexityAndVisibility();
		this.checkValid();
	}
	
	//console.log(this.toString()+"\n");

	var exposedDistance0 = knob.prev.length();
	if (!exposedDistance0){console.log("knob="+knob.toString());  throw new Error("No exposedDistance0")}
	var exposedDistance1 = knob.next.length();
	if (!exposedDistance1) {console.log("knob="+knob.toString()); throw new Error("No exposedDistance1")}
	var exposedDistance = Math.min(exposedDistance0,exposedDistance1);
	var coveredDistance = knob.length(); // TODO: calculate the actual covering distance
	if (!coveredDistance) {console.log("knob="+knob.toString()); throw new Error("No coveredDistance")}
	var securityDistance = knob.distanceToNearestBorder() - knob.length();
	if (!securityDistance) {console.log("knob="+knob.toString()); throw new Error("No securityDistance")}
	var nonExposedDistance = Math.min(coveredDistance,securityDistance);
	console.log("nonExposedDistance=min("+coveredDistance+","+securityDistance+")="+nonExposedDistance+" exposedDistance=min("+exposedDistance0+","+exposedDistance1+")="+exposedDistance);

	if (nonExposedDistance < exposedDistance) { // The knob just moves into the polygon:
		if (knob.isVertical())
			knob.c0.x = knob.c1.x = knob.c1.x + knob.signOfPolygonInterior()*nonExposedDistance;
		else 
			knob.c0.y = knob.c1.y = knob.c1.y + knob.signOfPolygonInterior()*nonExposedDistance;
	} else {  // nonExposedDistance >= exposedDistance: some corners should be removed
		if (exposedDistance0<exposedDistance1) {
			// shorten the next segment:
			if (knob.isVertical()) 
				knob.next.c0.x=knob.prev.c0.x;
			else 
				knob.next.c0.y=knob.prev.c0.y;
			this.removeSegments([knob.prev,knob], /*removeCornersBeforeSegments=*/true);
		} else if (exposedDistance1<exposedDistance0) {
			// shorten the previous segment:
			if (knob.isVertical()) 
				knob.prev.c1.x=knob.next.c1.x;
			 else 
				knob.prev.c1.y=knob.next.c1.y;
			this.removeSegments([knob, knob.next], /*removeCornersBeforeSegments=*/false);
		} else {
			if (knob.isVertical()) 
				knob.prev.prev.c1.y=knob.next.next.c1.y;
			else 
				knob.prev.prev.c1.x=knob.next.next.c1.x;
			this.removeSegments([knob.prev, knob, knob.next, knob.next.next], /*removeCornersBeforeSegments=*/true);
		}
	}
	this.checkValid();
}

PolygonSquareCovering.prototype.removeAll = function() {
	this.segments.initialize();
	this.corners.initialize();
}

PolygonSquareCovering.prototype.checkValid = function() {
	this.segments.forEach(function(segment){
		if (!segment.isAxisParallel())
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tOne of the segments is not axis parallel: "+segment.toString());
		if (segment.isKnob() && segment.distanceToNearestBorder()==0)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tOne of the segments is adjacent to the border: "+segment.toString());
		if (segment.prev===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tsegment.prev is null: "+segment.toString());
		if (segment.next===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tsegment.next is null: "+segment.toString());
	},this)

	this.corners.forEach(function(corner){
		if (!corner.s0.isAxisParallel()) 
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment before corner "+corner.toString()+" is not axis parallel: "+corner.s0);
		if (!corner.s1.isAxisParallel()) 
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment after corner "+corner.toString()+" is not axis parallel: "+corner.s1);
		if (corner.s0.prev===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment before corner "+corner.toString()+" has null prev: "+corner.s0);
		if (corner.s1.prev===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment after corner "+corner.toString()+" has null prev: "+corner.s1);
	},this)
}

PolygonSquareCovering.prototype.findMinimalCovering = function() {
	var P = this;   // P is the residual polygon.
	var covering = [];       // C is the current covering.
	while (!P.isEmpty()) {
		var knob = P.findContinuatorSegment(); // returns the first knob in a continuator.
		var continuator = knob.continuator();
		console.log("\nP="+P.corners.toString())
		console.log("\tprocessing knob "+knob.toString()+" with continuator "+JSON.stringify(continuator))

		var balconyOfContinuatorIsCovered = false; // TODO: check whether the balcony is really covered, to avoid redundant squares.!
		if (!balconyOfContinuatorIsCovered)
			covering.push(continuator); 

		P.removeErasableRegion(knob, knob.knobCount);
	}
	
	return covering;
}


/**
 * A shorthand function for directly calculating the minimal square covering of a polygon defined by the given xy values.
 * Useful for testing and demonstrations.
 * 
 * @param xy an array of alternating x and y values, describing a rectilinear polygon.
 * @return an array with a minimal square covering of that polygon.
 */
jsts.minimalSquareCoveringOf = function(xy) {
	var srp = new jsts.geom.SimpleRectilinearPolygon(xy);
	var srpc = new jsts.PolygonSquareCovering(srp);
	return srpc.findMinimalCovering();
}

