#!mocha

/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 *
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../lib");
var factory = new jsts.geom.GeometryFactory();

var r0101 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:0,maxy:1});
var r0112 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:1,maxy:2});
var r0123 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:2,maxy:3});
var r1201 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:0,maxy:1});
var r2301 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:0,maxy:1});

var r1212 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:1,maxy:2});
var r2323 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:2,maxy:3});

var r0202 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:0,maxy:2});
var r0213 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:1,maxy:3});
var r0224 = factory.createAxisParallelRectangle({minx:0,maxx:2, miny:2,maxy:4});
var r1302 = factory.createAxisParallelRectangle({minx:1,maxx:3, miny:0,maxy:2});
var r2402 = factory.createAxisParallelRectangle({minx:2,maxx:4, miny:0,maxy:2});

var r1313 = factory.createAxisParallelRectangle({minx:1,maxx:3, miny:1,maxy:3});
var r2424 = factory.createAxisParallelRectangle({minx:2,maxx:4, miny:2,maxy:4});

describe('AxisParallelRectangle', function() {
	it('knows the interiorDisjoint relation', function() {
		r0101.interiorDisjoint(r0112).should.equal(true);
		r0101.interiorDisjoint(r0123).should.equal(true);
		r0101.interiorDisjoint(r1201).should.equal(true);
		r0101.interiorDisjoint(r2301).should.equal(true);
		r0101.interiorDisjoint(r1212).should.equal(true);
		r0101.interiorDisjoint(r2323).should.equal(true);

		r0101.interiorDisjoint(r0202).should.equal(false);
		r0101.interiorDisjoint(r0213).should.equal(true);
		r0101.interiorDisjoint(r0224).should.equal(true);
		r0101.interiorDisjoint(r1302).should.equal(true);
		r0101.interiorDisjoint(r2402).should.equal(true);

		r0202.interiorDisjoint(r1313).should.equal(false);
		r0202.interiorDisjoint(r2424).should.equal(true);
	})

	it('knows its internal envelope', function() {
		r0123.getEnvelopeInternal().minx.should.equal(0)
	  r0123.getEnvelopeInternal().maxx.should.equal(1)
		r0123.getEnvelopeInternal().miny.should.equal(2)
	  r0123.getEnvelopeInternal().maxy.should.equal(3)
	})
})
