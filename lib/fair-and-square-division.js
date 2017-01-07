/**
 * Divide a cake such that each color gets a fair number of points.
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var _ = require("underscore");
_.mixin(require("argminmax"))

var jsts = global.jsts
require('./point-utils');  // jsts.algorithm.numPointsInXY
var ValueFunction = require("./ValueFunction")

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);


/**
 * Returns the total value that the cake should have,
 * such that each agent gets at least 1 value.
 */
function requiredTotalValue(numOfAgents, maxAspectRatio) {
	if (maxAspectRatio<2) {
		return Math.max(1, 4*numOfAgents-4)
	} else {
		return Math.max(1, 4*numOfAgents-5)
	}
}

jsts.geom.GeometryFactory.prototype.createFairAndSquareDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	var numOfAgents = agentsValuePoints.length;
	var valueFunctions = ValueFunction.createArray(requiredTotalValue(numOfAgents,maxAspectRatio), agentsValuePoints)
	return this.fairAndSquareDivision(valueFunctions, envelope, maxAspectRatio);
}

/**
 * Find a set of axis-parallel squares representing a fair-and-square division of the points.
 *
 * @param agents an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}.
 *
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 *
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 *
 * @return a list of AxisParallelRectangle's.
 */
jsts.geom.GeometryFactory.prototype.fairAndSquareDivision = function(valueFunctions, envelope, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	if (numOfAgents==0)
		return [];

	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	if (!maxAspectRatio) maxAspectRatio=1;

	if (numOfAgents==1) { // base case - single agent - find a square covering
		var valueFunction = valueFunctions[0];

		var pointsInEnvelope = jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope);
		landplot = jsts.algorithm.squareWithMaxNumOfPoints(
				pointsInEnvelope, envelope, maxAspectRatio);

		var shape = this.createAxisParallelRectangle(landplot);
		if (valueFunction.color) shape.color = valueFunction.color;
		return [shape];
	}

	var midx = (envelope.maxx+envelope.minx)/2;
	var midy = (envelope.maxy+envelope.miny)/2;
	var lengthx = envelope.maxx-envelope.minx;
	var lengthy = envelope.maxy-envelope.miny;

	if (numOfAgents==2) { // simple case - two agents
		var quarters = [
			{corner: {x:envelope.minx,y:envelope.miny}, direction: "NE", dx:1, dy:1, square: new jsts.geom.Envelope(envelope.minx,midx, envelope.miny,midy)},
			{corner: {x:envelope.maxx,y:envelope.miny}, direction: "NW", dx:-1, dy:1, square: new jsts.geom.Envelope(midx,envelope.maxx, envelope.miny,midy)},
			{corner: {x:envelope.minx,y:envelope.maxy}, direction: "SE", dx:1, dy:-1, square: new jsts.geom.Envelope(envelope.minx,midx, midy,envelope.maxy)},
			{corner: {x:envelope.maxx,y:envelope.maxy}, direction: "SW", dx:-1, dy:-1, square: new jsts.geom.Envelope(midx,envelope.maxx, midy,envelope.maxy)},
		];

		var iBestQuarters = valueFunctions.map(function(valueFunction) {
			return _.argmax(quarters, function(quarter){ return valueFunction.valueOf(quarter.square); })
		})
		if (iBestQuarters[0]!=iBestQuarters[1]) { // Easy case: different choices
			landPlot0 = quarters[iBestQuarters[0]].square;
			landPlot1 = quarters[iBestQuarters[1]].square;
		} else {   // Hard case: different choices
			var iBestQuarter = iBestQuarters[0];
			var bestQuarter = quarters[iBestQuarter];
			var requestedValue = 1;
			var bestCornerSquares = valueFunctions.map(function(valueFunction) {
				return valueFunction.sizeOfSquareWithValue(bestQuarter.corner, requestedValue, bestQuarter.direction);
			})
			var meanCornerSquareSize = (bestCornerSquares[0]+bestCornerSquares[1])/2;
			var cornerSquare = new jsts.geom.Envelope(
				bestQuarter.corner.x, bestQuarter.corner.x+bestQuarter.dx*meanCornerSquareSize,
				bestQuarter.corner.y, bestQuarter.corner.y+bestQuarter.dy*meanCornerSquareSize
			);
			var coverSquareSize = lengthx - meanCornerSquareSize;
			var coverSquares = [];
			for (var i=0; i<quarters.length; ++i) {
				if (i==iBestQuarter) continue;
				var curQuarter = quarters[i];
				coverSquares.push(new jsts.geom.Envelope(
					curQuarter.corner.x, curQuarter.corner.x+curQuarter.dx*coverSquareSize,
					curQuarter.corner.y, curQuarter.corner.y+curQuarter.dy*coverSquareSize
				));
			}
			if (bestCornerSquares[0]<=bestCornerSquares[1]) {
				landPlot0 = cornerSquare;
				landPlot1 = _.max(coverSquares, function(s){return valueFunctions[1].valueOf(s)});
			} else {
				landPlot1 = cornerSquare;
				landPlot0 = _.max(coverSquares, function(s){return valueFunctions[0].valueOf(s)});
			}
		}
		return [
			this.fairAndSquareDivision([valueFunctions[0]], landPlot0, maxAspectRatio)[0],
			this.fairAndSquareDivision([valueFunctions[1]], landPlot1, maxAspectRatio)[0],
		]
	}

	// here, there are at least two agents.

	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;

	var piece1, piece2;
	if (width>=height) {
		var piece1 = new jsts.geom.Envelope(envelope.minx,midx, envelope.miny,envelope.maxy);
		var piece2 = new jsts.geom.Envelope(midx,envelope.maxx, envelope.miny,envelope.maxy);
	} else {  // width<height
		var piece1 = new jsts.geom.Envelope(envelope.minx,envelope.maxx, envelope.miny,midy);
		var piece2 = new jsts.geom.Envelope(envelope.minx,envelope.maxx, midy,envelope.maxy);
	}

	// Eval Auction on piece1:
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.bid1 = valueFunction.valueOf(piece1);
	})
	// Sort by decreasing order of bids:
	valueFunctions.sort(function(a,b){return b.bid1-a.bid1})
	// Find the h-index:
	for (var h=0; h<valueFunctions.length; ++h) {
		if (valueFunction[h].bid1 >= requiredTotalValue(h+1, maxAspectRatio))
			agentsForPiece1.push(valueFunction[h]);
		else
			agentsForPiece2.push(valueFunction[h]);
	}

	if (agentsForPiece1.length<numOfAgents && agentsForPiece2<numOfAgents) {
		var fairDivision1 = this.fairAndSquareDivision(agentsForPiece1, piece1, maxAspectRatio);
		var fairDivision2 = this.fairAndSquareDivision(agentsForPiece2, piece2, maxAspectRatio);
		return fairDivision1.concat(fairDivision2);
	} else {
		return [];
	}
}


/*---------------- UTILS ---------------*/

var numPartners = function(valueFunction, envelope, n, maxAspectRatio) {
	var normalizedValue = valueFunction.valueOf(envelope);
	for (var k=1; k<=n-2; k++) {
		if (A*k-B<=normalizedValue && normalizedValue<A*(k+1)-B)
			return k;
	}

	if (A*(n-1)-B<=normalizedValue && normalizedValue<=A*n-B-T)
		return n-1;

	return n;
}


var giveLandplotToSingleAgentIfValueAtLeast1 = function(valueFunction, landplot) {
	var value = valueFunction.valueOf(landplot);
	if (value>=1) {
		TRACE(1,"++ best landplot has value "+value
//				+": "+JSON.stringify(landplot)
				);
		if (valueFunction.color) landplot.color = valueFunction.color;
		return [landplot];
	} else {
		TRACE(1,"-- best landplot has value "+value
//				+": "+JSON.stringify(valueFunction)
				);
		return [];
	}
}
