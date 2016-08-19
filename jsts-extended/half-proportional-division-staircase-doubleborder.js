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
require("./corners");
var numutils = require("./numeric-utils")

var _ = require("underscore");
_.mixin(require("argminmax"));

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


jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = false;  // convert a single value function to multi agents with the same value
//jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = true;   // keep a single value function as a value function of a single agent


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
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	var landplots = jsts.algorithm.halfProportionalDivision(agentsValuePoints, envelope, maxAspectRatio);
	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = landplot.color;
		rect.fill = landplot.fill;
		rect.stroke = landplot.stroke;
		return rect;
	});
};

jsts.algorithm.halfProportionalDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	TRACE(10,"")
	var landplots;
	var openSides = [];
	if (envelope.minx==-Infinity) openSides.push(jsts.Side.West);
	if (envelope.miny==-Infinity) openSides.push(jsts.Side.South);
	if (envelope.maxx== Infinity) openSides.push(jsts.Side.East);
	if (envelope.maxy== Infinity) openSides.push(jsts.Side.North);
	if (openSides.length==0) {
		landplots = jsts.algorithm.halfProportionalDivision4Walls(agentsValuePoints, envelope, maxAspectRatio);
	} else if (openSides.length==1) {
		var openSide = openSides[0];
		landplots = jsts.algorithm.halfProportionalDivision3Walls(agentsValuePoints, envelope, maxAspectRatio, openSide);
	} else if (openSides.length==2) {
		openSides.sort();
		var openSidesString = openSides.join("");
		var mapOpenSidesStringToSouthernSide = {
			"01": jsts.Side.North,
			"12": jsts.Side.East,
			"23": jsts.Side.South,
			"03": jsts.Side.West,
		}
		if (!(openSidesString in mapOpenSidesStringToSouthernSide)) {
			console.warn("Two opposite sides - treating as 3 walls "+JSON.stringify(envelope));
			landplots = jsts.algorithm.halfProportionalDivision3Walls(agentsValuePoints, envelope, maxAspectRatio, openSides[0]);
		} else {
			var southernSide = mapOpenSidesStringToSouthernSide[openSidesString];
			landplots = jsts.algorithm.halfProportionalDivision2Walls(agentsValuePoints, envelope, maxAspectRatio, southernSide);
		}
	} else if (openSides.length==3) {
		var closedSide = (jsts.Side.North+jsts.Side.East+jsts.Side.South+jsts.Side.West) - (openSides[0]+openSides[1]+openSides[2]);
		landplots = jsts.algorithm.halfProportionalDivision1Walls(agentsValuePoints, envelope, maxAspectRatio, /*southernSide=*/closedSide);
	} else {  // all sides are open
		var closedSide = jsts.Side.South;  // arbitrary; TEMPORARY
		landplots = jsts.algorithm.halfProportionalDivision1Walls(agentsValuePoints, envelope, maxAspectRatio, /*southernSide=*/closedSide);
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
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio);
}

jsts.algorithm.halfProportionalDivision3Walls = function(agentsValuePoints, envelope, maxAspectRatio, openSide) {
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valuePerAgent = 2*agentsValuePoints.length - 1;
	return runDivisionAlgorithm(
			norm3Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio);
};

jsts.algorithm.halfProportionalDivision2Walls = function(agentsValuePoints, envelope, maxAspectRatio, southernSide) {
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints);
	var valuePerAgent = 2*agentsValuePoints.length - 1;
	return runDivisionAlgorithm(
			norm2Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio);
};

jsts.algorithm.halfProportionalDivision1Walls = function(agentsValuePoints, envelope, maxAspectRatio, closedSide) {
	var southernSide = closedSide;
	var valuePerAgent = 2*agentsValuePoints.length - 2;
	return runDivisionAlgorithm(
			norm1Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio);
};




/************ NORMALIZATION *******************/

var runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valuePerAgent, agentsValuePoints, envelope, maxAspectRatio) {
	if (agentsValuePoints.length==0)
		return [];
	if (!maxAspectRatio) maxAspectRatio=1;

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

	var index = 0;
	var transformedValuePoints = agentsValuePoints.map(function(points) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		var newPoints = 	jsts.algorithm.pointsInEnvelope(points, envelope)
			.map(jsts.algorithm.transformedPoint.bind(0,transformation));
		newPoints.color = points.color;
		newPoints.index = index++;  // remember the index of the agent; it is used by the normalized functions for keeping track of who already got a land-plot
		return newPoints;
	});

	if (transformedValuePoints.length>1 || jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION)  {  // subjective valuations
		var transformedValueFunctions = ValueFunction.createArray(valuePerAgent, transformedValuePoints);
		//console.log("pointsPerUnitValue="+_.pluck(transformedValueFunctions,'pointsPerUnitValue'));
		var maxVal = valuePerAgent;
		var minVal = 1;
		var landplots = [];
		for (var requiredLandplotValue=maxVal; requiredLandplotValue>=minVal; requiredLandplotValue--) {
			landplots = normalizedDivisionFunction(transformedValueFunctions, yLength, maxAspectRatio, requiredLandplotValue);
			if (landplots.length==transformedValueFunctions.length)
				break;
		}
	} else {   // identical valuations
		var valuePoints = transformedValuePoints[0];
		valuePerAgent = valuePoints.length-1;
		requiredLandplotValue = 1;
		var transformedValueFunction = ValueFunction.create(valuePerAgent, valuePoints);

		var maxNumOfAgents = valuePoints.length;
		var transformedValueFunctions = [];
		for (var i=0; i<maxNumOfAgents; ++i)
			transformedValueFunctions.push(transformedValueFunction);

		while (transformedValueFunctions.length>0) {
			landplots = normalizedDivisionFunction(transformedValueFunctions, yLength, maxAspectRatio, requiredLandplotValue);
			if (landplots.length==transformedValueFunctions.length)
				break;
			transformedValueFunctions.pop();
		}
	}

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));

	return landplots;
}





/**
 * Normalized 4-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n
 */
var norm4Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	//var initial = [{x:0,y:Infinity}, {x:0,y:0}, {x:1,y:0}, {x:1,y:Infinity}];  // corners
	var initial = [{y:0,minx:0,maxx:1}];  // levels
	return staircase4walls(yLength, valueFunctions, initial, requiredLandplotValue);
}


/**
 * Normalized 4-walls staircase algorithm:
 * - valueFunctions.length>=1
 * - levels.length >= 1; each level is represented by {y,minx,maxx}.
 * - levels are ordered by non-decreasing x value, from west to east.
 * - Value per agent: at least 2*n-2+levels.length
 */
var staircase4walls = function(yLength, valueFunctions, levels, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfLevels = levels.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 4-walls staircase algorithm with yLength="+yLength+" and "+numOfLevels+" levels: "+JSON.stringify(levels));

	var rectangles = jsts.algorithm.rectanglesCoveringSouthernLevels(levels);

	var squaresFound = false;

	// for each agent, calculate all level squares with value 1:
	valueFunctions.forEach(function(valueFunction) {
		var levelSquares = [];

		for (var i=0; i<rectangles.length; ++i) {
			var rectangle = rectangles[i];
			var minx=rectangle.minx, maxx=rectangle.maxx, miny=rectangle.miny;
			var squareSizeEast = valueFunction.sizeOfSquareWithValue({x:minx,y:miny}, requiredLandplotValue, "NE");
			var squareSizeWest = valueFunction.sizeOfSquareWithValue({x:maxx,y:miny}, requiredLandplotValue, "NW");

			if (minx+squareSizeEast <= maxx && miny+squareSizeEast<=yLength/2)
				levelSquares.push({minx:minx, miny:miny, maxx:minx+squareSizeEast, maxy:miny+squareSizeEast});

			if (maxx-squareSizeWest >= minx && miny+squareSizeWest<=yLength/2)
				levelSquares.push({maxx:maxx, miny:miny, minx:maxx-squareSizeWest, maxy:miny+squareSizeWest});
		}
		if (levelSquares.length>0) {
			squaresFound = true;
			valueFunction.square = 	_.min(levelSquares, function(square){return square.maxy});
		} else {
			valueFunction.square = {maxy:Infinity};
		}
	});

	if (squaresFound) {
		// get the agent with the square with the smallest height overall:
		var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
			return valueFunction.square.maxy;
		});
		var winningAgent = valueFunctions[iWinningAgent];

		if (!winningAgent.square || !isFinite(winningAgent.square.maxy)) {
			TRACE(numOfAgents, "-- no southern square with the required value "+requiredLandplotValue);
			if (requiredLandplotValue<=1)
				console.log(util.inspect(valueFunctions,{depth:3}));
			return [];
		}

		var landplot = winningAgent.square;
		if (winningAgent.color) landplot.color = winningAgent.color;
		TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the southern landplot "+JSON.stringify(landplot));

		if (valueFunctions.length==1)
			return [landplot];

		var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
		var remainingLevels = jsts.algorithm.updatedLevels(levels, landplot,"S");
		var remainingLandplots = staircase4walls(yLength, remainingValueFunctions, remainingLevels, requiredLandplotValue);
		remainingLandplots.push(landplot);
		return remainingLandplots;
	} else {
		var newLevels = [{y:yLength,minx:0,maxx:1}]
		return staircase4wallsNorth(yLength, valueFunctions, newLevels, requiredLandplotValue);
	}
}

var staircase4wallsNorth = function(yLength, valueFunctions, levels, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfLevels = levels.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 4-walls staircase algorithm from the north, with yLength="+yLength+" and "+numOfLevels+" levels: "+JSON.stringify(levels));

	// No squares found at the south - try to divide from the north:
	rectangles = jsts.algorithm.rectanglesCoveringNorthernLevels(levels);

	squaresFound = false;

	// for each agent, calculate all level squares with value 1:
	valueFunctions.forEach(function(valueFunction) {
		var levelSquares = [];

		for (var i=0; i<rectangles.length; ++i) {
			var rectangle = rectangles[i];
			var minx=rectangle.minx, maxx=rectangle.maxx, maxy=rectangle.maxy;
			var squareSizeEast = valueFunction.sizeOfSquareWithValue({x:minx,y:maxy}, requiredLandplotValue, "SE");
			var squareSizeWest = valueFunction.sizeOfSquareWithValue({x:maxx,y:maxy}, requiredLandplotValue, "SW");

			if (minx+squareSizeEast <= maxx && maxy-squareSizeEast>=yLength/2)
				levelSquares.push({minx:minx, maxy:maxy, maxx:minx+squareSizeEast, miny:maxy-squareSizeEast});

			if (maxx-squareSizeWest >= minx && maxy-squareSizeWest>=yLength/2)
				levelSquares.push({maxx:maxx, maxy:maxy, minx:maxx-squareSizeWest, miny:maxy-squareSizeWest});
		}
		if (levelSquares.length>0) {
			squaresFound = true;
			valueFunction.square = 	_.max(levelSquares, function(square){return square.miny});
		} else {
			valueFunction.square = {miny:-Infinity};
		}
	});

	if (!squaresFound) {
		TRACE(numOfAgents, "-- no northern square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			console.log(util.inspect(valueFunctions,{depth:3}));
		return [];
	}

	// get the agent with the square with the smallest height overall:
	var iWinningAgent = _.argmax(valueFunctions, function(valueFunction) {
		return valueFunction.square.miny;
	});
	var winningAgent = valueFunctions[iWinningAgent];

	var landplot = winningAgent.square;
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the northern landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingLevels = jsts.algorithm.updatedLevels(levels, landplot, "N");
	var remainingLandplots = staircase4wallsNorth(yLength, remainingValueFunctions, remainingLevels, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;

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
	var origin_sw = {x:0,y:0}, origin_se = {x:1,y:0};
	return staircase3walls_double2walls(valueFunctions, origin_sw, [origin_sw], origin_se, [origin_se], requiredLandplotValue);
}



/**
 * @param b,a two corner squares near the *same* origin, represented by the fields: x, y, dx, dy, s, t.
 * @returns true if square b puts a shadow over square a.
 */
function shadowsSameOrigin(b,a) {
	if (b.dy > a.dy+a.s  &&  b.dx+b.s > a.dx) return true;  // a.dx > b.dx
	if (b.dx > a.dx+a.s  &&  b.dy+b.s > a.dy) return true;  // a.dy > b.dy

	if (b.dy > a.dy  &&  b.dx+b.s > a.dx+a.ds) return true;  // a.dx > b.dx
	if (b.dx > a.dx  &&  b.dy+b.s > a.dy+a.s) return true;   // a.dy > b.dy

	return false;
}


/**
 * @param b,a two corner squares near the *same* origin, represented by the fields: x, y, dx, dy, s, t.
 * @returns true if square b puts a shadow over square a.
 */
function shadowsDifferentOrigin(b,a) {
	if (b.dy+b.s > a.dy+a.s) return true;

	return false;
}

function shadows(b,a) {
	return b.direction==a.direction?
			shadowsSameOrigin(b,a):
			shadowsDifferentOrigin(b,a);
}


/**
 * @param b a square.
 * @param squares a list of squares.
 * @return a square from the list, that is shadowed by b; or "null" if none found.
 */
function findShadowed(b, squares) {
	for (var i=0; i<squares.length; ++i) {
		var a = squares[i];
		if (shadows(b, a))
			return a;
	}
	return null;
}

/**
 * Normalized staircase algorithm, using two 2-walls algorithm. DOESN'T WORK!
 * - valueFunctions.length>=1
 * - corners.length >= 1
 * - corners are ordered by increasing y = decreasing x (from south-east to north-west)
 * - Value per agent: at least 2*n-2+corners.length
 */
var staircase3walls_double2walls = function(valueFunctions, origin_sw, corners_sw, origin_se, corners_se, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 2-walls staircase algorithm with "+corners_sw.length+" SW corners: "+JSON.stringify(corners_sw)+" and "+corners_se.length+" SE corners: "+JSON.stringify(corners_se));
	if (corners_se.length==0 && corners_sw.length==0)
		throw new Error("no corners!");

	// for each corner, calculate the smallest square of any agent:
	var cornerSquares_sw = jsts.algorithm.smallestCornerSquares(valueFunctions, corners_sw, requiredLandplotValue, "NE", origin_sw, [{x:0,y:-0.001}].concat(corners_se).concat([{x:1,y:1.001}]));
	var cornerSquares_se = jsts.algorithm.smallestCornerSquares(valueFunctions, corners_se, requiredLandplotValue, "NW", origin_se, [{x:1,y:-0.001}].concat(corners_sw).concat([{x:0,y:1.001}]));
	var allCornerSquares = cornerSquares_sw.concat(cornerSquares_se);
	if (allCornerSquares.length==0) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			console.dir(valueFunctions);
		return [];
	}

	var currentSquare = allCornerSquares[0];
	for (;;) {
		currentSquare.visited = true;
		var shadowedByCurrentSquare = findShadowed(currentSquare, allCornerSquares);
		if (shadowedByCurrentSquare) {
			if (shadowedByCurrentSquare.visited) {
				console.dir(cornerSquares_sw);
				console.dir(cornerSquares_se);
				throw new Error("Circular shadow! currentSquare="+JSON.stringify(currentSquare)+" shadowedByCurrentSquare="+JSON.stringify(shadowedByCurrentSquare));
			}
			currentSquare = shadowedByCurrentSquare;
		} else {
			break; // current square puts no shadow!
		}
	}


	// get the agent with the square with the smallest taxicab distance overall:
	var iWinningAgent = currentSquare.index;
	var winningAgent  = valueFunctions[iWinningAgent];

	var landplot = currentSquare.direction=="NE"? {
			minx: currentSquare.x,
			miny: currentSquare.y,
			maxx: currentSquare.x+currentSquare.s,
			maxy: currentSquare.y+currentSquare.s,
	}: {  // "NW"
		maxx: currentSquare.x,
		miny: currentSquare.y,
		minx: currentSquare.x-currentSquare.s,
		maxy: currentSquare.y+currentSquare.s,
	};
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets from the square "+JSON.stringify(currentSquare)+" the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	if (currentSquare.direction=="NE") {
		var remainingCorners_sw = jsts.algorithm.updatedCornersNorthEast(corners_sw, landplot);
		remainingCorners_se = jsts.algorithm.removeCornersWithSmallXDistance(corners_se, [{x:1,y:-0.001}].concat(remainingCorners_sw).concat([{x:0,y:1.001}]));
		remainingCorners_sw = jsts.algorithm.removeCornersWithSmallXDistance(remainingCorners_sw, [{x:0,y:-0.001}].concat(corners_se).concat([{x:1,y:1.001}]));
	} else {  // "NW"
		var remainingCorners_se = jsts.algorithm.updatedCornersNorthWest(corners_se, landplot);
		remainingCorners_sw = jsts.algorithm.removeCornersWithSmallXDistance(corners_sw, [{x:0,y:-0.001}].concat(remainingCorners_se).concat([{x:1,y:1.001}]));
		remainingCorners_se = jsts.algorithm.removeCornersWithSmallXDistance(remainingCorners_se, [{x:1,y:-0.001}].concat(corners_sw).concat([{x:0,y:1.001}]));
	}
	var remainingLandplots = staircase3walls_double2walls(remainingValueFunctions, origin_sw, remainingCorners_sw, origin_se, remainingCorners_se, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
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
var staircase2walls = function(valueFunctions, origin, corners, requiredLandplotValue) {
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
			console.dir(valueFunctions);
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
	var remainingLandplots = staircase2walls(remainingValueFunctions, origin, remainingCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}





/**
 * Normalized 1-wall algorithm:
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the east, west and north borders
 */
var norm1Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
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
			console.dir(valueFunctions);
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








var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}

var norm1WallsTemp = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var valueFunction = valueFunctions[0];
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 1 Wall Algorithm");
	// console.log(util.inspect(valueFunctions,{depth:3}));

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

		square.fill = square.stroke = color(iColor);
		landplots.push(square);
		previousSquare = square;
	}
	return landplots;
}
