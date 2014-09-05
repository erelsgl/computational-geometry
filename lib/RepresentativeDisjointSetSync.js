/**
 * Calculate a largest subset of interior-disjoint representative shapes from given sets of candidates.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var Combinatorics = require('js-combinatorics').Combinatorics;
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-cache");
require("./partition-utils");


/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.representativeDisjointSet = function(candidateSets) {
	if (!candidateSets) 	return [];
	
	candidateSets = candidateSets.filter(function(set){return set.length>0});
	if (!candidateSets.length) return [];

	candidateSets = candidateSets.map(jsts.algorithm.prepareShapesToPartition);
	
	var allCandidates = candidateSets.reduce(function(a, b) { return a.concat(b); });
	jsts.algorithm.prepareDisjointCache(allCandidates);

	var repDisjointSet = representativeDisjointSetSub(candidateSets);
	if (repDisjointSet) return repDisjointSet;

	// If a set of n representatives is not found, we should return null,
	//    but for the sake of presentation to users 
	//    we try to find a set of n-1 representatives.
	//    this is not optimized as this is not the main goal of the algorithm.
	else return jsts.algorithm.representativeDisjointSet(candidateSets.slice(1));
}


/**
 * Find an interior-disjoint set of representative shapes, from the given set of candidates,
 * or null if not found.
 * 
 * @param candidateSets an array of arrays of candidate shapes.
 * 
 * @return a set of shapes that do not interior-intersect, or null if not found.
 *
 * @author Erel Segal-Halevi
 * @since 2014-03
 */
function representativeDisjointSetSub(candidateSets) {
	var allSets = Combinatorics.cartesianProduct.apply(null,candidateSets);
	while (subset = allSets.next()) {
		if (jsts.algorithm.arePairwiseDisjointByCache(subset))
			return subset;
	}
	return null;
}




