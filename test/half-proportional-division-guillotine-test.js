#!mocha
/**
 * a unit-test for fair-and-square division.
 *
 * @author Erel Segal-Halevi
 * @since 2017-01
 */

var should = require('should');
require("./testutils")

var jsts = require("../lib");
require("../lib/half-proportional-division-guillotine");

var halfProportionalDivision = jsts.algorithm.halfProportionalDivision;
var CAKE = new jsts.geom.Envelope(0,100,0,100);
var MAX_SLIMNESS = 1;  // squares

describe('half-proportional-guillotine in simple cases', function() {
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
		agentsValuePoints = [ [{x:1,y:1}, {x:99,y:99}] ]
		plots = halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(1);
		plots[0].shouldEqualRectangle(0,0, 100,100);
	})
	it('returns the entire cake for 1 agent with value at two corners', function() {
		agentsValuePoints = [ [{x:0,y:0}, {x:100,y:100}] ]
		plots = halfProportionalDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(1);
		plots[0].shouldEqualRectangle(0,0, 100,100);
	})

	it.only('divides the cake between 2 agents with identical valuations', function() {
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
