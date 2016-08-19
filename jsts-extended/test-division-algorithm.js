/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('../../computational-geometry');
var ValueFunction = require("./ValueFunction");

var _ = require("underscore");
_.mixin(require("argminmax"));

var util = require("util");
var ValueFunction = require("./ValueFunction");

/**
 * Test the given algorithm with the given args (array) and make sure that every agent gets the required num of points.
 * 
 * @param algorithm a cake-cutting algorithm.
 * @param args [array] the arguments with which to call the algorithm. The first argument must be the agentsValuePoints.
 * @param requiredNum [int] number of points that should be in the landplot of every agent.
 * 
 * @return the landplots (the result of the division algorithm)
 */
jsts.algorithm.testDivisionAlgorithm = function(algorithm, args, requiredNum)  {
	var landplots = algorithm.apply(0, args);
	var agentsValuePoints = args[0];
	
	if (landplots.length<agentsValuePoints.length) {
		console.error(jsts.algorithm.agentsValuePointsToString(agentsValuePoints));
		throw new Error("Not enough land-plots: "+JSON.stringify(landplots));
	}
	agentsValuePoints.forEach(function(points) {
		if (points instanceof ValueFunction)
			points = points.points;
		landplots.forEach(function(landplot) {
			if (points.color == landplot.color) {
				var pointsInLandplot = jsts.algorithm.numPointsInEnvelope(points, landplot);
				if (pointsInLandplot<requiredNum) {
					throw new Error("Not enough points for "+landplot.color+": expected "+requiredNum+" but found only "+pointsInLandplot+" from "+JSON.stringify(points)+" in landplot "+JSON.stringify(landplot));
				}
			}
		})
	})
	return landplots;
 }

