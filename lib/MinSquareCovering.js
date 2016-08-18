/**
 * Calculate the minimum square covering of a SimpleRectilinearPolygon.
 * Based on Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
 * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
 * 
 * 
 * USAGE EXAMPLE:
 * 
 * var jsts = require("computational-geometry");
 * ...
 * var polygonXY = [0,0, 15,5, 20,20];
 * console.dir(jsts.minSquareCovering(polygonXY));
 * 
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */



var jsts = global.jsts
require("./SimpleRectilinearPolygon");
require("./Side");

var LinkedList = require('jsclass/src/linked_list').LinkedList;
var ListNode = LinkedList.Node;
var DoublyLinkedList = LinkedList.Doubly.Circular;
require('./DoublyLinkedList');

var almostEqual = require("almost-equal")

function TRACE(s) {
//	console.log(s);
};


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
		error("cannot detect the direction: "+c0.toString()+", "+c1.toString())
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

Segment.prototype.isKnob = function() {
	return this.c0.isConvex && this.c1.isConvex;
}

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

/**
 * @return the distance to the nearest side of the polygon.
 * relevant mainly for knobs
 */
Segment.prototype.distanceToNearestBorder = function() {
	return Math.min(
		this.distanceToNearestConcaveCorner(),
		Math.min(
			this.c0.distanceToNearestSegment(jsts.inverseSide(this.prev.direction)),
			this.c1.distanceToNearestSegment(this.next.direction)
		)
	);
}

Segment.prototype.signOfPolygonInterior = function() {
	if (this.isVertical()) 
		return this.c0.signOfPolygonInteriorX();
	else
		return this.c0.signOfPolygonInteriorY();
}

/**
 * @return the square adjacent to this segment which is contained in the polygon.
 */
Segment.prototype.getAdjacentSquareInPolygon = function() {
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
		" , len="+this.length()+
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
	this.isConvex = (this.turnDirection() == polygonTurnDirection);
}

Corner.prototype.turnDirection = function() {
	return jsts.turn(this.s0.direction, this.s1.direction); // left=-1, right=1
}

/**
 * @return the direction of the polygon interior relative to this (convex) corner. 
 * The direction is returned as a string: SW, SE, NW or NE.
 */
Corner.prototype.directionOfPolygonInterior = function() {
	var northSouth, eastWest;
	
	var dir0 = jsts.sideToLetter[jsts.inverseSide(this.s0.direction)];
	var dir1 = jsts.sideToLetter[this.s1.direction];
	
	if (this.s0.isVertical())
		return dir0+dir1;
	else
		return dir1+dir0;
}

Corner.prototype.verticalDirection = function() {
	return this.s0.isVertical()? jsts.inverseSide(this.s0.direction): this.s1.direction;
}

Corner.prototype.horizontalDirection = function() {
	return this.s0.isHorizontal()? jsts.inverseSide(this.s0.direction): this.s1.direction;
}

Corner.prototype.signOfPolygonInteriorX = function() {
	return ((this.horizontalDirection()==jsts.Side.East)==this.isConvex)? 1: -1
}

Corner.prototype.signOfPolygonInteriorY = function() {
	return ((this.verticalDirection()==jsts.Side.North)==this.isConvex)? 1: -1
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
	
	this.positiveVisibilitySegment = positiveVisibilitySegment; // The segment visible to us in the direction of the incoming segment (s0). It contains the point p+.
	this.positiveVisibilityNode = positiveVisibilitySegment.addVisibleCorner(this);  // pointer to the node, in the list of positiveVisibilitySegment, which contains us.
	
	this.negativeVisibilitySegment = negativeVisibilitySegment; // The segment visible to us in the opposite direction to the outgoing segment (s1).  It contains the point p-.
	this.negativeVisibilityNode = negativeVisibilitySegment.addVisibleCorner(this);  // pointer to the node, in the list of negativeVisibilitySegment, which contains us.
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
			var knobLength = this.s0.length();
			var nextCorner = this.s0.c0;
		} else if (direction==this.s1.direction) {
			var knobLength = this.s1.length();
			var nextCorner = this.s1.c1;
		} else {
			return 0;
		}
		return knobLength + 
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
	return "("+this.x+","+this.y+"; "+this.turnDirection()+","+(this.isConvex?"convex":"concave")+")";
}



/*-************ MinSquareCoveringData Structure *******************-*/

/**
 * thePolygon - a SimpleRectilinearPolygon
 */
var MinSquareCoveringData = jsts.algorithm.MinSquareCoveringData = function(thePolygon) {
	/* Clone the sequence of corners in order to add more information: */
	var points = thePolygon.getCoordinates();
	//console.log("typeof points="+typeof points)
	//console.log("points.length="+points.length)
	var corners = new DoublyLinkedList();
	for (var i=0; i<points.length-1; ++i) 
		corners.push(new Corner(points[i]));  //points[i] should have a field "x" and a field "y".
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
			totalTurn += corner.turnDirection();
		}
		previousSegment = segment;
	}, this);
	this.segments = segments;
	corners.first.setSegments(segments.last, segments.first);
	totalTurn += corners.first.turnDirection();
	this.turnDirection = jsts.turnDirection(totalTurn);
	this.calculateConvexityAndVisibility();
	
	this.factory = thePolygon.factory;
}


MinSquareCoveringData.prototype.isEmpty = function() {
	return this.corners.isEmpty();
}

MinSquareCoveringData.prototype.calculateConvexityAndVisibility = function() {
	/* Decide whether the corners are convex or concave, and calculate visibility information: */
	
	TRACE("calculateConvexityAndVisibility: "+this.corners.length+" corners")
	this.segments.forEach(function(segment) {
		segment.initializeProjectionList();
	});
	this.corners.forEach(function(corner) {
		corner.calculateConvexity(this.turnDirection);
		if (!corner.isConvex) {   // concave corner - calculate visibility information:
			var positiveVisibilitySegment = this.findClosestSegment(corner.s0.direction, corner);
			if (!positiveVisibilitySegment) throw new Error("findClosestSegment returned null for positive visibility of "+corner.toString());
			var negativeVisibilitySegment = this.findClosestSegment(jsts.inverseSide(corner.s1.direction), corner);
			if (!negativeVisibilitySegment) throw new Error("findClosestSegment returned null for negative visibility of "+corner.toString());
			corner.setVisibilityInfo(positiveVisibilitySegment,negativeVisibilitySegment);
		}
	}, this);
	this.checkValid();
}

MinSquareCoveringData.prototype.findClosestSegment = function(direction, point) {
//	console.log("fcs "+point.toString())
	var closestSoFar = null;
	this.segments.forEach(function(segment) {
//		console.log("\tfcs "+point.toString()+" "+segment.isInDirectionOf(direction,point))
		if (segment && segment.isInDirectionOf(direction,point)) {
			if (!closestSoFar || closestSoFar.isInDirectionOfSegment(direction,segment))
				closestSoFar = segment;
		}
	});
//	console.log("\tfcs "+point.toString()+" end");
//	if (!closestSoFar)	throw new Error("findClosestSegment returned null")
	return closestSoFar;
}

/**
 * @param point {x,y}
 * @return true if the point is in the interior of the polygon.
 * Uses the "even-odd rule" algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
 */
MinSquareCoveringData.prototype.contains = function(point) {
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





Segment.prototype.hasContinuator = function() {
	if (!this.isKnob())
		return false;
	if (this.distanceToNearestBorder() < this.length())
		return false;
//	if (this.distanceToNearestBorder() < this.length())
//		return false;
	return true;
}

/**
 * Decide if a given knob-chain supports a continuator.
 * @param knobCount (int) number of knobs in chain: 1, 2, 3 or 4.
 * @param knobStartingChain, knobEndingChain (Segment)
 * 
 */
function hasContinuator(knobCount, knobStartingChain, knobEndingChain) {
	var knobLength = knobStartingChain.length();
	var beforeChain = knobStartingChain.prev;
	var afterChain = knobEndingChain.next;
	switch (knobCount) {
	case 4: 
		return true;
	case 3: 
		var Aprev = beforeChain.c0;
		var Dnext = afterChain.c1;
		//console.log("Aprev:"+Aprev+" Dnext:"+Dnext);
		var Aprev_sees_Dnext = (!Aprev.isConvex && !Dnext.isConvex && Dnext.positiveVisibilitySegment.c1==Aprev);
		return Aprev_sees_Dnext;
	case 2:
		var A = knobStartingChain.c0;
		var Aprev = beforeChain.c0;
		var C = knobEndingChain.c1;
		var Cnext = afterChain.c1;
		
		var AAprev = knobStartingChain.prev.length();
		var A_Aprev = Aprev.isConvex? AAprev: A.distanceToSegment(Aprev.negativeVisibilitySegment);
		var CCnext = knobEndingChain.next.length();
		var C_Cnext = Cnext.isConvex? CCnext: C.distanceToSegment(Cnext.positiveVisibilitySegment);

		//console.log("Aprev:"+Aprev+" Cnext:"+Cnext+" AAprev:"+AAprev+" A_Aprev:"+A_Aprev+" CCnext:"+CCnext+" C_Cnext:"+C_Cnext);

		return (A_Aprev>knobLength && C_Cnext>knobLength) ||
		                (AAprev>=knobLength && C_Cnext==knobLength) ||
		                (A_Aprev==knobLength && CCnext>=knobLength);
	case 1:
		return (knobStartingChain.distanceToNearestBorder() > knobLength+almostEqual.FLT_EPSILON);
	default: 
		throw new Error("Invalid knobCount: "+knobCount);
	}
}

/**
 * @return the first segment, unless it is a knob in the middle of a knob-chain, in which case it returns the first knob in that chain.
 */
MinSquareCoveringData.prototype.firstInChain = function() {
	var segment = this.segments.first;
	
	if (segment.isKnob()) {
		var knobLength = segment.length();
		// Make sure "segment" is the first in a knob chain:
		while (almostEqual(segment.prev.length(),knobLength,0,0.001) && 
				segment.prev.isKnob() && 
				segment.prev!=this.segments.first)  {
			segment = segment.prev;
		}
	}
	
	return segment;
}


/**
 * @return the first knob in a chain supporting a continuator.
 */
MinSquareCoveringData.prototype.findSegmentWithContinuator = function() {
	TRACE("\nfindSegmentWithContinuator: "+this.segments.length+" segments")

	var firstSegment = this.firstInChain();
	var segment = firstSegment;
	for (;;) {
		if (segment.isKnob()) {
			var knobStartingChain = segment;
			var knobLength = knobStartingChain.length();
			
			// Calculate the length of the knob-chain:
			var knobCount = 1;
			var knobEndingChain = segment;
			while (almostEqual(knobEndingChain.next.length(),knobLength,0,0.001) && 
					knobEndingChain.next.isKnob() && 
					knobEndingChain.next!=firstSegment)  {
				knobEndingChain = knobEndingChain.next;
				knobCount++;
			}
			knobStartingChain.knobCount = knobCount;
			
			// Check if there is a continuator starting at knobStartingChain:
			if (hasContinuator(knobCount, knobStartingChain, knobEndingChain))
				return knobStartingChain;

			segment = knobEndingChain.next; // ...and continue searching
		} else {
			segment = segment.next;  // ...and continue searching
		}
		
		if (segment==firstSegment) {
			console.log(this.segments.toString());
			throw new Error("No continuator found - this is against the Theorem!");
		}
	}
}

/**
 * @return a list of all first-knobs with continuators.
 */
MinSquareCoveringData.prototype.findAllSegmentsWithContinuators = function() {
	TRACE("\findAllSegmentsWithContinuators: "+this.segments.length+" segments")
	
	var theSegments = [];

	var firstSegment = this.firstInChain();
	var segment = firstSegment;
	for (;;) {
		if (segment.isKnob()) {
			var knobStartingChain = segment;
			var knobLength = knobStartingChain.length();

			// Calculate the length of the knob-chain:
			var knobCount = 1;
			var knobEndingChain = segment;
			while (almostEqual(knobEndingChain.next.length(),knobLength,0,0.001) && 
					knobEndingChain.next.isKnob() && 
					knobEndingChain.next!=firstSegment)  {
				knobEndingChain = knobEndingChain.next;
				knobCount++;
			}
			knobStartingChain.knobCount = knobCount;

			// Check if there is a continuator starting at knobStartingChain:
			if (hasContinuator(knobCount, knobStartingChain, knobEndingChain))
				theSegments.push(knobStartingChain);
			
			segment = knobEndingChain.next; // ...and continue searching
		} else {
			segment = segment.next;  // ...and continue searching
		}

		if (segment==firstSegment) 
			break;
	}

	if (!theSegments.length) {
		console.log(this.segments.toString());
		throw new Error("No continuator found - this is against the Theorem!");
	}
	
	return theSegments;
}

/**
 *  remove the given segments and their c0/c1 corners.
 *  Segments must be in increasing order.
 */
MinSquareCoveringData.prototype.removeSegments = function(segments, removeCornersBeforeSegments) {
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
MinSquareCoveringData.prototype.removeErasableRegion = function(knob) {
	if (!knob.isKnob()) {
		console.dir(knob);
		throw new Error("non-knob disguised as a knob!")
	}
	
	var knobCount = knob.knobCount;

	if (knobCount<1 || 4<knobCount) {
		console.dir(knob);
		throw new Error("illegal knobCount "+knobCount);
	}

	if (knobCount==4) {
		this.removeAll();
		TRACE("\t4 knobs: removing all: "+this.isEmpty());
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
		TRACE("\t2 knobs: remove balcony");
		TRACE("\t\tprevLength="+prevLength+"\n\t\tknob1="+knob1.toString()+"\n\t\tknob2="+knob2.toString()+"\n\t\tknobLength="+knobLength+"\n\t\tnextLength="+nextLength);
		if ((almostEqual(prevLength,nextLength,0,0.001) && nextLength<=knobLength)) {      // type #1
			var doorWidth = knobLength-prevLength;
			if (knob1.isVertical()) {
				knob1.setX(knob1.prev.c0.x);  // also sets knob2.c0.x
				knob2.setY(knob2.next.c1.y);  // also sets knob1.c1.y
				knob1.c0.y = knob1.prev.prev.c0.y;
				knob2.c1.x = knob2.next.next.c1.x;
			} else {
				knob1.setY(knob1.prev.c0.y);  // also sets knob2.c0.y
				knob2.setX(knob2.next.c1.x);  // also sets knob1.c1.x
				knob1.c0.x = knob1.prev.prev.c0.x;
				knob2.c1.y = knob2.next.next.c1.y;
			}
			this.removeSegments([knob1.prev.prev,knob1.prev], /*removeCornersBeforeSegments=*/true);
			this.removeSegments([knob2.next,knob2.next.next], /*removeCornersBeforeSegments=*/false);
			knob = null;  // no 1-knob continuator (???)
		} else if ((prevLength<nextLength && nextLength<=knobLength) ||    // type #2
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
		} else if (	(nextLength<prevLength && prevLength<=knobLength) ||  // type #2
			        (nextLength<=knobLength && knobLength<=prevLength))  {  // type #1
			var doorWidth = knobLength-nextLength;
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
			this.removeSegments([knob2.next,knob2.next.next], /*removeCornersBeforeSegments=*/true);
			knob = knob1;  // this is a 1-knob continuator
		} 
		TRACE("\t2 knobs: removeD balcony");
		TRACE("\t\tknob1="+knob1.toString()+"\n\t\tknob2="+knob2.toString());

		this.calculateConvexityAndVisibility();
		this.checkValid();
	}

	if (!knob)  return;
	
	// handle remaining 1-knob continuator:
	var exposedDistance0 = knob.prev.length();
	if (knobCount==1 && exposedDistance0<almostEqual.FLT_EPSILON || exposedDistance0<0) {console.log("knob="+knob.toString());  throw new Error("exposedDistance at knob.prev = "+exposedDistance0)}
	var exposedDistance1 = knob.next.length();
	if (knobCount==1 && exposedDistance1<almostEqual.FLT_EPSILON || exposedDistance1<0) {console.log("knob="+knob.toString()); throw new Error("exposedDistance at knob.next = "+exposedDistance1)}
	var exposedDistance = Math.min(exposedDistance0,exposedDistance1);
	var coveredDistance = knob.length(); // TODO: calculate the actual covering distance
	if (knobCount==1 && coveredDistance<almostEqual.FLT_EPSILON || coveredDistance<0) {console.log("knob="+knob.toString()); throw new Error("coveredDistance = "+coveredDistance)}
	var securityDistance = knob.distanceToNearestBorder() - knob.length();
	if (knobCount==1 && securityDistance<almostEqual.FLT_EPSILON || securityDistance<0) {console.log("knob="+knob.toString()); throw new Error("securityDistance = "+securityDistance)}
	var nonExposedDistance = Math.min(coveredDistance,securityDistance);
	TRACE("nonExposedDistance=min("+coveredDistance+","+securityDistance+")="+nonExposedDistance+" exposedDistance=min("+exposedDistance0+","+exposedDistance1+")="+exposedDistance);
	
	if (nonExposedDistance>0 && nonExposedDistance < exposedDistance) { // The knob just moves into the polygon:
		if (knob.isVertical())
			knob.c0.x = knob.c1.x = knob.c1.x + knob.signOfPolygonInterior()*nonExposedDistance;
		else 
			knob.c0.y = knob.c1.y = knob.c1.y + knob.signOfPolygonInterior()*nonExposedDistance;
	} else if (exposedDistance>0 && exposedDistance <= nonExposedDistance){  // some corners should be removed:
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

MinSquareCoveringData.prototype.removeAll = function() {
	this.segments.initialize();
	this.corners.initialize();
}

MinSquareCoveringData.prototype.checkValid = function() {
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



var cornerToKey = function(corner) {
	return corner.x+","+corner.y;
}

MinSquareCoveringData.prototype.hasConvexCorner = function(corner) {
	if (!this.hashOfConvexCorners) {
		this.hashOfConvexCorners = {};
		this.corners.forEach(function(point) {
			if (point.isConvex) 
				this.hashOfConvexCorners[cornerToKey(point)]=true;
		},this)
	}
	return this.hashOfConvexCorners[cornerToKey(corner)];
}

MinSquareCoveringData.prototype.getResidualPolygon = function() {
	var residualPolygonPoints = this.corners.map(function(corner) {
		return {x:corner.x, y:corner.y}
	});
	residualPolygonPoints.push(residualPolygonPoints[0]);
	return this.factory.createSimpleRectilinearPolygon(residualPolygonPoints);
}

/**
 * Iterates the squares covering this polygon.
 * 
 * @param iterator a function with a single argument which is the current covering square.
 * The function should return a truthy value; if it returns a falsy value, the iteration stops immediately.
 */
MinSquareCoveringData.prototype.iterateMinimumCovering = function(iterator) {
	var P = this;   // P is the residual polygon.
	var maxIterations = Math.max(2*P.corners.length,200);
	while (!P.isEmpty()) {
		TRACE("\nP="+P.corners.toString())
		var knob = P.findSegmentWithContinuator(); // returns the first knob in a continuator.
		var continuator = knob.getAdjacentSquareInPolygon();
		TRACE("\tprocessing knob "+knob.toString()+"\twith continuator "+JSON.stringify(continuator))
		P.removeErasableRegion(knob);

		var balconyOfContinuatorIsCovered = false; // TODO: check whether the balcony is really covered, to avoid redundant squares.!
		if (!balconyOfContinuatorIsCovered) {
			var shouldWeContinue = iterator(continuator);
			if (!shouldWeContinue)
				break;
		}
	
		maxIterations--;
		if (maxIterations<=0) 
			throw new Error("Covering not found after many iterations!");
	}

}

/**
 * @return a list of squares covering this polygon.
 */
MinSquareCoveringData.prototype.findMinimumCovering = function() {
	var covering = [];       // C is the current covering.
	this.iterateMinimumCovering(function(square) {
		covering.push(square); 
		return true;
	});
	return covering;
}



/**
 * A shorthand function for directly calculating the minimal square covering of a polygon defined by the given xy values.
 * Useful for testing and demonstrations.
 * 
 * @param arg A SimpleRectilinearPolygon
 * @return an array with a minimal square covering of that polygon.
 */
jsts.algorithm.minSquareCovering = function(arg, factory) {
	var srp = arg;
	var srpc = new jsts.algorithm.MinSquareCoveringData(srp);
	var covering = srpc.findMinimumCovering();
	if (factory) {
		return covering.map(function(square) {
			return factory.createAxisParallelRectangle(square);
		});
	} else {
		return covering;
	}
}
