/**
 * Create the interiorDisjoint relation, and a cache for keeping previous results of this relation.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

/**
 * Define the relation "interior-disjoint" (= overlaps or covers or coveredBy)
 */
jsts.geom.Geometry.prototype.interiorDisjoint = function(other) {
	return this.relate(other, "F********");
}

/**
 * Adds to each geometric shape a unique object id, for use by the cache.
 */
var id = 1;
jsts.geom.Geometry.prototype.id = function() {
	if (!this.__uniqueid) 
		this.__uniqueid = id++;
	return this.__uniqueid;
}


/*--- Interior-Disjoint Cache ---*/

jsts.algorithm.prepareDisjointCache = function(candidates) {
	for (var ii=0; ii<candidates.length; ++ii) {
		var cur = candidates[ii];
		
		// pre-calculate interior-disjoint relations with other shapes, to save time:
		cur.disjointCache = [];
		cur.disjointCache[cur.id()] = false; // a shape overlaps itself
		for (var jj=0; jj<ii; jj++) {
			var other = candidates[jj];
			var disjoint = ('groupId' in cur && 'groupId' in other && cur.groupId==other.groupId?
				false:
				disjoint = cur.interiorDisjoint(other));
			if (typeof disjoint==='undefined') {
				console.dir(cur);
				console.dir(other);
				throw new Error("interiorDisjoint returned an undefined value");
			}
			cur.disjointCache[other.id()] = other.disjointCache[cur.id()] = disjoint;
		}
	}
	return candidates;
}

/**
 * @return true iff all pairs of shapes in the given array are interior-disjoint
 */
jsts.algorithm.arePairwiseDisjointByCache = function(shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape_i_id = shapes[i].id();
		for (var j=0; j<i; ++j) 
			if (!shapes[j].disjointCache[shape_i_id])
				return false;
	}
	return true;
}


/**
 * @return true if shape is disjoint from any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.isDisjointByCache = function(shape, referenceShapes) {
	var referenceShapesIds = referenceShapes.map(function(cur){return cur.id()});
	for (var i=0; i<referenceShapesIds.length; ++i) 
		if (!shape.disjointCache[referenceShapesIds[i]])
			return false;
	return true;
}


/**
 * @return all shapes from the "shapes" array that do not overlap any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.calcDisjointByCache = function(shapes, referenceShapes) {
	var referenceShapesIds = referenceShapes.map(function(cur){return cur.id()});
	return shapes.filter(function(shape) {
		for (var i=0; i<referenceShapesIds.length; ++i) 
			if (!shape.disjointCache[referenceShapesIds[i]])
				return false;
		return true;
	});
}


