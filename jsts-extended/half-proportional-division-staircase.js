/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('../../computational-geometry');
require("./corners");
require("./rectilinear-polygon-division");
var numutils = require('../../computational-geometry/lib/numeric-utils');

var _ = require("underscore");
_.mixin(require("argminmax"));
_.mixin(require("./rainbow"));

var util = require("util");
var ValueFunction = require("./ValueFunction");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

function logValueFunctions(valueFunctions) {
	console.log(util.inspect(valueFunctions,{depth:3}));
}

function TRACE (numOfAgents, s) {
//	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_NO_LANDPLOT(valueFunctions) {
//	logValueFunctions(valueFunctions);
}


function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}

var roundFields3 = Math.roundFields.bind(0, 3);
var round2 = function(x) { 	return Math.round(x*100)/100; }

var mapOpenSidesStringToSouthernSide = {
		"01": jsts.Side.North,
		"12": jsts.Side.East,
		"23": jsts.Side.South,
		"03": jsts.Side.West,
};

var openSidesToSouthernSide = function(openSides) {
	openSides.sort();
	var openSidesString = openSides.join("");
	if (!(openSidesString in mapOpenSidesStringToSouthernSide))
		return null;
	 else
		return mapOpenSidesStringToSouthernSide[openSidesString];
};


jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = false;    // convert a single value function to multi agents with the same value
//jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = true;   // keep a single value function as a value function of a single agent

jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE = true;  // try to find division with min values decreasing from the maximum possible down to 1.
//jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE = false; // find only division with min value 1


/**
 * Find a set of axis-parallel fat rectangles representing a fair-and-square division for the valueFunctions
 *
 * @param agentsValuePoints an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented as an array of points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 *
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 *
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 *
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	var landplots = jsts.algorithm.halfProportionalDivision(agentsValuePoints, envelope, maxAspectRatio);
	var prevColor = null;
	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = (landplot.color!=prevColor?
				landplot.color:
				_.color(index++));
		prevColor = rect.color;
		rect.fill = landplot.fill;
		rect.stroke = landplot.stroke;
		return rect;
	});
};

jsts.algorithm.getOpenSides = function(envelope) {
	var openSides = [];
	if (envelope.minx==-Infinity) openSides.push(jsts.Side.West);
	if (envelope.miny==-Infinity) openSides.push(jsts.Side.South);
	if (envelope.maxx== Infinity) openSides.push(jsts.Side.East);
	if (envelope.maxy== Infinity) openSides.push(jsts.Side.North);
	return openSides;
}

/**
 * @param agentsValuePoints an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented as an array of points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 *
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 *
 * @return an array of squares, one per square per agent.
 */
jsts.algorithm.halfProportionalDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	TRACE(10,"")
	var landplots;
	var openSides = jsts.algorithm.getOpenSides(envelope);
//	TRACE(agentsValuePoints.length, "openSides="+openSides);
	if (openSides.length==0) {
		landplots = jsts.algorithm.halfProportionalDivision4Walls(agentsValuePoints, envelope, maxAspectRatio);
	} else if (openSides.length==1) {
		var openSide = openSides[0];
		landplots = jsts.algorithm.halfProportionalDivision3Walls(agentsValuePoints, envelope, maxAspectRatio, openSide);
	} else if (openSides.length==2) {
		var southernSide = openSidesToSouthernSide(openSides);
		if (southernSide==null) {
			console.warn("Two opposite sides - treating as 3 walls. envelope="+JSON.stringify(envelope));
			var openSide;
			if (!isFinite(envelope.minx)) { envelope.minx = 0; openSide = jsts.Side.East; }
			if (!isFinite(envelope.miny)) { envelope.miny = 0; openSide = jsts.Side.North; }
			console.warn("  New envelope="+JSON.stringify(envelope));
			landplots = jsts.algorithm.halfProportionalDivision3Walls(agentsValuePoints, envelope, maxAspectRatio, openSide);
		} else {
			landplots = jsts.algorithm.halfProportionalDivision2Walls(agentsValuePoints, envelope, maxAspectRatio, southernSide);
		}
	} else if (openSides.length==3) {
		var closedSide = (jsts.Side.North+jsts.Side.East+jsts.Side.South+jsts.Side.West) - (openSides[0]+openSides[1]+openSides[2]);
//		TRACE(agentsValuePoints.length, "closedSide="+closedSide);
		landplots = jsts.algorithm.halfProportionalDivision1Walls(agentsValuePoints, envelope, maxAspectRatio, /*southernSide=*/closedSide);
	} else {  // all sides are open
		var closedSide = jsts.Side.South;  // arbitrary; TEMPORARY
		landplots = jsts.algorithm.halfProportionalDivision0Walls(agentsValuePoints, envelope, maxAspectRatio, /*southernSide=*/closedSide);
	}
	landplots.forEach(roundFields3);
	return landplots;
}


jsts.algorithm.halfProportionalDivision4Walls = function(agentsValuePoints, envelope, maxAspectRatio) {
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var shorterSide = (width<=height? jsts.Side.South: jsts.Side.East);
	var valuePerAgent = 2*agentsValuePoints.length;
	return runDivisionAlgorithm(
			norm4Walls, shorterSide /* The norm4walls algorithm assumes that the southern side is shorter */,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
}

jsts.algorithm.halfProportionalDivision3Walls = function(agentsValuePoints, envelope, maxAspectRatio, openSide) {
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valuePerAgent = 2*agentsValuePoints.length - 1;
	return runDivisionAlgorithm(
			norm3Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};

jsts.algorithm.halfProportionalDivision2Walls = function(agentsValuePoints, envelope, maxAspectRatio, southernSide) {
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints);
	var valuePerAgent = 2*agentsValuePoints.length - 1;
	return runDivisionAlgorithm(
			norm2Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};

jsts.algorithm.halfProportionalDivision1Walls = function(agentsValuePoints, envelope, maxAspectRatio, closedSide) {
	var southernSide = closedSide;
	var valuePerAgent = Math.max(1, 2*agentsValuePoints.length - 2);
	return runDivisionAlgorithm(
			norm1Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};

jsts.algorithm.halfProportionalDivision0Walls = function(agentsValuePoints, envelope, maxAspectRatio, closedSide) {
	var southernSide = jsts.Side.South;
	var valuePerAgent = Math.max(1, 2*agentsValuePoints.length - 4);
	return runDivisionAlgorithm(
			norm0Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};




/************ NORMALIZATION *******************/

var runDivisionAlgorithm = jsts.algorithm.runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, allowSingleValueFunction) {
	var maxVal = jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE?
			valuePerAgent:
			1;
	var minVal = 1;
	return runDivisionAlgorithm2(normalizedDivisionFunction, southernSide,
			ValueFunction.createArray(valuePerAgent, agentsValuePoints),
			envelope, maxAspectRatio, allowSingleValueFunction,
			minVal, maxVal);
}


var runDivisionAlgorithm2 = jsts.algorithm.runDivisionAlgorithm2 = function(normalizedDivisionFunction, southernSide, valueFunctions, envelope, maxAspectRatio, allowSingleValueFunction, minVal, maxVal) {
	if (valueFunctions.length==0)
		return [];

	var rotateTransformation = {rotateQuarters: southernSide - jsts.Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});

	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	if (height<=0 && width<=0)
		throw new Error("Zero-sized envelope: "+JSON.stringify(enveloper));
	if (width<=0)
		width = height/1000;
	var scaleFactor = (isFinite(width)? 1/width: 1);
	var translateFactor =
		[isFinite(enveloper.minx)? -enveloper.minx: isFinite(enveloper.maxx)? -enveloper.maxx: 0,
		 isFinite(enveloper.miny)? -enveloper.miny: isFinite(enveloper.maxy)? -enveloper.maxy: 0];
	var yLength = height*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation =
		[rotateTransformation,
		 {translate: translateFactor},
		 {scale: scaleFactor}];

	valueFunctions = valueFunctions.map(function(valueFunction) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		var pointsInEnvelope = jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope);
		if (pointsInEnvelope.length==0)  {
			TRACE(valueFunctions.length, " -- No points from "+JSON.stringify(valueFunction)+" are in envelope "+JSON.stringify(envelope));
			return null;
		} else {
			return valueFunction.cloneWithNewPoints(
					pointsInEnvelope.map(jsts.algorithm.transformedPoint.bind(0,transformation)));
		}
	});
	valueFunctions = valueFunctions.filter(function(x){return x}); // remove null elements

	if (valueFunctions.length==0)
		return [];

	if (valueFunctions.length>1 || allowSingleValueFunction)  {  // subjective valuations
		var landplots = [];

		for (var requiredLandplotValue=maxVal; requiredLandplotValue>=minVal; requiredLandplotValue--) {
			if (maxVal>minVal) TRACE(10, ":: Trying "+requiredLandplotValue+" value per agent: ");
			landplots = normalizedDivisionFunction(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue);
			if (!landplots)
				throw new Error("no landplots returned")
			if (landplots.length==valueFunctions.length) {
				if (!landplots.minValuePerAgent)
					landplots.minValuePerAgent = requiredLandplotValue;
				break;
			} else {
				delete landplots.minValuePerAgent;
			}
		}
	} else {   // identical valuations
		var valueFunction = valueFunctions[0];
		var valuePerAgent = valueFunction.points.length-1;

		var commonRequiredLandplotValue = 1;
		var maxNumOfAgents = valueFunction.points.length;
		var valueFunctions = [];
		for (var i=0; i<maxNumOfAgents; ++i)
			valueFunctions.push(valueFunction);

		while (valueFunctions.length>0) {
			TRACE(10, ":: Trying "+valueFunctions.length+" agents: ");
			valueFunction.setTotalValue(valuePerAgent);
			landplots = normalizedDivisionFunction(valueFunctions, yLength, maxAspectRatio, commonRequiredLandplotValue);
			if (landplots.length==valueFunctions.length) {
				landplots.minValuePerAgent = commonRequiredLandplotValue;
				break;
			}
			valueFunctions.pop();
		}
	}

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));

	return landplots;
}



var factory = new jsts.geom.GeometryFactory();


/**
 * Normalized 4-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n
 */
var norm4Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var initial = factory.createSimpleRectilinearPolygon([{x:0,y:0}, {x:0,y:1}, {x:1,y:1}, {x:1,y:0}, {x:0,y:0}]);
	return jsts.algorithm.rectilinearPolygonDivision(valueFunctions, initial, requiredLandplotValue);
		// defined in a separate file rectilinear-polygon-division.js
}




/**
 * Normalized 3-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern border
 */
var norm3Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var initial = [{y:0,minx:0,maxx:1}];  // levels
//	return staircase3walls_allCoveringRectangles(valueFunctions, initial, requiredLandplotValue);
	return staircase3walls_cornerSquares(valueFunctions, initial, requiredLandplotValue);
}



/**
 * Normalized 3-walls staircase algorithm.
 * Each agent can draw squares in *all* 2k southern corners of *all* k covering squares.
 *
 * - valueFunctions.length>=1
 * - levels.length >= 1; each level is represented by {y,minx,maxx}.
 * - levels are ordered by non-decreasing x value, from west to east.
 * - Value per agent: at least 2*n-2+levels.length
 */
var staircase3walls_allCoveringRectangles = function recurse(valueFunctions, levels, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfLevels = levels.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 3-walls staircase algorithm with "+numOfLevels+" levels: "+JSON.stringify(levels));

	var rectangles = jsts.algorithm.rectanglesCoveringSouthernLevels(levels);

	// for each agent, calculate all level squares with value 1:
	valueFunctions.forEach(function(valueFunction) {
		var levelSquares = [];

		for (var i=0; i<rectangles.length; ++i) {
			var rectangle = rectangles[i];
			var minx=rectangle.minx, maxx=rectangle.maxx, miny=rectangle.miny;
			var squareSizeEast = valueFunction.sizeOfSquareWithValue({x:minx,y:miny}, requiredLandplotValue, "NE");
			var squareSizeWest = valueFunction.sizeOfSquareWithValue({x:maxx,y:miny}, requiredLandplotValue, "NW");

			if (minx+squareSizeEast <= maxx)
				levelSquares.push({minx:minx, miny:miny, maxx:minx+squareSizeEast, maxy:miny+squareSizeEast});

			if (maxx-squareSizeWest >= minx)
				levelSquares.push({maxx:maxx, miny:miny, minx:maxx-squareSizeWest, maxy:miny+squareSizeWest});
		}

		valueFunction.square = _.min(levelSquares, function(square){return square.maxy});
	});

	// get the agent with the square with the smallest height overall:
	var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
		return valueFunction.square.maxy;
	});
	var winningAgent = valueFunctions[iWinningAgent];
	var winningSquare = winningAgent.square;

	if (!winningSquare || !isFinite(winningSquare.maxy)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	}

	var landplot = winningSquare;
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingLevels = jsts.algorithm.updatedLevels(levels, landplot, "S");
	var remainingLandplots = recurse(remainingValueFunctions, remainingLevels, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




/**
 * Normalized 3-walls staircase algorithm - alternative algorithm:
 * Each agent can draw squares only in knobs or the original polygon, or in corners or the original polygon after knobs with no squares have been removed.
 *
 * - valueFunctions.length>=1
 * - levels.length >= 1; each level is represented by {y,minx,maxx}.
 * - levels are ordered by non-decreasing x value, from west to east.
 * - Value per agent: at least 2*n-2+levels.length
 */
var staircase3walls_cornerSquares = function recurse(valueFunctions, levels, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfLevels = levels.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 3-walls staircase algorithm with "+numOfLevels+" levels: "+JSON.stringify(levels));
	jsts.algorithm.addPropertiesToLevels(levels);    // Add to each level the properties: "yWest", "yEast", "isKnob", "westMinx", "eastMaxx"

	var winningSquaresInLevels = [];

	// Bid for squares in all knobs; Remove all knobs with no square:
	for (var iLevel=0; iLevel<levels.length; ++iLevel) {
		var level = levels[iLevel];
		if (!level.isKnob || level.squares)
			continue;

		// HERE we found a knob with no squares yet:
		calculateLevelSquares(valueFunctions, level, requiredLandplotValue);

		if (level.squares.length==0) {
			// HERE no one wants a square in the current knob so we can remove it:
			TRACE(numOfAgents,"  level "+JSON.stringify(level)+": no agent wants a square - removing level");
			jsts.algorithm.removeLevel(levels, iLevel);
			iLevel = -1;  // structure has changed - start looping again
		} else {
			// HERE some agents want squares in the current knob - find the lowest one:
			var lowestSquareInLevel = _.min(level.squares, function(square){return square.maxy});
			winningSquaresInLevels.push(lowestSquareInLevel);
			TRACE(numOfAgents,"  level "+JSON.stringify(level)+": winning square is "+JSON.stringify(lowestSquareInLevel));
		}
	}

	// Bid for corner squares in all other levels (non-knobs);
	for (var iLevel=0; iLevel<levels.length; ++iLevel) {
		var level = levels[iLevel];
		if (level.squares)
			continue;
		calculateLevelSquares(valueFunctions, level, requiredLandplotValue);
		if (level.squares.length==0) {  // do nothing
		} else {
			var lowestSquareInLevel = _.min(level.squares, function(square){return square.maxy});
			winningSquaresInLevels.push(lowestSquareInLevel);
			TRACE(numOfAgents,"  level "+JSON.stringify(level)+": winning square is "+JSON.stringify(lowestSquareInLevel));
		}
	}

	if (winningSquaresInLevels.length==0) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(util.inspect(valueFunctions,{depth:3}));
		return [];
	}

	// get the agent with the square with the smallest height overall:
	var landplot = _.min(winningSquaresInLevels, function(square){return square.maxy});
	var iWinningAgent = landplot.iAgent;
	delete landplot.iAgent;
	var winningAgent = valueFunctions[iWinningAgent];

	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingLevels = jsts.algorithm.updatedLevels(levels, landplot, "S");
	for (var iLevel=0; iLevel<remainingLevels.length; ++iLevel)
		delete remainingLevels[iLevel].squares;
	var remainingLandplots = recurse(remainingValueFunctions, remainingLevels, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




var calculateLevelSquares = function(valueFunctions, level, requiredLandplotValue) {
	level.squares = [];
	var minx=level.minx, maxx=level.maxx, miny=level.y;
	if (level.yWest>level.y) {  // western corner is convex - bid for squares
		var swCorner = {x:minx,y:miny};
		for (var iAgent=0; iAgent<valueFunctions.length; ++iAgent) {
			var valueFunction = valueFunctions[iAgent];
			var squareSizeEast = valueFunction.sizeOfSquareWithValue(swCorner, requiredLandplotValue, "NE");
			if (minx+squareSizeEast <= maxx)
				level.squares.push({minx:minx, miny:miny, maxx:minx+squareSizeEast, maxy:miny+squareSizeEast, iAgent:iAgent});
		}
	}
	if (level.yEast>level.y) {  // eastern corner is convex - bid for squares
		var seCorner = {x:maxx,y:miny};
		for (var iAgent=0; iAgent<valueFunctions.length; ++iAgent) {
			var valueFunction = valueFunctions[iAgent];
			var squareSizeWest = valueFunction.sizeOfSquareWithValue(seCorner, requiredLandplotValue, "NW");
			if (maxx-squareSizeWest >= minx)
				level.squares.push({maxx:maxx, miny:miny, minx:maxx-squareSizeWest, maxy:miny+squareSizeWest, iAgent:iAgent});
		};
	}
}





/**
 * Normalized 2-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,inf]x[0,inf]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern and/or the eastern borders
 */
var norm2Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var origin = {x:0,y:0};
	return staircase2walls(valueFunctions, origin, [origin], requiredLandplotValue);
}

/**
 * Normalized staircase algorithm:
 * - valueFunctions.length>=1
 * - corners.length >= 1
 * - corners are ordered by increasing y = decreasing x (from south-east to north-west)
 * - Value per agent: at least 2*n-2+corners.length
 */
var staircase2walls = function recurse(valueFunctions, origin, corners, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfCorners = corners.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 2-walls staircase algorithm with "+numOfCorners+" corners: "+JSON.stringify(corners));

	// for each agent, calculate the acceptable corner square with the smallest taxicab distance from the origin:
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.square = jsts.algorithm.cornerSquareWithMinTaxicabDistance(valueFunction, corners, requiredLandplotValue, "NE", origin)
	});

	// get the agent with the square with the smallest taxicab distance overall:
	var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
		return valueFunction.square.t;
	});
	var winningAgent = valueFunctions[iWinningAgent];

	if (winningAgent===Infinity) winningAgent = {square:{t:Infinity}};  // bug in _.min

	if (!isFinite(winningAgent.square.t)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	}

	var landplot = {
			minx: winningAgent.square.x,
			miny: winningAgent.square.y,
			maxx: winningAgent.square.x+winningAgent.square.s,
			maxy: winningAgent.square.y+winningAgent.square.s,
	};
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets from the square "+JSON.stringify(winningAgent.square)+" the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingCorners = jsts.algorithm.updatedCornersNorthEast(corners, landplot);
	var remainingLandplots = recurse(remainingValueFunctions, origin, remainingCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




/**
 * Partition the agents to western and eastern agents according to their value functions.
 * @return [westernValueFunctions, easternValueFunctions]
 */
var partitionEastWest  = function(valueFunctions, totalValue, numOfWesternAgents) {
	if (!totalValue)
		throw new Error("totalValue is 0");
	var FARWEST = {x:-400,y:0}, FAREAST={x:800,y:0};
	var numOfAgents = valueFunctions.length;
	var numOfEasternAgents = numOfAgents-numOfWesternAgents;

	if (numOfWesternAgents==0)
		return [[], FARWEST.x, valueFunctions];
	else if (numOfEasternAgents==0)
		return [valueFunctions, FAREAST.x, []];

	var westValue = totalValue*(numOfWesternAgents/numOfAgents);
	var eastValue = totalValue-westValue;

	for (var i=0; i<numOfAgents; ++i) {
		delete valueFunctions[i].yCuts;
		if (valueFunctions[i].points.length==0) { // no points
			TRACE(numOfAgents, " -- No value points for agent "+i);
			TRACE_NO_LANDPLOT(valueFunctions);
			return [];
		}
		var westPartitionPoint = FARWEST.x + valueFunctions[i].sizeOfSquareWithValue(FARWEST, westValue, 'NE');
		var eastPartitionPoint = FAREAST.x - valueFunctions[i].sizeOfSquareWithValue(FAREAST, eastValue, 'NW');
		valueFunctions[i].partitionPoint = (westPartitionPoint+eastPartitionPoint)/2;
	}

	valueFunctions.sort(function(a,b){return a.partitionPoint-b.partitionPoint});

	var westernValueFunctions = valueFunctions.slice(0, numOfWesternAgents);
	var easternValueFunctions = valueFunctions.slice(numOfWesternAgents, numOfAgents);
	var partitionPoint = (westernValueFunctions[westernValueFunctions.length-1].partitionPoint+easternValueFunctions[0].partitionPoint)/2;

	TRACE(numOfAgents, " -- Partitioning at x="+partitionPoint+", giving the west to "+_.pluck(westernValueFunctions,"color")+" with partition points "+_.pluck(westernValueFunctions,"partitionPoint")+" and the east to "+_.pluck(easternValueFunctions,"color")+" with partition points "+_.pluck(easternValueFunctions,"partitionPoint"));

	return [westernValueFunctions, partitionPoint, easternValueFunctions];
}



/**
 * @return [westernValueFunctions, easternValueFunctions]
 */
var halvingEastWest  = function(valueFunctions, totalValue) {
	var numOfAgents = valueFunctions.length;
	if (numOfAgents%2==0) {
		numOfWesternAgents = numOfAgents/2;
	} else {
		numOfWesternAgents = (numOfAgents+1)/2;
	}

	return partitionEastWest(valueFunctions, totalValue, numOfWesternAgents);
}


/**
 * Normalized 1-wall algorithm using an initial halving and then 2 calls to the 2-walls algorithm.
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Landplots may overflow the east, west and north borders
 */
var norm1Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" with 1 wall");

	if (numOfAgents<=1) {
		var valueFunction = valueFunctions[0];
		var minx = _.min(valueFunction.points, function(point){return point.x});
		var maxx = _.max(valueFunction.points, function(point){return point.x});
		var landplot = {
				minx: minx,
				miny: 0,
				maxx: maxx,
				maxy: maxx-minx,
		};
		var landplots = [landplot];
		landplots.minValuePerAgent = valueFunction.totalValue;
		return landplots;
	}

	var totalValue = valueFunctions[0].totalValue;
	for (var numOfWesternAgents=0; numOfWesternAgents<numOfAgents; ++numOfWesternAgents) {
		var numOfEasternAgents = numOfAgents - numOfWesternAgents;

		TRACE(numOfAgents, " :: Trying "+numOfWesternAgents+" western agents");
		var partition = partitionEastWest(valueFunctions, totalValue, numOfWesternAgents);
		var westernValueFunctions = partition [0];
		var partitionPoint = partition [1];
		var easternValueFunctions = partition [2];
		var westernLandplots = numOfWesternAgents>0? runDivisionAlgorithm2(
				norm2Walls,
				jsts.Side.East,
				westernValueFunctions,
				new jsts.geom.Envelope(-Infinity,partitionPoint, 0,Infinity),
				maxAspectRatio, /*allow single value function = */true,
				requiredLandplotValue, requiredLandplotValue): [];
		var easternLandplots = numOfEasternAgents>0? runDivisionAlgorithm2(
				norm2Walls,
				jsts.Side.South,
				easternValueFunctions,
				new jsts.geom.Envelope(partitionPoint,Infinity, 0,Infinity),
				maxAspectRatio, /*allow single value function = */true,
				requiredLandplotValue, requiredLandplotValue): [];
		var allLandplots = westernLandplots.concat(easternLandplots);
		allLandplots.minValuePerAgent = Math.min(westernLandplots.minValuePerAgent||0, easternLandplots.minValuePerAgent||0);
		if (allLandplots.length>=numOfAgents && allLandplots.minValuePerAgent>=requiredLandplotValue)
			return allLandplots;
	}
	return [];
}

/**
 * Normalized 0-wall algorithm using an initial halving and then 2 calls to the 1-wall algorithm.
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Landplots may overflow all borders.
 */
var norm0Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" with 0 walls");

	if (numOfAgents<=1) {
		var valueFunction = valueFunctions[0];
		var minx = _.min(valueFunction.points, function(point){return point.x});
		var maxx = _.max(valueFunction.points, function(point){return point.x});
		var miny = _.min(valueFunction.points, function(point){return point.y});
		var maxy = _.max(valueFunction.points, function(point){return point.y});
		if (maxy-miny<maxx-minx)
			maxy = miny+(maxx-minx)
		else
			maxx = minx+(maxy-miny)
		var landplot = {
				minx: minx,
				miny: miny,
				maxx: maxx,
				maxy: maxy,
		};
		var landplots = [landplot];
		landplots.minValuePerAgent = valueFunction.totalValue;
		return landplots;
	}

	var halving = halvingEastWest(valueFunctions, valueFunctions[0].totalValue);
		var westernValueFunctions = halving[0];
		var halvingPoint = halving[1];
		var easternValueFunctions = halving[2];

	var westernLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.East,
			westernValueFunctions,
			new jsts.geom.Envelope(-Infinity,halvingPoint, -Infinity,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	var easternLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.West,
			easternValueFunctions,
			new jsts.geom.Envelope(halvingPoint,Infinity, -Infinity,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	var halvingLandplots = westernLandplots.concat(easternLandplots);
	halvingLandplots.minValuePerAgent = Math.min(westernLandplots.minValuePerAgent||0, easternLandplots.minValuePerAgent||0);

	TRACE(numOfAgents, " -- Trying to put everyone at the west");
	var westernOpenLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.East,
			valueFunctions,
			new jsts.geom.Envelope(-Infinity,400, -Infinity,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	TRACE(numOfAgents, " -- Trying to put everyone at the east");
	var easternOpenLandplots = runDivisionAlgorithm2(
			norm2Walls,
			jsts.Side.West,
			valueFunctions,
			new jsts.geom.Envelope(0,Infinity, -Infinity,Infinity),
			maxAspectRatio, /*allow single value function = */true);

	TRACE(numOfAgents, " -- Trying to put everyone at the north");
	var southernOpenLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.East,
			valueFunctions,
			new jsts.geom.Envelope(-Infinity,Infinity, 0,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	TRACE(numOfAgents, " -- Trying to put everyone at the south");
	var northernOpenLandplots = runDivisionAlgorithm2(
			norm2Walls,
			jsts.Side.West,
			valueFunctions,
			new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,400),
			maxAspectRatio, /*allow single value function = */true);

	return _.max(
		[halvingLandplots, easternOpenLandplots, westernOpenLandplots, southernOpenLandplots, northernOpenLandplots],
		function(landplots){return landplots.minValuePerAgent});
}





/**
 * Normalized 1-wall algorithm:
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the east, west and north borders
 */
var norm1Walls_old = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	//var initialCorners = [{x:-800,y:Infinity}, {x:-800,y:0}, {x:800,y:0}, {x:800,y:Infinity}];
	//return staircase3walls(valueFunctions, initialCorners, requiredLandplotValue);
	var bestLandplots = [];
	for (var x=0; x<=400; x+=10) {
		var origin = {x:x,y:0};
		var landplots = staircase1walls(valueFunctions, origin, [origin], [origin], requiredLandplotValue);
		if (landplots.length>bestLandplots.length)
			bestLandplots = landplots;
	}
	return bestLandplots;
}

/**
 * Normalized staircase algorithm:
 * - valueFunctions.length>=1
 * - corners.length >= 1
 * - corners are ordered by increasing y = decreasing x (from south-east to north-west)
 * - Value per agent: at least 2*n-2+corners.length
 */
var staircase1walls = function(valueFunctions, origin, westCorners, eastCorners, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 1-wall staircase algorithm with origin="+JSON.stringify(origin)+" westCorners="+JSON.stringify(westCorners)+" eastCorners="+JSON.stringify(eastCorners));

	// for each agent, calculate the acceptable corner square with the smallest taxicab distance from the origin:
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.eastSquare = jsts.algorithm.cornerSquareWithMinTaxicabDistance(valueFunction, eastCorners, requiredLandplotValue, "NE", origin);
		valueFunction.westSquare = jsts.algorithm.cornerSquareWithMinTaxicabDistance(valueFunction, westCorners, requiredLandplotValue, "NW", origin);
	});

	// get the agent with the square with the smallest taxicab distance overall:
	var eastWinningAgent = _.min(valueFunctions, function(valueFunction) {
		return valueFunction.eastSquare.t;
	});
	if (eastWinningAgent===Infinity) eastWinningAgent = {eastSquare:{t:Infinity}};  // bug in _.min

	var westWinningAgent = _.min(valueFunctions, function(valueFunction) {
		return valueFunction.westSquare.t;
	});
	if (westWinningAgent===Infinity) westWinningAgent = {westSquare:{t:Infinity}};  // bug in _.min

	if (!isFinite(eastWinningAgent.eastSquare.t) && !isFinite(westWinningAgent.westSquare.t)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	} else if (eastWinningAgent.eastSquare.t<westWinningAgent.westSquare.t) {
		var winningAgent = eastWinningAgent;
		var winningSquare = winningAgent.eastSquare;
		var landplot = {
				minx: winningSquare.x,
				miny: winningSquare.y,
				maxx: winningSquare.x+winningSquare.s,
				maxy: winningSquare.y+winningSquare.s,
		};
		var remainingEastCorners = jsts.algorithm.updatedCornersNorthEast(eastCorners, landplot);
		var remainingWestCorners = westCorners;
	} else {
		var winningAgent = westWinningAgent;
		var winningSquare = winningAgent.westSquare;
		var landplot = {
				minx: winningSquare.x-winningSquare.s,
				miny: winningSquare.y,
				maxx: winningSquare.x,
				maxy: winningSquare.y+winningSquare.s,
		};
		var remainingWestCorners = jsts.algorithm.updatedCornersNorthWest(westCorners, landplot);
		var remainingEastCorners = eastCorners;
	}

	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+winningAgent.index+" gets from the square "+JSON.stringify(winningSquare)+" the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,winningAgent.index).concat(valueFunctions.slice(winningAgent.index+1,valueFunctions.length));
	var remainingLandplots = staircase1walls(remainingValueFunctions, origin, remainingWestCorners, remainingEastCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




/// TEMP


var norm1WallsTemp = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var valueFunction = valueFunctions[0];
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 1 Wall Algorithm");
	TRACE_NO_LANDPLOT(valueFunctions);

	var landplots = [];
	var previousSquare = null;
	var iColor = 0;
	var previousSize = Infinity;
	for (var x=-390; x<=390; x+=10) {
		var size = valueFunction.sizeOfSquareWithValue({x:x,y:0}, 2*valueFunction.valuePerPoint, 'NE');
		if (size>previousSize)
			iColor++;
		previousSize = size;

		if (!isFinite(size)) continue;

		var square = {minx:x,maxx:x+size, miny:0,maxy:size};
		var containedInPrevious = (previousSquare && square.maxx<=previousSquare.maxx && square.maxy<=previousSquare.maxy);
		if (containedInPrevious) {
			previousSquare.fill='transparent';
		}

		square.fill = square.stroke = _.color(iColor);
		landplots.push(square);
		previousSquare = square;
	}
	return landplots;
}

jsts.algorithm.mapOpenSidesToNormalizedAlgorithm = [];
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[0] = (norm4Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[1] = (norm3Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[2] = (norm2Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[3] = (norm1Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[4] = (norm0Walls);
