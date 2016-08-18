#!/usr/bin/env mocha
/**
 * a unit-test for maximum-disjoint-set-async.
 *
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../lib");
var MaximumDisjointSetSolver = jsts.algorithm.MaximumDisjointSetSolver; // shorthand

var factory = new jsts.geom.GeometryFactory();

var r0101 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:0,maxy:1});
var r0112 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:1,maxy:2});
var r0123 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:2,maxy:3});
var r0134 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:3,maxy:4});
var r1201 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:0,maxy:1});
var r2301 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:0,maxy:1});
var r3401 = factory.createAxisParallelRectangle({minx:3,maxx:4, miny:0,maxy:1});

var r1212 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:1,maxy:2});
var r2323 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:2,maxy:3});
var r3434 = factory.createAxisParallelRectangle({minx:3,maxx:4, miny:3,maxy:4});

var r0202 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:0,maxy:2});
var r0213 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:1,maxy:3});
var r0224 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:2,maxy:4});
var r1302 = factory.createAxisParallelRectangle({minx:1,maxx:3, miny:0,maxy:2});
var r2402 = factory.createAxisParallelRectangle({minx:2,maxx:4, miny:0,maxy:2});

var r1313 = factory.createAxisParallelRectangle({minx:1,maxx:3, miny:1,maxy:3});
var r2424 = factory.createAxisParallelRectangle({minx:2,maxx:4, miny:2,maxy:4});
var r0303 = factory.createAxisParallelRectangle({minx:0,maxx:3, miny:0,maxy:3});
var r1414 = factory.createAxisParallelRectangle({minx:1,maxx:4, miny:1,maxy:4});
var r0404 = factory.createAxisParallelRectangle({minx:0,maxx:4, miny:0,maxy:4});

var candidateRects = [r0101, r1212, r2323, r3434, r0202, r1313, r2424, r0303, r1414, r0404];

describe('MaximumDisjointSet in simple cases', function() {
	it('works for empty sets', function(done) {
		new MaximumDisjointSetSolver([]).solve(function(err,result) {
			result.should.have.lengthOf(0);
			done(err);
		});
	})

	it('works for single rectangles', function(done) {
		new MaximumDisjointSetSolver([candidateRects[0]]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})

	it('works for two identical rectangles', function(done) {
		new MaximumDisjointSetSolver([candidateRects[1], candidateRects[1]]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
})

describe.only('MaximumDisjointSet with diagonal rectangles', function() {
	it('works for disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0101,r2323]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works for disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r3434,r1212]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})

	it('works for interior-disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0101,r1212]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works for interior-disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r2323,r1212]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})

	it('works for intersecting rectangles', function(done) {
		new MaximumDisjointSetSolver([r0202,r1313]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
	it('works for intersecting rectangles', function(done) {
		new MaximumDisjointSetSolver([r2424,r1313]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
})

describe('MaximumDisjointSet with vertical rectangles', function() {
	it('works for disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0101,r0123]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works for disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0134,r0112]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})

	it('works for interior-disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0101,r0112]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works for interior-disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0123,r0112]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})

	it('works for intersecting rectangles', function(done) {
		new MaximumDisjointSetSolver([r0202,r0213]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
	it('works for intersecting rectangles', function(done) {
		new MaximumDisjointSetSolver([r0224,r0213]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
})

describe('MaximumDisjointSet with horizontal rectangles', function() {
	it('works for disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0101,r2301]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works for disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r3401,r1201]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})

	it('works for interior-disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r0101,r1201]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works for interior-disjoint rectangles', function(done) {
		new MaximumDisjointSetSolver([r2301,r1201]).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})

	it('works for intersecting rectangles', function(done) {
		new MaximumDisjointSetSolver([r0202,r1302]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
	it('works for intersecting rectangles', function(done) {
		new MaximumDisjointSetSolver([r2402,r1302]).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
})

describe('MaximumDisjointSet with complex scenarios', function() {
	it('works with 3 disjoint rectangles', function(done) {
		var candidates=
			[ factory.createAxisParallelRectangle({ minx: 1, maxx: 4, miny: 1, maxy: 4 }),
			  factory.createAxisParallelRectangle({ minx: 2, maxx: 6, miny: 4, maxy: 8 }),
			  factory.createAxisParallelRectangle({ minx: 4, maxx: 6, miny: 1, maxy: 3 }) ];
		new MaximumDisjointSetSolver(candidates).solve(function(err,result) {
			result.should.have.lengthOf(3);
			done(err);
		});
	})
	it('works with 3 disjoint rectangles one of them contained in another', function(done) {
		var candidates=
			[ factory.createAxisParallelRectangle({ minx: 1, maxx: 4, miny: 1, maxy: 4 }),
			  factory.createAxisParallelRectangle({ minx: 3, maxx: 6, miny: 1, maxy: 4 }),
			  factory.createAxisParallelRectangle({ minx: 4, maxx: 6, miny: 1, maxy: 3 }) ];
		new MaximumDisjointSetSolver(candidates).solve(function(err,result) {
			result.should.have.lengthOf(2);
			done(err);
		});
	})
	it('works with 4 rectangles one of them contained in another', function(done) {
		var candidates=
			[ factory.createAxisParallelRectangle({ minx: 1, maxx: 4, miny: 1, maxy: 4 }),
			  factory.createAxisParallelRectangle({ minx: 2, maxx: 6, miny: 4, maxy: 8 }),
			  factory.createAxisParallelRectangle({ minx: 3, maxx: 6, miny: 1, maxy: 4 }),
			  factory.createAxisParallelRectangle({ minx: 4, maxx: 6, miny: 1, maxy: 3 }) ];
		new MaximumDisjointSetSolver(candidates).solve(function(err,result) {
			result.should.have.lengthOf(3);
			done(err);
		});
	})
	it('works with 5 rectangles that once caught a bug', function(done) {
		var candidates=[
	            factory.createAxisParallelRectangle({"minx":-70,"miny":110,"maxx":140,"maxy":320}),
	            factory.createAxisParallelRectangle({"minx":90,"miny":210,"maxx":200,"maxy":320}),
	            factory.createAxisParallelRectangle({"minx":100,"miny":110,"maxx":200,"maxy":210}),
	            factory.createAxisParallelRectangle({"minx":140,"miny":130,"maxx":220,"maxy":210}),
	            factory.createAxisParallelRectangle({"minx":200,"miny":130,"maxx":280,"maxy":210}),
	            ];
		new MaximumDisjointSetSolver(candidates).solve(function(err,result) {
			result.should.have.lengthOf(3);
			done(err);
		});
	})
	it('works with other 5 rectangles that once caught a bug', function(done) {
		var candidates=[
	            factory.createAxisParallelRectangle({"minx":80,"miny":30,"maxx":150,"maxy":100}),
	            factory.createAxisParallelRectangle({"minx":99.99,"miny":30,"maxx":169.99,"maxy":100}),
	            factory.createAxisParallelRectangle({"minx":100,"miny":99.99,"maxx":200,"maxy":199.99}),
	            factory.createAxisParallelRectangle({"minx":130,"miny":30,"maxx":200,"maxy":100}),
	            factory.createAxisParallelRectangle({"minx":149.99,"miny":30,"maxx":219.99,"maxy":100}),
	            ];
		new MaximumDisjointSetSolver(candidates).solve(function(err,result) {
			result.should.have.lengthOf(1);
			done(err);
		});
	})
})
