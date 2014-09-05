/**
 * Calculate a largest subset of interior-disjoint shapes from a given set of candidates.
 * 
 * Asynchronous version, with option to interrupt.
 * 
 * @note For a synchronous function, see MaxDisjointSetSync.js
 * 
 * CREDITS:
 * * barry-johnson: http://stackoverflow.com/a/22593680/827927
 * * vkurchatkin:   http://stackoverflow.com/a/22604420/827927
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var Combinatorics = require('js-combinatorics').Combinatorics;
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-cache");
require("./partition-utils");
var async = require("async");

var TRACE_PERFORMANCE = false; 



/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 * 
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set 
 */
jsts.algorithm.MaximumDisjointSetSolver = function(candidates, stopAtCount) {
	if (TRACE_PERFORMANCE) var startTime = new Date();
	candidates = jsts.algorithm.prepareDisjointCache(jsts.algorithm.prepareShapesToPartition(candidates));
	if (TRACE_PERFORMANCE) 	console.log("Preparation time = "+(new Date()-startTime)+" [ms]");
	//	console.dir(candidates);
	
	this.candidates = candidates;
	this.stopAtCount = stopAtCount? stopAtCount: Infinity;
	this.interrupted = false;
}

jsts.algorithm.MaximumDisjointSetSolver.prototype.interrupt = function(){
    this.interrupted = true;
};


/**
 * Find a largest interior-disjoint set of rectangles, from the given set of candidates.
 * 
 * @param callback(err,result) - asynchronously called with the result.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
jsts.algorithm.MaximumDisjointSetSolver.prototype.solve = function (callback) {
	if (TRACE_PERFORMANCE) this.numRecursiveCalls = 0;
	this.maximumDisjointSetRec(this.candidates, this.stopAtCount, callback);
	if (TRACE_PERFORMANCE) console.log("numRecursiveCalls="+this.numRecursiveCalls);
}


/*--- Recursive functions ---*/

jsts.algorithm.MaximumDisjointSetSolver.prototype.maximumDisjointSetRec = function(candidates, stopAtCount, callback) {
//	console.log("maximumDisjointSetRec "+candidates.length);
	if (TRACE_PERFORMANCE) ++numRecursiveCalls;
	if (candidates.length<=1)
		return async.nextTick(callback.bind(null,null,candidates));
	if (this.interrupted)
		return async.nextTick(callback.bind(null,null,[]));

	var partition = jsts.algorithm.partitionShapes(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
//	console.log("\tpartition[1] = "+partition[1].length);
	var t = new Date();
	var allSubsetsOfIntersectedShapes = Combinatorics.power(partition[1]);
//	console.log("powerset took "+(new Date()-t))
//	allSubsetsOfIntersectedShapes = allSubsetsOfIntersectedShapes.filter(jsts.algorithm.arePairwiseDisjointByCache); 	// If the intersected shapes themselves are not pairwise-disjoint, they cannot be a part of an MDS.
//	console.log("filter took "+(new Date()-t))
//	console.log("\tallSubsetsOfIntersectedShapes = "+allSubsetsOfIntersectedShapes.length);

	var self = this;
	var currentMaxDisjointSet = [];
	var subsetOfIntersectedShapes = null;
	async.whilst(
			function loopCondition() { 
				if (self.interrupted) return false;
				if (currentMaxDisjointSet.length >= stopAtCount) return false;
				subsetOfIntersectedShapes = allSubsetsOfIntersectedShapes.next();
				if (!subsetOfIntersectedShapes) return false;
				return true;
			},
			function loopBody(loopIterationFinished) {
//				console.log("\ttime="+(new Date()-t)+" intrp="+self.interrupted);
				if (!jsts.algorithm.arePairwiseDisjointByCache(subsetOfIntersectedShapes))
					return async.nextTick(loopIterationFinished);

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
					return async.nextTick(loopIterationFinished);

				//	var maxDisjointSetOnSideOne = self.maximumDisjointSetRec(candidatesOnSideOne);
				//	var upperBoundOnNewDisjointSetSize = maxDisjointSetOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
				//	if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
				//		continue;
				//	var maxDisjointSetOnSideTwo = self.maximumDisjointSetRec(candidatesOnSideTwo);
				
				async.parallel(
						[self.maximumDisjointSetRec.bind(self, candidatesOnSideOne, stopAtCount),
						 self.maximumDisjointSetRec.bind(self, candidatesOnSideTwo, stopAtCount)],
						function processResults(err, results) {
							//console.log("\t\tprocessResults "+jsts.stringify(results));
							if (err) {
								console.dir(err);
								throw new Error(err);
							}
							var maxDisjointSetOnSideOne = results[0];
							var maxDisjointSetOnSideTwo = results[1];
							if (!maxDisjointSetOnSideOne || !maxDisjointSetOnSideTwo) {
								console.dir(results);
								throw new Error("undefined results");
							}
							var newDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedShapes);
							if (newDisjointSet.length>currentMaxDisjointSet.length)
								currentMaxDisjointSet = newDisjointSet;
							async.nextTick(loopIterationFinished);
						}
				)
			}, // end function loopBody
			function loopEnd(err) {
				callback(err, currentMaxDisjointSet);
			}
	); // end of async.whilst
} // end of function maximumDisjointSetRec
