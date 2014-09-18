/**
 * a unit-test for the minimum square covering problem.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var _ = require('underscore');

var jsts = require("../lib");

var factory = new jsts.geom.GeometryFactory();

var minSquareCoveringTest = function(xy) {
	//console.log("minSquareCoveringTest "+xy)
	var srp = factory.createSimpleRectilinearPolygon(xy);
	var covering = jsts.algorithm.minSquareCovering(srp);
	covering = _(covering).sortBy("miny");  // to make results predictable,
	covering = _(covering).sortBy("minx");  //    sort by minx then by miny.
	return covering;
}

describe('minimal square-covering of ', function() {
	it('square', function () {
		minSquareCoveringTest([0,0, 10,10]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10 }]);
		minSquareCoveringTest([10,0, 0,10]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10 }]);
	})
	
	it('rectangles', function () {
		minSquareCoveringTest([0,0, 10,20]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10 },  { minx: 0, maxx: 10, miny: 10, maxy: 20 }]);
		minSquareCoveringTest([0,0, 10,35]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10 },  { minx: 0, maxx: 10, miny: 10, maxy: 20 },  { minx: 0, maxx: 10, miny: 20, maxy: 30 },  { minx: 0, maxx: 10, miny: 25, maxy: 35 } ]);
	});

	it('rectangles - opposite turn direction', function () {
		minSquareCoveringTest([0,10, 20,0]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10 }, { minx: 10, maxx: 20, miny: 0, maxy: 10 }]);
		minSquareCoveringTest([0,10, 35,0]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10 },  { minx: 5, maxx: 15, miny: 0, maxy: 10 },  { minx: 15, maxx: 25, miny: 0, maxy: 10 }, { minx: 25, maxx: 35, miny: 0, maxy: 10 }]);
	});

	it('L-shapes', function () { // also tests two types of a 1-knob
		minSquareCoveringTest([0,0, 15,5, 20,20]).should.eql([ { minx: 0, maxx: 15, miny: 0, maxy: 15   }, { minx: 0, maxx: 15, miny: 5, maxy: 20 },  { minx: 5, maxx: 20, miny: 5, maxy: 20 }]); // Fat L-shape: 3 overlapping squares
		minSquareCoveringTest([0,0, 10,10, 20,20]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10  }, { minx: 0, maxx: 10, miny: 10, maxy: 20 }, { minx: 10, maxx: 20, miny: 10, maxy: 20 }]);   // Medium L-shape: 3 disjoint squares
		minSquareCoveringTest([10,0, 20,20, 0,10]).should.eql([ { minx: 0, maxx: 10, miny: 10, maxy: 20 }, { minx: 10, maxx: 20, miny: 0, maxy: 10 }, { minx: 10, maxx: 20, miny: 10, maxy: 20 }]);   // Medium L-shape: 3 disjoint squares
		minSquareCoveringTest([0,0, 5,15, 20,20]).should.eql([ { minx: 0, maxx: 5, miny: 0, maxy: 5     }, { minx: 0, maxx: 5, miny: 5, maxy: 10 },   { minx: 0, maxx: 5, miny: 10, maxy: 15 },{ minx: 0, maxx: 5, miny: 15, maxy: 20 },
		                                                       { minx: 5, maxx: 10, miny: 15, maxy: 20  }, { minx: 10, maxx: 15, miny: 15, maxy: 20 },{ minx: 15, maxx: 20, miny: 15, maxy: 20 } ]);  // Thin L-shape: 7 disjoint squares
	});
	it('2-knob continuators', function () {  // tests 2-knob continuators
		minSquareCoveringTest([0,0, 5,5, 4,7]).should.eql([ { minx: 0, maxx: 5, miny: 0, maxy: 5}, { minx: 0, maxx: 4, miny: 3, maxy: 7}]); // type #1 knob;   should have 2 overlapping squares
		minSquareCoveringTest([0,0, 5,5, 3,6, -1,3]).should.eql([{ minx: -1, maxx: 2, miny: 3, maxy: 6}, { minx: 0, maxx: 5, miny: 0, maxy: 5}, { minx: 0, maxx: 3, miny: 3, maxy: 6}]); // type #2 knob;   should have 3 overlapping squares
	});

	it('bottle-shapes', function () {  // tests the third type of a 1-knob
		minSquareCoveringTest([0,0, 4,4, 3,5, 1,4]).should.eql([ { minx: 0, maxx: 4, miny: 0, maxy: 4}, { minx: 1, maxx: 3, miny: 3, maxy: 5}]); // Fat bottle-shape: 2 overlapping squares
		minSquareCoveringTest([0,0, 3,3, 2,4, 1,3]).should.eql([ { minx: 0, maxx: 3, miny: 0, maxy: 3}, { minx: 1, maxx: 2, miny: 3, maxy: 4}]); // Medium bottle-shape: 2 disjoint squares
		minSquareCoveringTest([1,3, 2,4, 3,7, 0,4]).should.eql([ { minx: 0, maxx: 3, miny: 4, maxy: 7}, { minx: 1, maxx: 2, miny: 3, maxy: 4}]); 
	});

	it('more bottle-shapes', function () {  // tests the third type of a 1-knob
//		minSquareCoveringTest([0,0, 4,5, 3,8, 1,5]).should.eql([ { minx: 0, maxx: 4, miny: 0, maxy: 4}, { minx: 0, maxx: 4, miny: 1, maxy: 5}, { minx: 1, maxx: 3, miny: 5, maxy: 7}, { minx: 1, maxx: 3, miny: 6, maxy: 8}]); // Thin bottle-shape: 4 overlapping squares
		minSquareCoveringTest([0,0, 4,5, 3,8, 1,4]).should.eql([ { minx: 0, maxx: 4, miny: 0, maxy: 4}, { minx: 1, maxx: 4, miny: 2, maxy: 5}, { minx: 1, maxx: 3, miny: 5, maxy: 7}, { minx: 1, maxx: 3, miny: 6, maxy: 8}]); // Thin asymmetric bottle-shape: 4 overlapping squares
	});

	it('fat room-shapes', function () {   // tests 3-knob continuaturs
		minSquareCoveringTest([0,0, 4,4, 3,5, 4,9, 0,5, 1,4]).should.eql([ { minx: 0, maxx: 4, miny: 0, maxy: 4}, { minx: 0, maxx: 4, miny: 5, maxy: 9 }, { minx: 1, maxx: 3, miny: 4, maxy: 6}]); // Fat room-shape: 3 overlapping squares
	});

	it('medium room-shapes', function () {   // tests 3-knob continuaturs
		minSquareCoveringTest([0,0, 3,3, 2,4, 3,7, 0,4, 1,3]).should.eql([ { minx: 0, maxx: 3, miny: 0, maxy: 3}, { minx: 0, maxx: 3, miny: 4, maxy: 7 }, { minx: 1, maxx: 2, miny: 3, maxy: 4}]); // Medium room-shape: 3 disjoint squares
	});

	it('1-knobs', function () {  // tests the third type of a 1-knob
		minSquareCoveringTest([0,0, 5,6, 4,8, 1,7]).should.eql([ { minx: 0, maxx: 5, miny: 0, maxy: 5 }, { minx: 0, maxx: 5, miny: 1, maxy: 6 }, { minx: 0, maxx: 4, miny: 3, maxy: 7 }, { minx: 1, maxx: 4, miny: 5, maxy: 8 } ]); // Fat L-shape: 3 overlapping squares
	});

	it('overlapping squares', function () { 
		minSquareCoveringTest([0,0, 10,1, 11,11, 1,10]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10}, { minx: 1, maxx: 11, miny: 1, maxy: 11}]); // 2 overlapping squares
		minSquareCoveringTest([0,0, 10,1, 11,2, 12,12, 2,11, 1,10]).should.eql([ { minx: 0, maxx: 10, miny: 0, maxy: 10}, { minx: 1, maxx: 11, miny: 1, maxy: 11}, { minx: 2, maxx: 12, miny: 2, maxy: 12}]); // 3 overlapping squares
	});
	
	it('hall with 2 rooms', function () { 
		minSquareCoveringTest([1,1, 15,12, 16,16, 12,15, 4,16, 0,12]).should.eql([{ minx: 0, maxx: 4, miny: 12, maxy: 16},  { minx: 1, maxx: 15, miny: 1, maxy: 15}, { minx: 12, maxx: 16, miny: 12, maxy: 16}]); // 3 overlapping squares: 2 small, 1 large
	});

	it('hall with 4 rooms', function () { 
		minSquareCoveringTest([0,0,4,1,12,0, 16,4,15,12,16,16, 12,15,4,16,0,12, 1,4]).should.eql([{ minx: 0, maxx: 4, miny: 0, maxy: 4}, { minx: 0, maxx: 4, miny: 12, maxy: 16}, { minx: 1, maxx: 15, miny: 1, maxy: 15}, { minx: 12, maxx: 16, miny: 0, maxy: 4}, { minx: 12, maxx: 16, miny: 12, maxy: 16}]); // 5 overlapping squares: 4 small, 1 large
	});
});
