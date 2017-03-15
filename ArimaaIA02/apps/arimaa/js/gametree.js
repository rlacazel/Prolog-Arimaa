/**
 gametree consists of a) nodehandles (which is isomorphically position)
                      b) and moves of nodes
 
 gametree:
   node1 (start position)
     |- move0 -> node2 |- move0 -> node3 |- ... # first "row" is considered main line
     |                 |- move1 -> node4  # a variation
     |
     |- move1 -> node5 |- move0 -> node6
     
 * move index is local to node (starts from 0)
 * node id is global
     
*/

function create_gametree() {
	var ids = 0;
	var first_id = 1;
	var nodes = [];

	function get_unique_id() { ids++; return ids; }
	
	function make_steps(gamestate_prev, board_prev, steps) {
		function create_result(board_, state_) {
			return {
				'gamestate': state_,
				'board': board_
			}
		}
		
		var state = gamestate_prev;
		var board = board_prev;

		for(var i = 0; i < steps.length; ++i) {
			var step = steps[i];
			
			if(step.type === 'setting') {
				var result = ARIMAA.add_piece(step.piece, step.to, board, state);
				state = result.gamestate;
				board = result.board;
			} else if(step.type === 'pass') { // explicit passing
	  		var result = ARIMAA.pass(board, state);
	  		return create_result(result.board, result.gamestate);	  		
			} else {
				var result = ARIMAA.move_piece(state, board, step.from, step.to);
				state = result.gamestate;
				board = result.board;
				//show_dom_board(board, state);
			}
		}
		
		// after given steps check:
		
		// implicit passing
		// since in one move there can be strictly either setting or normal moves,
		// we can infer that if the ARIMAA.steps_in_move amount of steps isn't made, the last one is a pass
	  if(steps.length === 0 || steps[0].type !== 'setting') {
	  	if(steps.length < ARIMAA.steps_in_move) {
	  		result = ARIMAA.pass(board, state);
	  		return create_result(result.board, result.gamestate);
	  	}
	  }  
	  
	  return create_result(board, state);
	}
	
	
	var initial_nodehandle = (function() {
		var gamestate = ARIMAA.get_initial_gamestate();
		var board = empty_board();
		var id = get_unique_id();
		
		var initial_handle = {
			'id': id,
			'board': board,
			'gamestate': gamestate,
			'moves_from_node': [],
			'comment': ''
		}
		
		nodes[id] = initial_handle;
		return initial_handle;
	})();
	
	function get_initial_nodehandle() { return initial_nodehandle; }
	
	// TODO: think whether it would be better to link with ids instead of object references
	// return move index in nodehandle_from
	function link_nodes(move, nodehandle_from, nodehandle_to) {
		move.nodehandle_after_move = nodehandle_to;
		nodehandle_from.moves_from_node.push(move);
	  nodehandle_to.move_index_from_previous = nodehandle_from.moves_from_node.length - 1; 
	  nodehandle_to.previous_nodehandle = nodehandle_from;
		return nodehandle_from.moves_from_node.length - 1;
	}
	
	function make_move(move, nodehandle) {
		var gamestate_prev = nodehandle.gamestate;
		var board_prev = nodehandle.board;

		var result = make_steps(gamestate_prev, board_prev, move.steps);
		
		var id = get_unique_id();
		
		var new_nodehandle = {
			'id': id,
		  'board': result.board,
		  'gamestate': result.gamestate,
		  'moves_from_node': [],
		  'comment': ''
		}

		var move_index = link_nodes(move, nodehandle, new_nodehandle);
		
		nodes[id] = new_nodehandle;
		
		return {
			'nodehandle': new_nodehandle,
			'move_index': move_index
		}
	}
	
	function next_nodeid(prev_node_id, move_index) {
		if(prev_node_id === undefined) throw "undefined prev_node_id";
		else if(prev_node_id > ids) throw "prev_node is too big: " + prev_node;
		var node = select_node(prev_node_id);
		if(node === undefined) throw "node is undefined";
		
		var prev_node_moves = select_node(prev_node_id).moves_from_node;
		
		if(prev_node_moves === undefined) {
			GENERIC.log(prev_node_moves);
			throw "prev_node_moves is undefined";
		}
		
		if(prev_node_moves.length === 0) return undefined;
		
		if(move_index > prev_node_moves.length - 1) {
			GENERIC.log("move_index", move_index);
			GENERIC.log("prev_move_nodes", prev_node_moves);
			throw "move_index >= moves length: " + move_index + " >= " + prev_node_moves.length;
		}
		var move = prev_node_moves[move_index !== undefined ? move_index : 0]
		
		GENERIC.log("prev_nodes_move", move);
		return move.nodehandle_after_move !== undefined ?
					 move.nodehandle_after_move.id : prev_node_id; 
//	else return prev_node_id + 1; //FIXME: this is ugly hack
	}
	
	function previous_nodeid(prev_node_id) {
		if(prev_node_id === undefined) throw "prev_node_id is undefined";
		else if(prev_node_id < first_id) throw "illegal prev_node_id: " + prev_node_id;
		else if(prev_node_id === first_id) return first_id;
		else return	select_node(prev_node_id).previous_nodehandle.id;
//			
		//else return prev_node_id - 1;
	}
	
	function previous_move() {
	}
	
	function select_node(id) {
		return nodes[id];
	}
	
	function get_nodehandles() {
		var result = [];
		
		for(var i = first_id; i <= ids; ++i) {
			result.push(nodes[i]);
		}
		
		return result;
	}
	
	function comment_node(text, id) {
		select_node(id).comment = text;
	}

	function comment_move(text, move) {
		move.comment = text;
	}
	
	function toggle_marking(nodeid, coordinate, marker){
		
		var node = select_node(nodeid);
		if(node.markings === undefined) {
			node.markings = {};
		}
		
		var old = node.markings[coordinate.row];
		
		if(old === undefined) node.markings[coordinate.row] = {}
		old = node.markings[coordinate.row][coordinate.col];
		
		if(old === undefined) {
			node.markings[coordinate.row][coordinate.col] = []
			old = node.markings[coordinate.row][coordinate.col];
		}
		
	  var index =	old.indexOf(marker);
	  if(index === -1) {
	  	old.push(marker);
	  } else {
	  	old.splice(index, index+1);
	  }
	}
	
	function get_markings(id) {
		var node = select_node(id);
		if(node.markings === undefined) return [];
		
		var result = [];

		//FIXME: quite horrible
		for(var row = 0; row < 8; ++row) {
			var r = node.markings[row];
			if(r === undefined) continue;
			
			for(var col = 0; col < 8; ++col) {
				 if(r[col] !== undefined) {
				 	var all = r[col];
				 	for(var i = 0; i < all.length; ++i) {
						result.push({
							'col': parseInt(col),
							'row': parseInt(row),
							'marking': all[i]
						});
					}
				}
			}
		}
    
    return result;
	}
	
	function clear_markings(id) {
		var node = select_node(id);
		node.markings = undefined;
	}
	
	function get_lastid() {
		var node = select_node(first_id);
		while(node.moves_from_node !== undefined && node.moves_from_node.length > 0) {
			node = node.moves_from_node[0].nodehandle_after_move;
		}

		//last one is the position before final move		
		return node.previous_nodehandle.id;
	}
	
	function delete_position(node_id, move_index) {
		var node = select_node(node_id);
		if(!!node.main_line && move_index === 0) return false;
		var deleted = [];
		
		if(node.moves_from_node.length === 0) {
			throw "not supported to delete singletonafter)";
		} 	

		if(move_index > 0) {
			// removing subvariation wholly
			for(var i = move_index + 1; i < node.moves_from_node.length; ++i) {
				// moves after deleted one will be indexed earlier after the splice that follows later
				node.moves_from_node[i].nodehandle_after_move.move_index_from_previous--;
			}
	
			node.moves_from_node.splice(move_index, move_index);
			return node
		} else { // move_index === 0
			// removing continuation
			for(var i = move_index + 1; i < node.moves_from_node.length; ++i) {
				// moves after deleted one will be indexed earlier after the splice that follows later
				node.moves_from_node[i].nodehandle_after_move.move_index_from_previous--;
			}
	
			node.moves_from_node.splice(move_index, move_index + 1);
			return node
		}
	}
	
	function move_variation_up(node_id, move_index) {
		if(move_index === 0) return false; // not a variation
		if(move_index === 1) return false; // it's already top variation
		
		var node = select_node(node_id);
		
		var move_to = node.moves_from_node[move_index-1];
		var move_from = node.moves_from_node[move_index];
		
		// swap the moves in "position" node, where variations are in
		node.moves_from_node[move_index-1] = move_from;
		node.moves_from_node[move_index] = move_to;
		
		// swap indexes info for nodes (info)
		move_from.nodehandle_after_move.move_index_from_previous = move_index - 1;
		move_to.nodehandle_after_move.move_index_from_previous = move_index;
		
		return true;
	}

	function move_variation_down(node_id, move_index) {
		if(move_index === 0) return false; // not a variation
		
		var node = select_node(node_id);

		// if it's already bottom variation, return
		if(move_index === node.moves_from_node.length - 1) return false; 
		
		var move_to = node.moves_from_node[move_index+1];
		var move_from = node.moves_from_node[move_index];
		
		// swap the moves in "position" node, where variations are in
		node.moves_from_node[move_index+1] = move_from;
		node.moves_from_node[move_index] = move_to;
		
		// swap indexes info for nodes (info)
		move_from.nodehandle_after_move.move_index_from_previous = move_index + 1;
		move_to.nodehandle_after_move.move_index_from_previous = move_index;
		
		return true;
	}
	
  return {
  	'get_initial_nodehandle': get_initial_nodehandle,
    'make_move': make_move,
    'next_nodeid': next_nodeid,
    'previous_nodeid': previous_nodeid,
    'select_node': select_node,
    'get_nodehandles': get_nodehandles,
    'comment_move': comment_move,
    'comment_node': comment_node,
    'toggle_marking': toggle_marking,
 		'get_markings': get_markings,
 		'clear_markings': clear_markings,
 		'get_lastid': get_lastid,
 		'delete_position': delete_position,
 		'move_variation_up': move_variation_up,
 		'move_variation_down': move_variation_down
  }
}
