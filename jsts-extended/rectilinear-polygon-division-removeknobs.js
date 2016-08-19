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
 * @param agentsValuePoints an array of n>=1 or more valuation functions, represented by value points (x,y).
 * @param cake a SimpleRectilinearPolygon representing the cake to divide.
 * @return an array of n squares (minx,maxx,miny,maxy) representing the shares of the n agents.
 */
jsts.algorithm.rectilinearPolygonDivision = function recursive(valueFunctions, cake, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" from a cake "+cake.toString());
	
	var cakeCoveringData = new jsts.algorithm.MinSquareCoveringData(cake);

	valueFunctions.forEach(function(valueFunction) {	
		valueFunction.candidateSquares = [];
	});

	//TRACE(numOfAgents,"\nP="+cakeCoveringData.corners.toString());
	var knobs = cakeCoveringData.findAllSegmentsWithContinuators();
	var shouldRemoveKnobs = false;
	knobs.forEach(function(knob) {
		if (!knob.hasContinuator())  // this is possible if the structure has changed by removeErasableRegion 
			return;
		var knobLength = knob.length();
		var continuator = knob.getAdjacentSquareInPolygon();
		TRACE(numOfAgents,"\tprocessing knob "+knob.toString()+"\twith continuator "+JSON.stringify(continuator))

		var numOfCandidatesPerKnob = 0;
		var corner = knob.c0;
		var cornerCount = Math.min(4,knob.knobCount+1);
		for (var i=0; i<cornerCount; ++i) {   // loop over all (convex) corners of the continuator:
			var directionOfPolygonInterior = corner.directionOfPolygonInterior();
			valueFunctions.forEach(function(valueFunction) {
				var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, directionOfPolygonInterior);
				if (squareSize<=knobLength) {
					var x0 = corner.x
					  , x1 = corner.x + corner.signOfPolygonInteriorX()*squareSize
					  , y0 = corner.y
					  , y1 = corner.y + corner.signOfPolygonInteriorY()*squareSize;
					valueFunction.candidateSquares.push({minx:Math.min(x0,x1), miny:Math.min(y0,y1), maxx:Math.max(x0,x1), maxy:Math.max(y0,y1), size:squareSize, corner:{x:corner.x,y:corner.y}, direction:directionOfPolygonInterior});
					numOfCandidatesPerKnob++;
				}
			});
			corner = corner.next;
		};
		
		if (!numOfCandidatesPerKnob) {
			TRACE(numOfAgents,"\t-- No demand - removing knob");
			cakeCoveringData.removeErasableRegion(knob);
			shouldRemoveKnobs = true;
		}
	});
	
	if (shouldRemoveKnobs) {
		var newCake = cakeCoveringData.getResidualPolygon();
		return recursive(valueFunctions, newCake, requiredLandplotValue)
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

