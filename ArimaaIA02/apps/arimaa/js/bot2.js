var BOT2 = BOT2 || function() {
	var tries = 30;

	var side = ARIMAA.silver;
	var opponent_side = ARIMAA.gold;
	
	function manhattan(row, col, row2, col2) {
		return Math.abs(col - col2) + Math.abs(row - row2);
	}
	
	function applyFun(board, initial, fun) {
		var acc = initial;
		
		for(var j = 0; j < ARIMAA.board_height; j++) {
			var row = board[j];
			for(var i = 0; i < ARIMAA.board_width; i++) {
				acc = fun(acc, row[i], j, i);
				if(acc === undefined) {
					//console.log(i, j, initial);
					//console.log(arguments.callee.caller);
					throw "fail: " + arguments.callee.caller.toString();
				}
			}
		}
		
		return acc;
	}
	
	function value_elem(elem) {
		if(!elem || !elem.type) return 0;
		return ({
			'elephant': 100,
			'camel': 50,
			'horse': 30,
			'dog': 20,
			'cat': 10,
			'rabbit': 5
		}[elem.type]);
	}
	
	function total_pieces(board, piece_side) {
		return applyFun(board, 0, function(acc, elem) {
			if(!elem || !elem.type) return acc;
			var res = acc + value_elem(elem) * (piece_side === elem.side ?	1 : -1);
			if(res === undefined){
				//console.log(value_elem(elem));
			  //console.log(elem);
			}
			return res;
		});
	}

	// hard distance without taking obstructing pieces into account
	function distance(row, col, piece, side, board) {
		return applyFun(board, 0, function(acc, elem, j, i) {
			if(piece.type === elem.type && elem.side === side) {
				return acc + Math.abs(row-j) + Math.abs(col-i);
			} else return acc;
		});
	}
	
	function in_board(row, col) { return row >= 0 && row < ARIMAA.board_height && col >= 0 && col < ARIMAA.board_width; } 
	
	/**
	  Get nearest given piece's coordinate. Note that the side which the piece is on
	  is look from piece_side parameter, not from piece object
	*/
	function nearest(row, col, piece, piece_side, board) {
		for(var d = 0; d < ARIMAA.board_width; ++d) {
			// vertical
			for(var h = -d; h <= d; ++h) {
				var r = row + h;
				var c = col + d; // right side, column stays the same in the inner loop
				if(in_board(r, c)) {
					var p = board[r][c]; 
					if(p.type === piece.type && p.side === piece_side) {
						return { 'row': r, 'col': c }
					}
				}

				var r = row + h;
				var c = col - d; // left side, column stays the same in the inner loop
				if(in_board(r, c)) {
					var p = board[r][c]; 
					if(p.type === piece.type  && p.side === piece_side) {
						return { 'row': r, 'col': c }
					}
				}
			}
			
			// horizontal
			for(var h = -d; h <= d; ++h) {
				var r = row + d;  // top side, row stays the same in the inner loop
				var c = col + h;
				if(in_board(r, c)) {
					var p = board[r][c]; 
					if(p.type === piece.type && p.side === piece_side) {
						return { 'row': r, 'col': c }
					}
				}

				var r = row - d; // bottom side, row stays the same in the inner loop
				var c = col + h; 
				if(in_board(r, c)) {				
					var p = board[r][c]; 
					if(p.type === piece.type  && p.side === piece_side) {
						return { 'row': r, 'col': c }
					}
				}
			}			
		}
		
		return false
	}
	
	function nearest_distance(row, col, piece, piece_side, board) {
		var nearest_elem = nearest(row, col, piece, piece_side, board);
		if(!nearest_elem) return 0;
	
		//console.log("nearest", row, col, "=", nearest_elem.row, nearest_elem.col, piece);
		return Math.abs(row - nearest_elem.row) + Math.abs(col - nearest_elem.col);
	}	
	
	function isElephant(piece) { return piece.type === "elephant"; }
	function isCamel(piece) { return piece.type === "camel"; }
	function isHorse(piece) { return piece.type === "horse"; }
	function isDog(piece) { return piece.type === "dog"; }
	function isCat(piece) { return piece.type === "cat"; }
	function isRabbit(piece) { return piece.type === "rabbit"; }
	
	function distance_to_goal(row) {
		return side === ARIMAA.gold ? row : 7 - row;
	}
	
	function in_trap(row, col) {
		return GENERIC.exists(ARIMAA.traps, function(trap) {
			return trap[0] === row && trap[1] === col; 
		});
	}
	
	function in_trap_value(elem) {
		if(isElephant(elem)) return 5;
		else if(isRabbit(elem)) return 70;
		else if(isCamel(elem)) return 50;		
		else if(isHorse(elem)) return 35;
		else return 20;
	}
	
	function near_trap_value(row, col, board, initial, fun) {
		var acc = initial;
		for(var dx = -2; dx < 2; ++dx) {
			for(var dy = -2; dy < 2; ++dy) {
				var r = row + dy, c = col + dx; 
				if(manhattan(row, col, r, c) <= 2) {
					var piece = board[r][c];
					acc = fun(acc, piece);
				}
			}
		}
		
		//if(acc > 0)console.log("acc", acc);
		return acc;
	}
	
	function values_at(row, col, board, piece_side) {
		return near_trap_value(row, col, board, 0, function(acc, piece) {
				if(!!piece.type && piece.side === piece_side) {
				//console.log(piece.side);
				return acc + Math.abs(value_elem(piece));
			}	else return acc;
		});
	}
	
	function opponent_traps_strength(board) {
		var trap1_value = values_at(6, 3, board, opponent_side);		
		var trap2_value = values_at(6, 6, board, opponent_side);

		var t1 = {
			'value': trap1_value,
			'row': 6, 'col': 3
		}
		var t2 = {
			'value': trap2_value,
			'row': 6, 'col': 6
		}

		return {
			'trap1': t1,
			'trap2': t2
		}
	}

	function near_trap_values(row, col, board) {
		var trap_strength = opponent_traps_strength(board);
		
		var weaker, stronger;
		if(trap_strength.trap1.value > trap_strength.trap2.value) {
			stronger = trap_strength.trap1;
			weaker = trap_strength.trap2;
		} else {
			stronger = trap_strength.trap2;
			weaker = trap_strength.trap1;
		}
		
		// encourage weaker
		var d4 = manhattan(row, col, weaker.row, weaker.col);
		d4 *= -50;
		
		// discourage stronger		
		var d5 = manhattan(row, col, stronger.row, stronger.col);
		if(d5 <= 3) d5 *= 50; else d5 = 0;
		
		return d4 + d5;		
	}	
	
	function positional_value(board) {
		return applyFun(board, 0, function(acc, elem, row, col) {
			if(!elem.type) return acc;
			if(elem.side === opponent_side) {
				if(in_trap(row, col)) {
					return acc + in_trap_value(elem);
				}	else if(isCamel(elem)) {
					var d = distance(row, col, ARIMAA.elephant, opponent_side, board);
					return acc + d;					
				} else if(isRabbit) {
					var row_pref = distance_to_goal(row, col);				
					//return acc + row_pref * 20; 
				} else return acc;
			}

			var trapped_add = in_trap(row, col) ? -1 * in_trap_value(elem) : 0;
			var near_trap_add = near_trap_values(col, row, board);
 			var piece_add = 0;
 			
			if(isElephant(elem)) {
				var d = distance(row, col, ARIMAA.camel, opponent_side, board);
				// the less the distance, the better
				piece_add = -d * 50;
				//near_trap_add =- 1; // opposite to normal piece
			} else if(isCamel(elem)) { 
				near_trap_add = 0;
			} else if(isHorse(elem)) {
				var d1 = nearest_distance(row, col, ARIMAA.cat, opponent_side, board);
				var d2 = nearest_distance(row, col, ARIMAA.dog, opponent_side, board);
				var d3 = nearest_distance(row, col, ARIMAA.rabbit, opponent_side, board);

				piece_add = 10*(-3*d1 + -1*d2 + -5*d3);
			} else {
				//near_trap_add = 0;
				var col_pref = col === 0 || col === 1 || col === 6 || col === 7 ? 1 : 0;
				var row_pref = distance_to_goal(row, col);
				if(isRabbit) {
					piece_add = -5 * col_pref + row_pref * -50; 
				} else {
					piece_add = col_pref + -row_pref;
				}
			}
			
			if(isCat(elem) || isDog(elem)) {
				near_trap_add = 0;
			}
			
			return acc + piece_add;
			//return acc + trapped_add + near_trap_add + piece_add; 
		});
	}
	
	/**
	  Get all that have the best value, i.e. values[j] === best >= values[i].
	*/
	function max_values(values) {
		var bests = [{ 'index': 0, 'value': values[0] }];
		
		for(var i = 1; i < values.length; ++i) {
			var value = values[i];
			
			if(value > bests[0].value) {
				// the only best value so far
				bests = [{
					'value': value,
					'index': i 
				}]
			} else if(value === bests[0].value) {
				// there are several best values
				bests.push({
					'value': value,
					'index': i 
				});
			}
		};
		
		return bests;
	}
	
	function good_steps(steps, board, gamestate) {
		if(steps.length === 0) return [];
		var values = GENERIC.map(steps, function(step) {
			var after = ARIMAA.move_piece(gamestate, board, step.from, step.to);
			return total_pieces(after.board, side);
		});
		
		return GENERIC.map(max_values(values), function(value) { return steps[value.index]; })		
	}
	
	function legal_steps(board, gamestate) {
		var result = [];
		for(var j = 0; j < ARIMAA.board_height; ++j) {
			var row = board[j];
			for(var i = 0; i < ARIMAA.board_width; ++i) {
				var piece = row[i];
				var moves = ARIMAA.legal_moves(gamestate, board, { 'row': j, 'col': i});
				GENERIC.for_each(moves, function(move) {
					result.push({
							'from': { 'row': j, 'col': i },
							'piece': piece,
							'to': move
					});
				});
			}
		}
		
		return result;
	}
	
	function smart_steps(steps, board, gamestate) {
		if(steps.length === 0) return [];
		var values = GENERIC.map(steps, function(step) {
			var after = ARIMAA.move_piece(gamestate, board, step.from, step.to);
			return positional_value(after.board);
		});
		
		return GENERIC.map(max_values(values), function(value) { return steps[value.index]; })		
	}
	
	function get_steps(board, gamestate) {
		var result = [];
		
		for(var i = 0; i < 4; ++i) {
			var steps = legal_steps(board, gamestate);
			steps = good_steps(steps, board, gamestate);
			//steps = smart_steps(steps, board, gamestate);
			
			if(steps.length === 0) {
				return [];
			} else {
				var random = parseInt(Math.random() * steps.length);
				var step = steps[random];
		
				result.push({
					'piece': step.piece, 
					'from': step.from,
					'to': step.to
				});
				
				var after = ARIMAA.move_piece(gamestate, board, step.from, step.to);
				board = after.board;
				gamestate = after.gamestate;
			}
		}
		
		return result;
	}

	function do_steps(steps, board, gamestate) {		
		GENERIC.for_each(steps, function(step) {
			var res = ARIMAA.move_piece(gamestate, board, step.from, step.to);
			board = res.board;
			gamestate = res.gamestate;
		});
		
		return {
			'board': board,
			'gamestate': gamestate
		}
	}
	
	function deep_steps(board, gamestate) {
		var best = undefined;
		var best_index = 0;
		var result = undefined;
		 
		for(var i = 0; i < tries; ++i) {
			var steps = get_steps(board, gamestate);
			var after = do_steps(steps, board, gamestate);
			if(ARIMAA.is_gameover(after.board, after.gamestate)) {
				return steps; // immediate victory
			} else {
				var value = 
					total_pieces(after.board, side);// + positional_value(after.board); 
				if(!best || value > best) {
					best = value; best_index = i; result = steps; 
				}
			}
		}

		return result;
	}
	

	function try_to_goal_rabbit(coordinate, board, gamestate, path) {
		var moves = ARIMAA.legal_moves(gamestate, board, coordinate);
		
		for(var i = 0; i < moves.length; ++i) {
			var move = moves[i];
			var result = ARIMAA.move_piece(gamestate, board, coordinate, move);
			if(result.gamestate.turn === gamestate.turn) {
				 
				var new_path = path.concat([{
					'from': coordinate,
					'to': move,
					'piece': board[coordinate.row][coordinate.col]
				}]);
				var recur = try_to_goal_rabbit(move, result.board, result.gamestate, new_path);
				if(!!recur) return recur;
			}
			if(ARIMAA.is_gameover(result.board, result.gamestate)) {
				// path to victory
				return path.concat([{
					'from': coordinate,
					'to': move,
					'piece': board[coordinate.row][coordinate.col]
				}]);  
			}
		};
		
		return false;
	}
		
	function try_to_goal(board, gamestate) {
		return applyFun(board, false, function(acc, piece, j, i) {
			if(!!piece.type && isRabbit(piece)) {
				var res = try_to_goal_rabbit({'row': j, 'col': i}, board, gamestate, []);
				if(!!res) return res; // found path to victory
				else return acc;
			} else return acc;
		});
	}
	
	function python_dive(board, gamestate, movenum) {
		var deepness = 3;
		var steps = get_steps(board, gamestate);
		var after = do_steps(steps, board, gamestate);
		
		if(ARIMAA.is_gameover(after.board, after.gamestate)) {
			return gamestate.turn; // immediate victory
		} else {
			if(movenum < deepness) {
				return python_dive(after.board, after.gamestate, movenum + 1);
			} else {
				//return positional_value(after.board) + 100 * total_pieces(after.board, side);
				return total_pieces(after.board, side);
			}
		}
	}
	
	function python_steps(board, gamestate) {
		var moves_total = 5;
		var tries_total = 300;
		
		var values = {}
		var best_value;
		var best_steps;
		
		for(var move = 0; move < moves_total; ++move) {
			values[move] = []; // initial value for move
			var steps = get_steps(board, gamestate);
			for(var i = 0; i < tries_total; ++i) {
				var after = do_steps(steps, board, gamestate);
				var value = python_dive(after.board, after.gamestate, 1);
				if(value === side) value = 1000;
				else if(value === opponent_side) value = -1000;
				values[move].push(value);
				//values[move] += value;
			}
			
			values[move].sort();
			//console.log(values[move]);
//			throw "foo";
			var chosen = values[move][values[move].length/2];
			//var chosen = values[move][values[move].length-1];
			//var chosen = values[move][0];
			//var chosen = GENERIC.reduce(values[move], 0, function(acc, e) { return acc+e; });
			
			if(!best_value || chosen > best_value) {
				best_value = chosen;
				best_steps = steps;
			}
		}
				
		return best_steps;		
	}
	
	function get_move(board, gamestate) {
		var steps = python_steps(board, gamestate);

		return {
			'steps': steps
		}
	}

	return {
		get_move: get_move
	}
}();
