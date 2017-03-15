function create_selection_handler(gametree, viewer) {
	var paths = [];
	// primary piece, who moves, pushes, pulls...
	var subject;
	// piece that is pushed, or pulled
	var target;

	function clear_selected() {
		subject = undefined; target = undefined; 
	}
	
	function currently_selected(coordinate) { return same_coordinates(subject, coordinate); }
	function has_selected() { return !!subject; }
	
	function click_at(coordinate) {
		if(same_coordinates(coordinate, subject)) { return false; }
		
		subject = coordinate;
		paths = [];
		//add_step(coordinate, [], paths);
		generate_steps(coordinate, viewer.board(), viewer.gamestate(), [coordinate], paths);
		return paths;
	}

	function same_coordinates(a, b) {
		return a !== undefined && b !== undefined && a.row === b.row && a.col === b.col;
  }
	
  function add_step(move, path, acc) {
  	acc.push({
  		'move': move,
  		'path': path
  	});
  }
  
	function generate_steps(coordinate, board, gamestate, path, acc) {
		var moves = ARIMAA.legal_moves(gamestate, board, coordinate);
		
		GENERIC.for_each(moves, function(move) {
			add_step(move, path, acc);
			get_square(move.row, move.col).addClass('selection_option');

			var result = ARIMAA.move_piece(gamestate, board, coordinate, move);
			if(result.gamestate.turn === gamestate.turn) {
				generate_steps(move, result.board, result.gamestate, path.concat([move]), acc);
			}
		});		
	}	
	
	function select_at(coordinate) {
		if(!coordinate || !subject || same_coordinates(coordinate, subject)) {
			return false;
		}
			
		var best;
		
		for(var i = 0; i < paths.length; ++i) {
			if(same_coordinates(paths[i].move, coordinate)) {
				if(!best || paths[i].path.length < best.length) {
					best = paths[i].path.concat(paths[i].move);
				}
			}
		}
		
		target = coordinate;
		subject = undefined;
		
		return best;
	}
	
	return {
		click_at: click_at,
		select_at: select_at,
		currently_selected: currently_selected,
		clear_selected: clear_selected,
		has_selected: has_selected
	}
}
