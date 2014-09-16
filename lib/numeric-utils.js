/**
 * Some utils for structs of numbers.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */



Math.log10 = function(x) {
	return Math.log(x) / Math.LN10;
}

// By Pyrolistical: http://stackoverflow.com/a/1581007/827927
Math.roundToSignificantFigures = function(significantFigures, num) {
	if(num == 0) return 0;
	
	var d = Math.ceil(Math.log10(num < 0 ? -num: num));
	var power = significantFigures - d;
	
	var magnitude = Math.pow(10, power);
	var shifted = Math.round(num*magnitude);
	return shifted/magnitude;
}

Math.roundFields = function(significantFigures, object) {
	for (var field in object)
		if (typeof object[field] === 'number')
			object[field]=Math.roundToSignificantFigures(significantFigures, object[field]);
}



module.exports = {
	sortedUniqueValues: function(structs, fieldNames) {
		var values = {};
		for (var i=0; i<structs.length; ++i) {
			var cur = structs[i];
			for (var f=0; f<fieldNames.length; ++f) {
				fieldName = fieldNames[f];
				if (fieldName in cur)
					values[cur[fieldName]]=true;
			}
		}
		var list = Object.keys(values);
		for (var i=0; i<list.length; ++i)
			list[i] = parseFloat(list[i]);
		list.sort(function(a,b){return a-b});
		return list;
	},

	/**
	 * @param points a sorted array of numbers.
	 * @param numOfPieces a positive integer.
	 * @return an array of numbers that partition "points" such that each piece has the same amount of (fractions of) points
	 */
	cutPoints: function(points, numOfPieces) {
		var cuts = [];
		var pointsPerPiece = points.length/numOfPieces;
		var curPointsInPiece = 0;
		for (var i=0; i<points.length; ++i) {
			curPointsInPiece += 1;
			while (curPointsInPiece>=pointsPerPiece) {
				cuts.push(points[i]);
				curPointsInPiece -= pointsPerPiece;
			}
		}
		return cuts;
	},
}
