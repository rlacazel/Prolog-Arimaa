function create_gametree_utils(gametree) {
	/**
	  Get the last node in variation's main line
	*/
	function get_last_node_with_moves_in_line(id) {
		var node = gametree.select_node(id);

		while(node.moves_from_node.length > 0) {
			if(node.moves_from_node[0].nodehandle_after_move.moves_from_node.length > 0) {
				node = node.moves_from_node[0].nodehandle_after_move;
			} else break;
		}
		
		return node;
	}
	
	return {
		get_last_node_with_moves_in_line: get_last_node_with_moves_in_line
	}
}
