#!mocha
/**
 * a unit-test for fair-and-square division.
 *
 * @author Erel Segal-Halevi
 * @since 2017-01
 */

var should = require('should');
var jsts = require("../jsts-extended");
require("../jsts-extended/half-proportional-division-staircase");
//require("../jsts-extended/half-proportional-division-guillotine");

var halfProportionalDivision = jsts.algorithm.halfProportionalDivision;
var CAKE = new jsts.geom.Envelope(0,100,0,100);
var MAX_SLIMNESS = 1;  // squares

describe('half-proportional-staircase in simple cases', function() {
	it('returns empty division for 0 agents', function() {
		agentsValuePoints = []
		halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS).should.have.lengthOf(0);
	})
	it('throws an exception for an agent with no value points', function() {
		(function(){
			agentsValuePoints = [ [] ]
			halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS)
		}).should.throw(/no points/i);
	})

	it('returns the entire cake for 1 agent with value', function() {
		agentsValuePoints = [ [{x:0,y:0}, {x:99,y:99}] ]
		plots = halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(1);
		plots[0].minx.should.equal(0);
		plots[0].maxx.should.equal(99);
		plots[0].miny.should.equal(0);
		plots[0].maxy.should.equal(99);
	})
	it.skip('returns the entire cake for 1 agent with value at two corners', function() {
		agentsValuePoints = [ [{x:0,y:0}, {x:100,y:100}] ]
		console.dir(halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS));
	})

	it('divides the cake between 2 agents with identical valuations', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:70,y:70}],
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:70,y:70}],
		]
		plots = halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		console.dir(plots)
	})
})

describe('half-proportional-staircase in interesting cases', function() {
})
