/**
 * a test for maximum-disjoint-set of the output of shapes-touching-points
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../lib");
var factory = new jsts.geom.GeometryFactory();
var maximumDisjointSet = jsts.algorithm.maximumDisjointSet; // shorthand

describe('squaresTouchingPoints without walls', function() {
	it('works for two horizontal points', function() {
		var candidates = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}]);
		candidates.should.have.lengthOf(2);
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
	it('works for two vertical points', function() {
		var candidates = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:1,y:2}]);
		candidates.should.have.lengthOf(2);
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
	it('works for four horizontal points', function() {
		var candidates = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}]);
		candidates.should.have.lengthOf(12);
		maximumDisjointSet(candidates).should.have.lengthOf(4);
	})
})

describe('rotatedSquaresTouchingPoints without walls', function() {
	it('works for two horizontal points', function() {
		var candidates = factory.createRotatedSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}]);
		candidates.should.have.lengthOf(3);
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
	it('works for two vertical points', function() {
		var candidates = factory.createRotatedSquaresTouchingPoints([{x:1,y:1}, {x:1,y:2}]);
		candidates.should.have.lengthOf(3);
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
	it('works for four horizontal points', function() {
		var candidates = factory.createRotatedSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}]);
		candidates.should.have.lengthOf(15);
		maximumDisjointSet(candidates).should.have.lengthOf(4);
	})
	it('works for five horizontal points', function() {
		var candidates = factory.createRotatedSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}, {x:5,y:1}]);
		maximumDisjointSet(candidates).should.have.lengthOf(6);
	})
	it('works for 4 points that uncovered a bug', function() {
		var walls = new jsts.geom.Envelope(0,Infinity,0,Infinity);
		var candidates = factory.createRotatedSquaresTouchingPoints([{x:5,y:5}, {x:5,y:70}, {x:70,y:5}, {x:2,y:390}], walls);
		candidates.should.have.lengthOf(6);
		maximumDisjointSet(candidates).should.have.lengthOf(2);
	})
})

