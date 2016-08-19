/**
 * Fairly cut a SimpleRectilinearPolygon such that each agent receives a square.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */

var jsts = require("../../computational-geometry");
var SimpleRectilinearPolygon = jsts.geom.SimpleRectilinearPolygon;
var ValueFunction = require("./ValueFunction");
var _ = require("underscore");
_.mixin(require("argminmax"));
var util = require("util");

function logValueFunctions(valueFunctions) {
	console.log(util.inspect(valueFunctions,{depth:3}));
}

function TRACE (numOfAgents, s) {
	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_NO_LANDPLOT(valueFunctions) {
	logValueFunctions(valueFunctions);
}

function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}


/**
 * @param knob a knob which is first in a knob-chain of a continuator.
 * @param valueFunctions the candidate squares will be inserted in the valueFunction.candidateSquares array.
 * @param cornerFilterFunction used to filter the corners.
 * @return numOfCandidatesPerKnob total number of candidates for the given knob.
 */
function findCandidateSquaresInKnob(knob, valueFunctions, requiredLandplotValue, cornerFilterFunction) {
	var corner = knob.c0;
	var cornerCount = Math.min(4,knob.knobCount+1);
	var knobLength = knob.length();
	var numOfCandidatesPerKnob = 0;
	for (var i=0; i<cornerCount; ++i) {   // loop over all (convex) corners of the continuator:
		if (!cornerFilterFunction || cornerFilterFunction(corner)) {
			var directionOfPolygonInterior = corner.directionOfPolygonInterior();
			valueFunctions.forEach(function(valueFunction) {
				var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, directionOfPolygonInterior);
				if (squareSize<=knobLength) {
					var x0 = corner.x
					  , x1 = corner.x + corner.signOfPolygonInteriorX()*squareSize
					  , y0 = corner.y
					  , y1 = corner.y + corner.signOfPolygonInteriorY()*squareSize;
					numOfCandidatesPerKnob++;
					if (valueFunction.candidateSquares)
						valueFunction.candidateSquares.push({minx:Math.min(x0,x1), miny:Math.min(y0,y1), maxx:Math.max(x0,x1), maxy:Math.max(y0,y1), size:squareSize, corner:{x:corner.x,y:corner.y}, direction:directionOfPolygonInterior});
				}
			});
		}
		corner = corner.next;
	};
	return numOfCandidatesPerKnob;
}


/**
 * @param agentsValuePoints an array of n>=1 or more valuation functions, represented by value points (x,y).
 * @param cake a SimpleRectilinearPolygon representing the cake to divide.
 * @return an array of n squares (minx,maxx,miny,maxy) representing the shares of the n agents.
 */
jsts.algorithm.rectilinearPolygonDivision = function recursive(valueFunctions, cake, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" from a cake "+cake.toString());
	var USE_FLOATING_CORNERS = false;
	var cakeCoveringData = new jsts.algorithm.MinSquareCoveringData(cake);

	// Start by removing knobs that nobody wants:
	var cakeHasChanged = false;
	for (;;) {
		var cakeHasChangedInIteration = false;
		var knobs = cakeCoveringData.findAllSegmentsWithContinuators();
		for (var i=0; i<knobs.length; ++i) {
			var knob = knobs[i];
			TRACE(numOfAgents,"\tchecking knob "+knob.toString());
			var numOfCandidatesPerKnob = findCandidateSquaresInKnob(knob, valueFunctions, requiredLandplotValue);
			if (!numOfCandidatesPerKnob) {
				TRACE(numOfAgents,"\t-- No demand - removing knob");
				cakeCoveringData.removeErasableRegion(knob);
				cakeHasChangedInIteration = cakeHasChanged = true;
				break;
			}
		}
		if (cakeCoveringData.isEmpty())
			break;
		if (!cakeHasChangedInIteration)  // no knob was removed - proceed to division
			break;
	}

	if (cakeCoveringData.isEmpty()) { // no more rectangles
		TRACE(numOfAgents, "-- no knob with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	}

	if (cakeHasChanged) 
		cake = cakeCoveringData.getResidualPolygon();
	var originalCakeCoveringData = new jsts.algorithm.MinSquareCoveringData(cake);

	valueFunctions.forEach(function(valueFunction) {	
		valueFunction.candidateSquares = [];
	});

	while (!cakeCoveringData.isEmpty()) {
		var knob = cakeCoveringData.findSegmentWithContinuator();
		TRACE(numOfAgents,"\tprocessing knob "+knob.toString());

		var numOfCandidatesPerKnob = findCandidateSquaresInKnob(knob, valueFunctions, requiredLandplotValue,
			/* corner filter = */USE_FLOATING_CORNERS? null: function(corner) {	return originalCakeCoveringData.hasConvexCorner({x:corner.x,y:corner.y});}
		);

		cakeCoveringData.removeErasableRegion(knob);
		TRACE(numOfAgents,"\t ++ found "+numOfCandidatesPerKnob+" candidates")
	}

	valueFunctions.forEach(function(valueFunction) {
		valueFunction.square = _.min(valueFunction.candidateSquares, function(square){
			return square.size
		});
	});
	
	// get the agent with the square with the smallest height overall:
	var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
		return valueFunction.square.size;
	});
	
	var winningAgent = valueFunctions[iWinningAgent];
	var winningSquare = winningAgent.square;

	if (!winningSquare || !isFinite(winningSquare.size)) {
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
	var remainingCake = cake.removeRectangle(landplot);
	var remainingLandplots = recursive(remainingValueFunctions, remainingCake, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}

