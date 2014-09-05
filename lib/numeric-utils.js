/**
 * Some utils for structs of numbers.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

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
