/**
 * Calculate a corner-square containing a given number of points.
 *
 * @author Erel Segal-Halevi
 * @since 2017-01
 */

var jsts = global.jsts;
var utils = require('./numeric-utils');
var _ = require("underscore");

/**
 * @param points array of Points, e.g. [{x:0,y:0}, {x:100,y:100}, etc.]
 * @param corner a Point that defines  the corner to which the output square should be attached.
 * @param targetNumOfPoints int>=1: how many points should be in the square.
 * @return the side-length of the smallest square containing the given num of points.
 */
jsts.algorithm.squareWithGivenNumOfPoints = function(points, corner, targetNumOfPoints) {
	if (!targetNumOfPoints)
		throw new Error("targetNumOfPoints is empty")
	// sort the points according to smallest corner-square that contains them:
	_.chain(points)
		.forEach(function(p){p.distance = Math.max(Math.abs(p.x-corner.x),Math.abs(p.y-corner.y))})
		.sort(function(a,b){return a.distance-b.distance})
		.value();
	return targetNumOfPoints<=points.length? points[targetNumOfPoints-1].distance: Infinity;
}
