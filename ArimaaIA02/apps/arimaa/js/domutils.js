/**
  Utility functions for DOM handling
*/

	function getSelectorForNode(nodeid, move_index) {
		if(move_index === undefined || move_index === "") throw "move_index invalid: " + move_index;
	  return 'li[nodeid="'+nodeid.toString()+'"][move_index="' + move_index.toString() + '"]';
	}
	
	function getNode(nodeid, move_index) {
		//var selector = 'li[nodeid="'+nodeid.toString()+'"][move_index="' + move_index.toString() + '"]';
		var selector = getSelectorForNode(nodeid, move_index);
		return $('.gametree').find(selector);
	}
	
	function nodeId(elem) { return parseInt(elem.attr('nodeid')); }
	function moveIndex(elem) { return parseInt(elem.attr('move_index')); }
	

	function turn_prefix_from_node(node) { 
  	return turn_prefix(node.gamestate.turn); 
  }
  
  function turn_prefix(turn) { 
  	return turn.side.slice(0, 1); 
  } 
