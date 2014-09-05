/**
 * Adds to jsts.algorithm some utility functions related to partitioning collections of shapes.
 * 
 * These utility functions are used mainly by the maximum-disjoint-set algorithm.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */
var _ = require('underscore');
var utils = require('./numeric-utils');


jsts.algorithm.prepareShapesToPartition = function(candidates) {
	candidates = candidates.filter(function(cur) { return (cur.getArea() > 0); })  	// remove empty candidates
	candidates.forEach(function(cur) {
		cur.normalize();
		var envelope = cur.getEnvelopeInternal();
		cur.minx = envelope.getMinX(); cur.maxx = envelope.getMaxX();
		cur.miny = envelope.getMinY(); cur.maxy = envelope.getMaxY();
	});
	return _.uniq(candidates, function(cur) { return cur.toString(); })    // remove duplicates
}

/**
 * Subroutine of maximumDisjointSet.
 * 
 * @param candidates an array of candidate rectangles to add to the MDS. 
 * 	Must have length at least 2.
 * @return a partition of the rectangles to three groups:
		partition[0] - on one side of separator;
		partition[1] - intersected by separator;
		partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
	@note Tries to maximize the quality of the partition, as defined by the function partitionQuality.
 * 
 */
jsts.algorithm.partitionShapes = function(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");

	var bestXPartition = null;
	var xValues = utils.sortedUniqueValues(candidates, ['minx','maxx']).slice(1,-1);
	
	if (xValues.length>0) {
		var bestX = _.max(xValues, function(x) {
			return partitionQuality(partitionByX(candidates, x));
		});
		bestXPartition = partitionByX(candidates, bestX);
	}

	var bestYPartition = null;
	var yValues = utils.sortedUniqueValues(candidates, ['miny','maxy']).slice(1,-1);
	if (yValues.length>0) {
		var bestY = _.max(yValues, function(y) {
			return partitionQuality(partitionByY(candidates, y));
		});
		bestYPartition = partitionByY(candidates, bestY);
	}
	
	if (!bestYPartition && !bestXPartition) {
		console.dir(candidates.map(function(cur){return cur.toString()}));
		console.warn("Warning: no x partition and no y partition!");
		return [[],candidates,[]];
	}

	if (partitionQuality(bestXPartition,true)>=partitionQuality(bestYPartition,true)) {
//		console.log("\t\tBest separator line: x="+bestX+" "+partitionDescription(bestXPartition));
		return bestXPartition;
	} else {
//		console.log("\t\tBest separator line: y="+bestY+" "+partitionDescription(bestYPartition));
		return bestYPartition;
	}
}



/**
 * @param shapes an array of shapes, each of which contains pre-calculated "minx" and "maxx" fields.
 * @param x a number.
 * @return a partitioning of shapes to 3 lists: before, intersecting, after x.
 */
function partitionByX(shapes, x) {
	var beforeX = [];
	var intersectedByX = [];
	var afterX = [];
	shapes.forEach(function(cur) {
		if (cur.maxx<x)
			beforeX.push(cur);
		else if (x<=cur.minx)
			afterX.push(cur);
		else
			intersectedByX.push(cur);
	});
	return [beforeX, intersectedByX, afterX];
}

/**
 * @param shapes an array of shapes, each of which contains pre-calculated "miny" and "maxy" fields.
 * @param y a number.
 * @return a partitioning of shapes to 3 lists: before, intersecting, after y.
 */
function partitionByY(shapes, y) {
	var beforeY = [];
	var intersectedByY = [];
	var afterY = [];
	shapes.forEach(function(cur) {
		if (cur.maxy<y)
			beforeY.push(cur);
		else if (y<=cur.miny)
			afterY.push(cur);
		else
			intersectedByY.push(cur);
	});
	return [beforeY, intersectedByY, afterY];
}




/**
 * Calculate a quality factor for the given partition of squares.
 * 
 * @see http://cs.stackexchange.com/questions/20126
 * 
 * @param partition contains three parts; see partitionShapes.
 */
function partitionQuality(partition, log) {
	if (!partition) return -1; // worst quality
	var numIntersected = partition[1].length; // the smaller - the better
	var smallestPart = Math.min(partition[2].length,partition[0].length);  // the larger - the better
	if (!numIntersected && !smallestPart)
		throw new Error("empty partition - might lead to endless recursion!");

//	if (log) console.log ("smallestPart="+smallestPart+" numIntersected="+numIntersected);

//	return 1/numIntersected; 
//	return smallestPart; 
//	return (smallestPart+1)/(numIntersected^2);  // see http://cs.stackexchange.com/a/20260/1342
	return (smallestPart+1)/(numIntersected);  // see http://cs.stackexchange.com/a/20260/1342
}

function partitionDescription(partition) {
	return "side1="+partition[0].length+" intersect="+partition[1].length+" side2="+partition[2].length;
}

