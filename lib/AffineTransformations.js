/**
 * Adds to jsts.algorithm some utility functions related to affine transformations.
 *
 * The following fields are supported:
 * - translate[0] (real)  - added to the x value.
 * - translate[1] (real)  - added to the y value.
 * - scale      (real)    - multiplies the x and y values after translation.
 * - rotateRadians        - rotate in positive directions by given number of radians.
 * - rotateQuarters       - rotate in positive directions by given number of quarters (=90 degrees).
 * - reflectXaxis  (boolean) - convert y to minus y.
 * - reflectYaxis  (boolean) - convert x to minus x.
 * - reflectXY  (boolean) - true to swap x with y after scaling.
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

/**
 * Apply a single transformation on a single point.
 * @param t a transformation-description object with one or more fields from {translate, scale, rotateRadians, rotateQuarters, reflectXaxis, reflectYaxis, reflectXY}
 * @param point {x:..,y:..}
 */


var jsts = global.jsts;

var transformPoint1 = function(t, point) {
	if (t.translate) {
		point.x += t.translate[0];
		point.y += t.translate[1];
	}
	if (t.scale) {
		point.x *= t.scale;
		point.y *= t.scale;
	}
	if (t.rotateRadians) {  // PROBLEM: rounding errors
		var sin = Math.sin(t.rotateRadians);
		var cos = Math.cos(t.rotateRadians);
		var newX = cos*point.x - sin*point.y;
		var newY = sin*point.x + cos*point.y;
		point.x = newX;
		point.y = newY;
	}
	if (t.rotateQuarters) {
		var q = (t.rotateQuarters+4)%4;
		var sin = q==1? 1: q==3? -1: 0;
		var cos = q==0? 1: q==2? -1: 0;
		var newX = (cos==0? 0: cos*point.x) - (sin==0? 0: sin*point.y);
		var newY = (sin==0? 0: sin*point.x) + (cos==0? 0: cos*point.y);
		point.x = newX;
		point.y = newY;
	}
	if (t.reflectXaxis) {
		point.y = -point.y;
	}
	if (t.reflectYaxis) {
		point.x = -point.x;
	}
	if (t.reflectXY) {
		var z = point.x;
		point.x = point.y;
		point.y = z;
	}
}


/**
 * Apply an array of transformations on a single point.
 * @param transformation array with transformation-description objects.
 * @param the changed point object.
 */
jsts.algorithm.transformPoint = function(transformation, point) {
	if (transformation.forEach)
		transformation.forEach(function(t) {
			transformPoint1(t,point);
		});
	else
		transformPoint1(transformation,point);
	return point;
};

/**
 * @return the given point after the application of the given transformations.
 * @param transformation array with transformation-description objects.
 * @param point {x,y}
 * @note the input point is NOT changed.
 */
jsts.algorithm.transformedPoint = function(transformation, point) {
	return jsts.algorithm.transformPoint(transformation, {x:point.x, y:point.y});
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect of class AxisParallelRectangle
 * @param transformation an array of transformation-description objects.
 */
jsts.algorithm.transformAxisParallelRectangle = function(transformation, rect) {
	var newMin = jsts.algorithm.transformPoint(transformation, {x:rect.minx, y:rect.miny});
	var newMax = jsts.algorithm.transformPoint(transformation, {x:rect.maxx, y:rect.maxy});
	rect.minx = Math.min(newMin.x,newMax.x);	rect.miny = Math.min(newMin.y,newMax.y);
	rect.maxx = Math.max(newMin.x,newMax.x);	rect.maxy = Math.max(newMin.y,newMax.y);
	return rect;
};

/**
 * @return the given rectangle after the application of the given transformations.
 * @param rect class AxisParallelRectangle
 * @param transformation an array of transformation-description objects.
 */
jsts.algorithm.transformedAxisParallelRectangle = function(transformation, rect) {
	var newMin = jsts.algorithm.transformPoint(transformation, {x:rect.minx, y:rect.miny});
	var newMax = jsts.algorithm.transformPoint(transformation, {x:rect.maxx, y:rect.maxy});
	return 	rect.factory.createAxisParallelRectangle(newMin.x,newMin.y, newMax.x,newMax.y);
};

/**
* @return a transformation that reverses the effects of the given transformation.
 */
var reverseSingleTransformation = function(t) {
	var r = {};
	if (t.translate)
		r.translate = [-t.translate[0], -t.translate[1]];
	if (t.scale)
		r.scale = 1/t.scale;
	if (t.rotateRadians)
		r.rotateRadians = -t.rotateRadians;
	if (t.rotateQuarters)
		r.rotateQuarters = (4-t.rotateQuarters)%4;
	if (t.reflectXaxis)
		r.reflectXaxis = t.reflectXaxis;
	if (t.reflectYaxis)
		r.reflectYaxis = t.reflectYaxis;
	if (t.reflectXY)
		r.reflectXY = t.reflectXY;
	return r;
}

/**
 * @return an array of transformations that reverses the effects of the given array of transformations.
 */
jsts.algorithm.reverseTransformation = function(transformation) {
	var reverseTransformation = transformation.map(reverseSingleTransformation);
	reverseTransformation.reverse();
	return reverseTransformation;
};
