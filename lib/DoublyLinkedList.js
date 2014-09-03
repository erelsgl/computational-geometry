/**
 * Add some extensions to the doubly-linked list of the JSClass library.
 */

var DoublyLinkedList = require('jsclass/src/linked_list').LinkedList.Doubly.Circular;

DoublyLinkedList.prototype.toString = function() {
		var s = "";
		this.forEach(function(node, i) {
			var sfield = "";
			for (var field in node) {
				if (node.hasOwnProperty(field) && field!='prev' && field !='next' && field !='list') {
					if (sfield) sfield+=",";
					sfield += field+":"+node[field];
				}
			}

			if (s) s+=",\n ";
			s +="{"+sfield+"}"
		});
		return "["+s+"]";
}

DoublyLinkedList.prototype.pluck = function(field) {
		var values = [];
		this.forEach(function(node) {
			values.push(node[field]);
		})
		return values;
}
	
DoublyLinkedList.prototype.isEmpty = function() {
		return this.length == 0; 
}
