/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
require("./factory-utils");
require("./AxisParallelRectangle");
require("./transformations");
require("./point-utils");
var _ = require("underscore");
var util = require("util");
var ValueFunction = require("./ValueFunction");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

function TRACE (numOfAgents, s) {
	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}

var roundFields3 = Math.roundFields.bind(0, 3);
var round2 = function(x) { 	return Math.round(x*100)/100; }

jsts.Side = {
	South: 0,
	West: 1,
	North: 2,
	East: 3
};





/**
 * Find a set of axis-parallel fat rectangles representing a fair-and-square division for the valueFunctions
 *
 * @param valueFunctions an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 *
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 *
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 *
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(valueFunctions, envelope, maxAspectRatio) {
	var landplots;
	var openSides = [];
	if (envelope.minx==-Infinity) openSides.push(jsts.Side.West);
	if (envelope.miny==-Infinity) openSides.push(jsts.Side.South);
	if (envelope.maxx== Infinity) openSides.push(jsts.Side.East);
	if (envelope.maxy== Infinity) openSides.push(jsts.Side.North);
	if (openSides.length==0) {
		landplots = jsts.algorithm.halfProportionalDivision4Walls(valueFunctions, envelope, maxAspectRatio);
	} else /*if (openSides.length==1)*/ {
		var openSide = openSides[0];
		landplots = jsts.algorithm.halfProportionalDivision3Walls(valueFunctions, envelope, maxAspectRatio, openSide);
	}

	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = landplot.color;
		return rect;
	});
};

jsts.algorithm.halfProportionalDivision4Walls = function(agentsValuePoints, envelope, maxAspectRatio) {
	TRACE(10,"")
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var shorterSide = (width<=height? jsts.Side.South: jsts.Side.East);
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm4Walls, shorterSide /* The norm4walls algorithm assumes that the southern side is shorter */,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
}

jsts.algorithm.halfProportionalDivision3Walls = function(agentsValuePoints, envelope, maxAspectRatio, openSide) {
	TRACE(10,"")
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm3Walls, southernSide,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
};




/************ NORMALIZATION *******************/

var runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valueFunctions, envelope, maxAspectRatio) {
	if (valueFunctions.length==0)
		return [];
	if (!maxAspectRatio) maxAspectRatio=1;

	var rotateTransformation = {rotateQuarters: southernSide - jsts.Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});

	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	if (height<=0 && width<=0)
		throw new Error("Zero-sized envelope: "+JSON.stringify(enveloper));
	if (width<=0)
		width = height/1000;
	var scaleFactor = 1/width;
	var yLength = height*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation =
		[rotateTransformation,
		 {translate: [-enveloper.minx,-enveloper.miny]},
		 {scale: scaleFactor}];

	var transformedvalueFunctions = valueFunctions.map(function(valueFunction) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		return valueFunction.cloneWithNewPoints(
			jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope)
			.map(jsts.algorithm.transformedPoint.bind(0,transformation)));
	});

	var landplots = normalizedDivisionFunction(transformedvalueFunctions, yLength, maxAspectRatio);

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));

	return landplots;
}



/** Order the given array of ValueFunction objects by an ascending order of a specific yCut - the yCut with value "yCutValue". */
var orderValueFunctionsByYcut = function(valueFunctions, yCutValue) {
	valueFunctions.sort(function(a,b){return a.yCuts[yCutValue]-b.yCuts[yCutValue]}); // order the valueFunctions by their v-line. complexity O(n log n)
}



/**
 * Normalized 4-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], where yLength>=1 (- the southern side is shorter than the eastern side)
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n
 */
var norm4Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents;
	var landplots = [];
	TRACE(numOfAgents,numOfAgents+" agents ("+_.pluck(valueFunctions,"color")+"): 4 Walls Algorithm");

	if (numOfAgents==1) { // base case - single agent:
		var valueFunction = valueFunctions[0];

		var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
		var pointsInEnvelope = jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope);
		landplot = jsts.algorithm.squareWithMaxNumOfPoints(
				pointsInEnvelope, envelope, maxAspectRatio);

		return giveLandplotToSingleAgentIfValueAtLeast1(valueFunction, landplot);
	}  // end if (numOfAgents==1)

	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_minus1 = [], yCuts_2k_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_next[1] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		orderValueFunctionsByYcut(valueFunctions, v);
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = valueFunctions[k-1].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = valueFunctions[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;

	// HERE, for every k, EITHER yCuts_2k[k] and yCuts_2k_next[k] are both smaller than 0.5,
	//                        OR yCuts_2k[k] and yCuts_2k_next[k] are both larger than yLength-0.5,

	if (false) {
		TRACE(numOfAgents, "## Trying closed partitions");
		for (var k=1; k<=numOfAgents-1; ++k) {
			var y_2k = yCuts_2k[k];           // the k-th 2k line
			var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
			orderValueFunctionsByYcut(valueFunctions, 2*k);
			if (y_2k <= yLength-0.5) {  // North will be 2-fat; South may be 2-thin.
				var y = Math.min(y_2k_next, yLength-0.5);
				var south = {minx:0, maxx:1, miny:0, maxy:y};
				var southAgents = valueFunctions.slice(0, k);
				var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(y>1? jsts.Side.South: jsts.Side.East),            southAgents, south, maxAspectRatio);
				if (southPlots.length==southAgents.length) {
					var north = {minx:0, maxx:1, miny:y, maxy:yLength};
					var northAgents = valueFunctions.slice(k, numOfAgents);
					var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-y>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
					TRACE(numOfAgents,"++ closed-south partition at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
					return southPlots.concat(northPlots);
				} else {
					TRACE(numOfAgents,"-- closed-south partition at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"] failed: k="+k+", "+southAgents.length+" south agents but only "+southPlots.length+" south plots found.");
					landplots = southPlots;
				}
			} else { // y_2k_next >= y_2k > L-0.5; South will be 2-fat; North may be 2-thin.
				var y = Math.max(y_2k,0.5);
				var north = {minx:0, maxx:1, miny:y, maxy:yLength};
				var northAgents = valueFunctions.slice(k, numOfAgents);
				var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-y>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
				if (northPlots.length==northAgents.length) {
					var south = {minx:0, maxx:1, miny:0, maxy:y};
					var southAgents = valueFunctions.slice(0, k);
					var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(y>1? jsts.Side.South: jsts.Side.East),            southAgents, south, maxAspectRatio);
					TRACE(numOfAgents,"++  closed-north partition at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
					return southPlots.concat(northPlots);
				} else {
					TRACE(numOfAgents,"-- closed-north partition at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"] k="+k+", "+northAgents.length+" north agents but only "+northPlots.length+" north plots found.");
					landplots = northPlots;
				}
			}
		}

		TRACE(numOfAgents,"-- No closed partition found. yCuts_2k="+yCuts_2k.map(round2)+", L="+round2(yLength));
	}

	TRACE(numOfAgents, "## Trying a bipartition");
	var y = yLength/2;
	var south = {minx:0, maxx:1, miny:0, maxy:y};
	var north = {minx:0, maxx:1, miny:y, maxy:yLength};
	//ValueFunction.orderArrayByLandplotValueRatio(valueFunctions, north, south);  // order by increasing val(north)/val(south)
	valueFunctions.forEach(function(a){a.valueOfSouth = a.valueOf(south); a.valueOfNorth = a.valueOf(north);})
	valueFunctions.sort(function(a,b){return b.valueOfSouth-a.valueOfSouth});  // descending order
	for (var k=1; k<=numOfAgents-1; ++k) {
		var southAgents = valueFunctions.slice(0, k);
		var northAgents = valueFunctions.slice(k, numOfAgents);
		var smallestSouthValue = valueFunctions[k-1].valueOfSouth;
		var smallestNorthValue = valueFunctions[k].valueOfNorth;
		if (smallestSouthValue<2*southAgents.length-2 || smallestNorthValue<2*northAgents.length-2)
			continue; // value too small
		TRACE(numOfAgents, "#### Trying a bipartition for k="+k+" south agents ("+_.pluck(southAgents,"color")+") with south values ("+_.pluck(southAgents,"valueOfSouth").map(round2)+") and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") with north values ("+_.pluck(northAgents,"valueOfNorth").map(round2)+")");
		var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(y>1? jsts.Side.South: jsts.Side.East),            southAgents, south, maxAspectRatio);
		var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-y>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
		landplots = northPlots.concat(southPlots);
		if (landplots.length==numOfAgents) {
			TRACE_PARTITION(numOfAgents, "++ bipartition", y, k, northAgents, northPlots, southAgents, southPlots)
			return landplots;
		} else {
			TRACE_PARTITION(numOfAgents, "-- bipartition", y, k, northAgents, northPlots, southAgents, southPlots)
		}
	}

	TRACE(numOfAgents,"-- No bipartition found. ");


	if (true) {
		TRACE(numOfAgents, "## Trying open partitions");
		for (var k=1; k<=numOfAgents-1; ++k) {
			var y_2k = yCuts_2k[k];           // the k-th 2k line
			var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
			orderValueFunctionsByYcut(valueFunctions, 2*k);
			if (y_2k <= yLength-0.5) {  // South is 2-thin (y_2k<y_2k_next<0.5)
				var y = y_2k_next;
				var south = {minx:0, maxx:1, miny:0, maxy:y};
				var southAgents = valueFunctions.slice(0, k+1);
				var southPlots = runDivisionAlgorithm(norm3WallsThin, /*open side=north, previous side= */jsts.Side.East, southAgents, south, maxAspectRatio);
				var highestSouthPlot = _.max(southPlots, function(plot){return plot.maxy});
				var north = {minx:0, maxx:1, miny:highestSouthPlot.maxy, maxy:yLength};
				var northAgents = valueFunctions.slice(k+1, numOfAgents);
				var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-highestSouthPlot.maxy>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
				landplots = northPlots.concat(southPlots);
				if (landplots.length==numOfAgents) {
					TRACE_PARTITION(numOfAgents, "++ open-south highestSouthPlot="+round2(highestSouthPlot.maxy), y, k, northAgents, northPlots, southAgents, southPlots);
					return southPlots.concat(northPlots);
				} else {
					TRACE_PARTITION(numOfAgents, "-- open-south highestSouthPlot="+round2(highestSouthPlot.maxy), y, k, northAgents, northPlots, southAgents, southPlots);
				}
			} else { // North is 2-thin (y_2k_next >= y_2k > L-0.5)
				var y = y_2k;
				var north = {minx:0, maxx:1, miny:y, maxy:yLength};
				var northAgents = valueFunctions.slice(k-1, numOfAgents);
				var northPlots = runDivisionAlgorithm(norm3WallsThin, /*open side=south, previous side = */jsts.Side.West, northAgents, north, maxAspectRatio);
				var lowestNorthPlot = _.min(northPlots, function(plot){return plot.miny});
				var south = {minx:0, maxx:1, miny:0, maxy:lowestNorthPlot.miny};
				var southAgents = valueFunctions.slice(0, k-1);
				var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(lowestNorthPlot.miny>1? jsts.Side.South: jsts.Side.East),    southAgents, south, maxAspectRatio);
				landplots = northPlots.concat(southPlots);
				if (landplots.length==numOfAgents) {
					TRACE_PARTITION(numOfAgents, "++ open-north lowestNorthPlot="+round2(lowestNorthPlot.miny), y, k, northAgents, northPlots, southAgents, southPlots);
					return southPlots.concat(northPlots);
				} else {
					TRACE_PARTITION(numOfAgents, "-- open-north lowestNorthPlot="+round2(lowestNorthPlot.miny), y, k, northAgents, northPlots, southAgents, southPlots);
				}
			}
		}
	}

	return landplots;
}


/**
 * Normalized 3-walls algorithm:
 * - valueFunctions.length>=2
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern border
 */
var norm3Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents-1;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 3 Walls Algorithm");

	if (numOfAgents==1) { // base case - single agent - give all to the single agent
		var valueFunction = valueFunctions[0];
		var landplot;
		if (yLength<=1) {
			landplot = {minx:0,maxx:1, miny:0,maxy:1};
		} else {
			var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
			var pointsInEnvelope = jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope);
			envelope.maxy = Math.max(2,envelope.maxy);
			landplot = jsts.algorithm.squareWithMaxNumOfPoints(
					pointsInEnvelope, envelope, maxAspectRatio);
		}
		return giveLandplotToSingleAgentIfValueAtLeast1(valueFunction, landplot);
	}

	// HERE: numOfAgents >= 2

	var k = numOfAgents-1;
	orderValueFunctionsByYcut(valueFunctions, assumedValue-1);
	var southAgents = valueFunctions.slice(0,k),
	    northAgent = valueFunctions[k];
	var y = northAgent.yCuts[assumedValue-1];
	TRACE(numOfAgents,"-- Partition at y="+y+": k="+k+", "+southAgents.length+" south valueFunctions and 1 north agent.");
	var south = {minx:0, maxx:1, miny:0, maxy:y};
	var southPlots = runDivisionAlgorithm(norm4Walls, (y>1? jsts.Side.South: jsts.Side.East),   southAgents, south, maxAspectRatio);
	if (southPlots.length==southAgents.length) {
		northPlot = {minx:0,maxx:1, miny:y,maxy:y+1};
		if (northAgent.color)
			northPlot.color = northAgent.color;
		southPlots.push(northPlot);
		return southPlots;
	}

	TRACE(numOfAgents,"-- No partition to 1:(n-1).");

	var plots = runDivisionAlgorithm(norm3WallsThin, /*open side=north, previous side=*/ jsts.Side.East,   valueFunctions, south, maxAspectRatio);

	return plots;
}

/**
 * Normalized 3-walls thin algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], yLength>=2
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-2
 * - Landplots may overflow the eastern border
 */
var norm3WallsThin = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents-2;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 3 Walls Thin Algorithm");

	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_next = [], yCuts_2k_minus1 = [], yCuts_2k_minus1_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_minus1_next[0] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		orderValueFunctionsByYcut(valueFunctions, v);
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_minus1_next[k] = valueFunctions[k].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = valueFunctions[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;


	// Look for a partition to two 3-walls pieces open to the east

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k_1 = yCuts_2k_minus1[k];            // the k-th (2k-1) line
		var y_2k_1_next = yCuts_2k_minus1_next[k];  // the (k+1)-th (2k-1) line
		if (1 <= y_2k_1_next && y_2k_1 <= yLength-1) {  // both North and South are 2-fat
			//var y = y_2k_1;
			var y = Math.max(y_2k_1,1);

			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};

			orderValueFunctionsByYcut(valueFunctions, 2*k-1);
			var southAgents = valueFunctions.slice(0, k),
			    northAgents = valueFunctions.slice(k, numOfAgents);
			TRACE(numOfAgents,"++ Partition to two 3-walls pieces: ["+0+","+round2(y)+"] and ["+round2(y)+","+round2(yLength)+"], k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
			var southPlots = runDivisionAlgorithm(norm3Walls, jsts.Side.West,   southAgents, south, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm3Walls, jsts.Side.West,    northAgents, north, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	TRACE(numOfAgents,"-- No partition to two 3-walls pieces: yCuts_2k_minus1="+yCuts_2k_minus1.map(round2)+", L="+round2(yLength)+", agents="+JSON.stringify(valueFunctions));
	return [];
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
