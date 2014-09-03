/**
 * Enums related to sides
 */

var jsts = require('jsts');

/**
 * angle relative to x axis: 90*(3-Side)
 */
jsts.Side = {
	South: 0,
	West: 1,
	North: 2,
	East: 3
};

jsts.inverseSide = function(side) {
	return (side+2)%4;
}

jsts.Turn = {
	Left: -1,
	Right: 1
};

jsts.isVertical = function(side) { return side%2==0; }
jsts.isHorizontal = function(side) { return side%2==1; }

jsts.turn = function(side1, side2) {
	var t = side2-side1;
	if (t>1) t-=4;
	if (t<-1) t+=4;
	return t;
}

jsts.turnDirection = function(turn) {
	return turn>0? 1: -1;
}
