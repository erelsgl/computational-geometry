/**
 * Calculate a largest subset of interior-disjoint shapes from a given set of candidates.
 *
 * Synchronous version.
 *
 * @note For an asynchronous version that can be interrupted, see MaxDisjointSetAsync.js
 *
 * CREDITS:
 * * D.W.: http://cs.stackexchange.com/a/20140/1342
 *
 * @author Erel Segal-Halevi
 * @since 2014-02
 */

var Combinatorics = require('js-combinatorics');
var _ = require('underscore');

var jsts = global.jsts
require("./intersection-cache");
require("./partition-utils");

var TRACE_PERFORMANCE = false;
var numRecursiveCalls;// a measure of performance


/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.maximumDisjointSet = function(candidates, stopAtCount) {
	if (!stopAtCount) stopAtCount = Infinity;

	if (TRACE_PERFORMANCE) var startTime = new Date();
	// console.dir(candidates);
	candidates = jsts.algorithm.prepareDisjointCache(jsts.algorithm.prepareShapesToPartition(candidates));  // in partition-utils.js
	if (TRACE_PERFORMANCE) 	console.log("Preparation time = "+(new Date()-startTime)+" [ms]");
	// console.dir(candidates);

	if (TRACE_PERFORMANCE) numRecursiveCalls = 0;
	var maxDisjointSet = maximumDisjointSetRec(candidates,stopAtCount);
	if (TRACE_PERFORMANCE) console.log("numRecursiveCalls="+numRecursiveCalls);
	return maxDisjointSet;
}



/*--- Recursive function ---*/

/**
 * Find a largest interior-disjoint set of shapes, from the given set of candidates.
 *
 * @param candidates an array of candidate rectangles from which to select the MDS.
 * Each rectangle should contain the fields: minx, maxx, miny, maxy.
 *
 * @return a largest set of rectangles that do not interior-intersect.
 *
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set
 *
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
function maximumDisjointSetRec(candidates,stopAtCount) {
	if (TRACE_PERFORMANCE) ++numRecursiveCalls;
	if (candidates.length<=1)
		return candidates;

	var currentMaxDisjointSet = [];
	var partition = jsts.algorithm.partitionShapes(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);

	var allSubsetsOfIntersectedShapes = Combinatorics.power(partition[1]);
	var subsetOfIntersectedShapes;
	while (subsetOfIntersectedShapes = allSubsetsOfIntersectedShapes.next()) {
//		console.log("subsetOfIntersectedShapes="+subsetOfIntersectedShapes)
		if (!jsts.algorithm.arePairwiseDisjointByCache(subsetOfIntersectedShapes))
			continue;

		var candidatesOnSideOne = jsts.algorithm.calcDisjointByCache(partition[0], subsetOfIntersectedShapes);
		var candidatesOnSideTwo = jsts.algorithm.calcDisjointByCache(partition[2], subsetOfIntersectedShapes);

		// Make sure candidatesOnSideOne is larger than candidatesOnSideTwo - to enable heuristics
		if (candidatesOnSideOne.length<candidatesOnSideTwo.length) {
			var temp = candidatesOnSideOne;
			candidatesOnSideOne = candidatesOnSideTwo;
			candidatesOnSideTwo = temp;
		}

		// branch-and-bound (advice by D.W.):
		var upperBoundOnNewDisjointSetSize = candidatesOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideOne = maximumDisjointSetRec(candidatesOnSideOne, stopAtCount);
		var upperBoundOnNewDisjointSetSize = maxDisjointSetOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideTwo = maximumDisjointSetRec(candidatesOnSideTwo, stopAtCount-maxDisjointSetOnSideOne.length);

		var newDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedShapes);
		if (newDisjointSet.length > currentMaxDisjointSet.length)
			currentMaxDisjointSet = newDisjointSet;
		if (currentMaxDisjointSet.length >= stopAtCount)
			break;
	}; // end of while loop
	return currentMaxDisjointSet;
}
