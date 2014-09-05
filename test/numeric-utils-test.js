/**
 * a unit-test for numeric-utils
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var utils = require("../lib/numeric-utils");

describe('sortedUniqueValues', function() {
	it('works with positive numbers', function() {
		var array = [{x:0,y:100},{x:100,y:50},{x:50,y:200}];
		utils.sortedUniqueValues(array,["x"]).should.eql([0,50,100]);
		utils.sortedUniqueValues(array,["y"]).should.eql([50,100,200]);
		utils.sortedUniqueValues(array,["x","y"]).should.eql([0,50,100,200]);
	})
	it('works with negative numbers', function() {
		var array = [{x:0,y:-100},{x:-100,y:50},{x:-50,y:-200}];
		utils.sortedUniqueValues(array,["x"]).should.eql([-100,-50,0]);
		utils.sortedUniqueValues(array,["y"]).should.eql([-200,-100,50]);
		utils.sortedUniqueValues(array,["x","y"]).should.eql([-200,-100,-50,0,50]);
	})
})

describe('cutPoints', function() {
	it('works with empty list', function() {
		utils.cutPoints([],1).should.eql([]);
		utils.cutPoints([],2).should.eql([]);
	})
	it('works with a single point and a single piece', function() {
		utils.cutPoints([5],1).should.eql([5]);
	})
	it('works with a single point and a more than one piece', function() {
		utils.cutPoints([5],2).should.eql([5,5]);
		utils.cutPoints([5],3).should.eql([5,5,5]);
	})
	it('works with n+1 points and n pieces', function() {
		utils.cutPoints([5,10],1).should.eql([10]);
		utils.cutPoints([5,10,15],2).should.eql([10,15]);
		utils.cutPoints([5,10,15,20],3).should.eql([10,15,20]);
	})
})
