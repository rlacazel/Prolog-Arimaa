
function generate_moves(moves) {
	
	var imported = create_import_game(moves);
	
	var result = [];

	//GENERIC.log("generate");
	while(true) {
		var move = imported.get_steps_in_next_move();
		
		if(!!move) {
			//GENERIC.for_each(result, function(move) { GENERIC.log("yo", move.steps); });
			//GENERIC.log(move.steps);			
			result.push(move); 
		} else {				
			 
			return result;
		}
	}// while(move.steps.length !== 0);
	
	//result.pop(); shall we leave the empty move?
	
	//return result;
}

function create_import_game(moves) {
	var current_move = -1;
	
	function create_move(move, steps) {
	//	GENERIC.log("id", move);
	//	GENERIC.log("id", move.id);
		
		return {
			'id': move.id,
			'steps': steps
		}
	}
	
	function get_steps_in_next_move() {
		current_move++;

		if(current_move >= moves.length) {
			return false;
		}
		
		var move = moves[current_move];
		
		var result = [];
		
		if(move.steps.length === 0) {
			GENERIC.log("pass");
			//result.push(pass_step);
		} else {
			for(var i = 0; i < move.steps.length; ++i) {
				var nextstep = move.steps[i];
				var step = TRANSLATOR.convert_notated_step_to_coordinates(nextstep);
				step.notated = nextstep;
				// if step is only indicating a removal, let's skip it since it is done by the game logic, same goes for pass
				if(step.type !== 'removal' && step.type !== 'pass') {
					result.push(step);
				}
			}
		}
		
		return create_move(moves[current_move], result);
	}
	
	return {
		'get_steps_in_next_move': get_steps_in_next_move,
	}
}
