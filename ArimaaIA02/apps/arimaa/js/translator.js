var TRANSLATOR = TRANSLATOR || function() {

	function convert_to_gametree(notated_game) {
		var tokens = notated_game.split(" ");
		var moves = divide_into_moves(tokens);
		//GENERIC.for_each(moves, function(move) { GENERIC.log(move.steps); });
		//GENERIC.log(GENERIC.map(moves, function(move) { return move.steps}));
		return moves;
	}

	function isCamel(piece) {
		return piece.type === "camel";
	}
	
	function get_piece_shorthand(piece) {
		var character = isCamel(piece) ? "m" : piece.type.slice(0, 1);
	  return piece.side === ARIMAA.gold ? character.toUpperCase() : character.toLowerCase();
	}

	/**
	 get step-object as notated text
	*/
	function get_step_as_notated(step) {
		if(!!step.notated) return step.notated; // already notated
		if(step.type === "pass") return "";
		if(step.type === "setting") {
			get_piece_shorthand(step.piece) + 
			GENERIC.intToChar(GENERIC.charToInt('a')+step.to.col) + step.to.row;			
		} else {
			// normal move
			var x_d = step.to.col - step.from.col;
			var y_d = step.to.row - step.from.row;
			var direction = x_d > 0 ? "e" : x_d < 0 ? "w" : y_d < 0 ? "n" : "s"; 
			
			return 	get_piece_shorthand(step.piece) + 
							GENERIC.intToChar(GENERIC.charToInt('a')+step.from.col) +
							step.from.row +	direction;
		}									
	}
	
	
	function throw_unsupported(info) {
		GENERIC.log("unsupported: " + info);
		throw "Unsupported notation: " + info;
	}
	
	function get_moveid(token) {
		function get_side_shorthand(side) {
			if(side === 'w' || side === 'g') return 'g';
			if(side === 'b' || side === 's') return 's';
			throw_unsupported("side: " + side);
		}
		
		if(token === undefined || token.length === 0) return false;
		var value = parseInt(token.slice(0, 1));
		if(!isNaN(value)) {
			var move_number = token.slice(0, token.length - 1); // all but last is part of move number
			var side = token.slice(token.length - 1); // last is side (g or s)
			return move_number + get_side_shorthand(side);
		} else return false;
	}
	
	var pass_step = "pass";

	function create_move(steps, moveid) {
		return {
			'steps': steps,
			'id': moveid
		}
	}
				
	
	function divide_into_moves(tokens) {
		var result = [];
		
		for(var i = 0; i < tokens.length; ++i) {
			
			var moveid = get_moveid(tokens[i]);
			
			if(!!moveid) {
				var steps = get_steps(tokens.slice(i+1));
				
				if(steps.length < ARIMAA.steps_in_move) {
					steps.push(pass_step);
					var move = create_move(steps, moveid);
					result.push(move);
				} else {
					result.push(create_move(steps, moveid));
				}
			}
		}
		
		return result;
	}
	
	function get_step_from_token(token) {
		return token !== undefined && token !== "" ? token : false; 
	}
	
	function get_steps(tokens) {
		var result = [];
		
		for(var i = 0; i < tokens.length; ++i) {
			if(!!get_moveid(tokens[i])) return result;
			else {
				var step = get_step_from_token(tokens[i]);
				if(!!step) {
				  result.push(step);
				}
			}
		}
		
		return result;
	}	

 // yes, this can be simplified with ASCII translation, but who cares?
	
 var column_translator = { 
		"a": 0,
		"b": 1,
		"c": 2,
		"d": 3,
		"e": 4,
		"f": 5,
		"g": 6,
		"h": 7
	}
	
	var piece_translator = {
		"e": ARIMAA.elephant,
		"m": ARIMAA.camel,
		"h": ARIMAA.horse,
		"d": ARIMAA.dog,
		"c": ARIMAA.cat,
		"r": ARIMAA.rabbit
	}

	var dir = ARIMAA.directions;
	var direction_translator = {
		"w": dir.west, "<": dir.west,
		"e": dir.east, ">": dir.east,
		"n": dir.north, "^": dir.north,
		"s": dir.south, "v": dir.south
	}

	function piece_is_removed(step) {
		return step.slice(3, 4).toLowerCase() === "x";
	}
	
	function is_gold_piece(character) {
		return character.toUpperCase() === character;
	}
	
	function get_piece(character) {
		var piece = piece_translator[character.toLowerCase()];
		return ARIMAA.get_piece_with_side(piece, is_gold_piece(character) ? ARIMAA.gold : ARIMAA.silver);
	}
	
	function parse_row_from_setting_step(step) {
		return ARIMAA.board_height - parseInt(step.slice(2, 3));
	}
	
	function board_setting_step(step) {
		var piece = get_piece(step.slice(0, 1));
		var coordinate = {
			'col': column_translator[step.slice(1, 2)],
			'row': parse_row_from_setting_step(step)
		}
		
		return {
			'type': 'setting',
			'piece': piece,
			'to': coordinate
		}
	}
	
	function is_board_setting_step(step) {
		return step.length === 3; // a bit ugly way to test, sure
	}
	
	function parse_row_from_normal_step(step) {
		return parse_row_from_setting_step(step); // incidentally it's read in same way
	}
	
	function piece_removal_step(step) {
		var coordinate = {
			'col': column_translator[step.slice(1, 2)],
			'row': parse_row_from_normal_step(step)
		}
		
		return {
			'type': 'removal',
			'coordinate': coordinate
		}
	}
	
	function is_resign_step(step) { return step === "resigns"; }
	function is_pass_step(step) { return step === "pass"; }
	
	function convert_notated_step_to_coordinates(step) {
		if(is_board_setting_step(step)) {
			return board_setting_step(step);
		} else if(piece_is_removed(step)) {
			return piece_removal_step(step);
		} else if(is_resign_step(step)) {
			return {
				'type': 'resign'
			}
		} else if(is_pass_step(step)) {
			return {
				'type': 'pass'
			}
		}
		
		// otherwise it's normal move
		//FIXME: resignation move, what others?
		
		// example: cd7e means silver cat from d7 (row: 6, col: 3) to east (row: 6, col: 4)
		var piece = step.slice(0, 1); // piece can be ignored
		var coordinate_from = {
			'col': column_translator[step.slice(1, 2)],
			'row': parse_row_from_normal_step(step)
		}
		var direction = direction_translator[step.slice(3, 4)];
		var coordinate_to = ARIMAA.get_new_coordinate(coordinate_from, direction);
		
		return {
			'type': 'normal',
			'from': coordinate_from,
			'to': coordinate_to
		}
	}
	
	/****
	  FAN specific functionality; FIX: should be moved to own component
	****/
	
	/** Position markings to FAN */
	function get_markings(node, gametree) {
		var marking_symbol = "@";
		
		function coordinate_encoded(marking) {
			var coordinate_symbol = "x";
			return 	coordinate_symbol + 
							String.fromCharCode(parseInt(marking.col)+97) + // column 0 = 'a' 
							marking.row + "=" + marking.marking;			
		}
		
		var markings = gametree.get_markings(node.id);
		var result = GENERIC.reduce("", markings, function(acc, marking) {
				return acc + " " + marking_symbol + coordinate_encoded(marking); 
		});
		
		return $.trim(result);
	}
	
	/**
	  Move (and position if node !== undefined) to FAN.
	*/
	function move_as_notated(move, gametree, node) {
		function get_comment(object) {
			if(!!object && !!object.comment) {
				function withoutHyphen(value) { return value.replace("\"", ""); }
				return "\"" + withoutHyphen(object.comment) + "\"";
			} else return "";
		}
		var markings = [];
		var comment = [];
		
		var prefix = move.id + " " + get_comment(node);
		if(!!node) {
			prefix += get_markings(node, gametree);
		}
		
		var steps_content = GENERIC.reduce("", move.steps, function(result, step) {
				return result + (step.notated !== undefined ? " " + step.notated : "");
		});
		
		var postfix = get_comment(move); 
		
		return $.trim(prefix + " " + steps_content + " " + postfix);
	}
	
	/**
	  Traverses the gametree recursively, outer iteration is over main moves,
	  the inner one goes over variations, adding variations from whole subtree
	  before adding variant info at the same level.
	  
	  FIXME: if big tree, could blow up the stack since not tail-recursive
	  (and javascript doesn't support tail call elimination AFAIK)
	*/
	function convert_from_gametree(gametree) {
		function convert_from_node(node) {
			if(node === undefined) return "";

			var branches = node.moves_from_node.length;
			if(branches === 0) return "";

			var result = "";

			var main_line_move = node.moves_from_node[0];
			result += move_as_notated(main_line_move, gametree, node);
			
			for(var i = 1; i < node.moves_from_node.length; ++i) {
				var move = node.moves_from_node[i];
				
				result += " [ " + move_as_notated(move);
				
			  result += convert_from_node(move.nodehandle_after_move) + " ] ";										
			}
			
		  result += " " + convert_from_node(main_line_move.nodehandle_after_move);	
				
			return result;
		}

		var first = gametree.get_initial_nodehandle();
		return convert_from_node(first).replace("  ", " ");
	}
	
	/**************
	 FAN importing
	**************/

	function convert_FAN_to_AST(fan_game) {
		var tokens = fan_game.split(" ");
		tokens = GENERIC.reduce([], tokens, function(result, elem) {
				return !elem ? result : result.concat([elem]);
		});
		
		return read_body(tokens);
	}
	
	function read_body(tokens) {
		GENERIC.log("reading body");
		var rest = tokens;
		
		// gold player
		var result = read_setup_position(rest);
		var setup_gold = result.value;
		
		result = optional_unlimited(read_setup_variation, result.rest);
		var setup_variations_gold = result.value;
		
		// silver
		var result = read_setup_position(result.rest);
		var setup_silver = result.value;
		
		result = optional_unlimited(read_setup_variation, result.rest);
		var setup_variations_silver = result.value;
		
		result = read_normal_body(result.rest);
		var normal_body = result.value;
		
		return {
			'value': {
				'setup_gold': setup_gold,
				'setup_variations_gold': setup_variations_gold,
				'setup_silver': setup_silver,
				'setup_variations_silver': setup_variations_silver,
				'normal_body': result.value
			},
			'rest': result.rest
		}
	}
	
	function read_normal_body(tokens) {
		GENERIC.log("reading normal body");
		return optional_unlimited(read_position, tokens);
	}
	
	function read_setup_position(tokens) {
		GENERIC.log("reading setup position");
		var result = read_turn_id(tokens);
		var turn_id = result.value;
		result = optional(read_comment, result.rest);
		var comment = result.value;
		result = optional_unlimited(read_marking, result.rest);
		var markings = result.value;
		result = optional_unlimited(read_setup_step, result.rest);
		GENERIC.log("setup steps", result);
		var setup_steps = result.value;
		
		expect(16, setup_steps.length);
		
		return {
			'value': {
				'turn_id': turn_id,
				'comment': comment,
				'markings': markings,
				'setup_steps': setup_steps
			},
			'rest': result.rest
		}
	}
	
	function read_setup_variation(tokens) {
		GENERIC.log("reading setup variation");
		var result = read_token(tokens);
		expect("[", result.value);

		result = read_turn_id(result.rest);
		var turn_id = result.value;

		result = optional_unlimited(read_setup_step, result.rest);
		var setup_steps = result.value;

		// move comment
		result = optional(read_comment, result.rest);
		var comment = result.value;
		
		var end = read_token(result.rest);
		expect("]");
		
		return {
			'value': {
				'turn_id': turn_id,
				'setup_steps': setup_steps,
				'comment': comment
			},
			'rest': result.rest
		}
	}
	
	function read_setup_step(tokens) {
		GENERIC.log("reading setup step");
		var result = read_token(tokens);
		var rest = result.rest;
		
		result = read_char(result.value);
		var piece_id = result.value; //TODO check that valid piece id
		
		// column
		result = read_char(result.rest);
		var col = GENERIC.charToInt(result.value) - GENERIC.charToInt('a');
		if(!(col >= 0 && col < 8)) throw_unsupported("col for step: " + col + ", original: " + result.value);
		
		// row
		result = read_char(result.rest);
		var row = parseInt(result.value) - 1;
		if(!(row >= 0 && row < 8)) { throw_unsupported("row: " + row); }
		
		return {
			'value': {
				'piece_id': piece_id,
				'col': col,
				'row': row
			},
			'rest': rest
		}
		
	}
		
	function optional(read_fun, tokens) {
		//GENERIC.log("tokens", tokens);
		
		try {
		  var result = read_fun(tokens);
		  result.success = true;
		  return result;
		} catch(e) {
			return {
				'success': false,
				'value': undefined,
				'rest': tokens // original tokens
			}
		}		
	}

	function optional_unlimited(read_fun, tokens) {
		var all = [];
		var rest = tokens;

		// read as long optionally as is success		
		while(true) {
			var result = optional(read_fun, rest);

			GENERIC.log("optional result", result);
						
			if(result.success) {
				all.push(result);
				rest = result.rest;
			} else {
				return {
					// lift true elements from wrapper
					// FIXME: GENERIC.map(all.concat[result], function(elem) { return elem.value; }),
					'value': all,
					'rest': rest
				}
			}
		}
	}
	
	function read_position(tokens) {
		GENERIC.log("reading position");
		// i really wish javascript had destructing, e.g. var x, y = fun();
		var result = read_turn_id(tokens, REQUIRED);
		var turn_id = result.value;
		
		result = optional(read_comment, result.rest);
		var position_comment = result.value;
		
		result = optional_unlimited(read_marking, result.rest);
		var markings = result.value;
		
		result = read_move_content(result.rest, REQUIRED);
		var move_content = result.value;
		
		result = optional_unlimited(read_variation, result.rest);
		var variations = result.value;
		var rest = result.rest;
		
		return {
			'value': {
				'turn_id': turn_id,
				'position_comment': position_comment,
				'markings': markings,
				'move_content': move_content
			},
			'rest': rest
		}
	}
	
	function read_move(tokens) {
		GENERIC.log("reading move");
		var result = read_turn_id(tokens, REQUIRED);
		var turn_id = result.value;
		
		result = read_move_content(result.rest, REQUIRED);
		var move_content = result.value;
		var rest = result.rest;
		
		return {
			'value': {
				'turn_id': turn_id,
				'move_content': move_content
			},
			'rest': rest
		}
	}
	
	function read_token(tokens) {
		expect_one(tokens);

		GENERIC.log("reading token: ", tokens.slice(0, 1));
		
		return {
			'value': tokens.slice(0, 1)[0],
			'rest': tokens.slice(1)
		}
	}
	
	function read_char(token) {
		GENERIC.log("reading character");
		
		expect_one(token);

		return {
			'value': token.slice(0, 1),
			'rest': token.slice(1)
		}
	}
	
	function read_last_char(token) {
		GENERIC.log("reading last character");

		expect_one(token);
		
		return {
			'value': token.slice(token.length - 1, token.length),
			'rest': []
		}		
	}
	
	function expect_one(value) {
		if(!value || value.length === 0) throw_unsupported("expected 1 but empty: " + value);
	}
	
	function throw_expected(message, expected, was) {
		GENERIC.log(message + ", expected: " + expected + ", was: " + was);
		throw message + ", expected: " + expected + ", was: " + was;
	}

	function expect(expected, value) {
		if(expected !== value) {
		  throw_expected("value", expected, value);
		}
	}
	
	function expect_in(value, list) {
		var is_in = GENERIC.exists(list, function(elem) {
			if(elem === value) return true;
		});
		
		if(!is_in) {
			throw_expected("in list", list, value);
		}
	}
	
	function read_number(value) {
		GENERIC.log("reading number from", value);

		expect_one(value);
		
		return parseInt(value);
	}
	
	function read_turn_id(tokens) {
		GENERIC.log("reading turn_id");
		var result = read_token(tokens);
		var rest = result.rest;
		var token = result.value;

		var number = read_number(token.slice(0, token.length - 1)); // skip turn
		
		var turn = token.slice(token.length - 1);
		expect_in(turn, ['g', 's']);
		
		var turn_id = turn + number; 
		
		return {
			'turn_id': turn_id,
			'rest': rest
		}
	}
	
	function read_move_content(tokens) {
		GENERIC.log("reading move_content");
		
		var result = optional_unlimited(read_step_with_info, tokens);
		var steps_with_info = result.value;
		result = optional(read_comment, result.rest);
		var move_comment = result.value;
		var rest = result.rest;
		
		return {
			'value': {
				'steps_with_info': steps_with_info,
				'move_comment': move_comment
			},
			'rest': rest
		}
	}
	
	function read_variation(tokens) {
		GENERIC.log("reading variation");
		
		var result = read_token(tokens);
		expect("[", result.value);
		
		result = read_move(result.rest, REQUIRED);		
		var move = result.value;
		
		result = read_normal_body(result.rest, REQUIRED);
		var body = result.value;
		
		result = read_token(result.rest);
		expect("]", result.value);
		
		var rest = result.rest;
		
		return {
			'value': {
				'move': move,
				'body': body
			},
			'rest': rest
		}
	}
	
	function read_marking(tokens) {
		GENERIC.log("reading marking");
		
		var result = read_token(tokens);
		var rest = result.rest;
		
		result = read_char(result.value); 
		expect("@", result.value);
		var marking = result.rest;
		
		return {
			'marking': marking,
			'rest': rest
		}
	}
	
	function read_comment(tokens) {
		GENERIC.log("reading comment");
		
		var result = read_token(tokens);
		var rest = result.rest;
		
		result = read_char(result.value); 
		expect("\"", result.value);
		
		var comment = undefined;
		
		var index = result.rest.indexOf("\"");
		GENERIC.log("index", index);
		
		if(index < 0) {
			// comment end mark is in some of the following tokens
			var rest_of_comment = read_comment_postfix(rest);
			comment = result.value + rest_of_comment.value.comment;
			rest = rest_of_comment.rest;
		} else if(index < result.rest.length - 1) {
			throw_unsupported("comment symbol \" must not be in middle of a token (word)");
		} else if(index === result.rest.length - 1) {
			// whole token is a comment
			var comment = result.rest.slice(1, result.rest.length - 1);
		} else throw "index error in read_comment";
		
		return {
			'comment': comment,
			'rest': rest
		}
	}
	
	function read_comment_postfix(tokens) {
		GENERIC.log("reading comment postfix");
		var rest = tokens;
		var comment = "";
		
		while(true) {
			var result = read_token(rest);
			var index = result.value.indexOf("\"");
			if(index < 0) {
				comment += " " + result.value;
				rest = result.rest;
			} else if(index < result.value.length - 1) {
				throw_unsupported("comment symbol \" must not be in middle of a token (word)");
			} else {
				comment += " " + result.value.slice(0, result.value.length - 1);
				rest = result.rest;
				
				return {
					'value': {
						'comment': comment 
					},
					'rest': rest
				}
			}
		}
	}
	
	function read_step_with_info(tokens) {
		GENERIC.log("reading step with info");
		
		var result = read_step(tokens);
		var step = result.value;
		
		result = optional(read_comment, result.rest);
		var comment = result.value;
		
		// TODO 
		// IMPORTANT SPECIAL CASE
		// test whether the following token is another comment
		// if it is, then _this_ comment is for step
		// if it is not, then _this_ comment is for move, and should be ignored here
		
		result = optional_unlimited(read_marking, result.rest);
		var markings = result.value;
		var	rest = result.rest;
		
		return {
			'value': {
				'comment': comment,
				'markings': markings
			},
			'rest': rest
		}
	}
	
	function read_step(tokens) {
		GENERIC.log("reading step");
		
		var result = read_token(tokens);
		var rest = result.rest;

		// piece_id
		result = read_char(result.value);
		var piece_id = result.value;
		
		// column
		result = read_char(result.rest);
		var col = GENERIC.charToInt(result.value) - GENERIC.charToInt('a');
		if(!(col >= 0 && col < 8)) throw_unsupported("col for step: " + col + ", original: " + result.value);
		
		// row
		result = read_char(result.rest);
		var row = parseInt(result.value) - 1;
		if(!(row >= 0 && row < 8)) { throw_unsupported("row: " + row); }
			
		// direction
		result = read_char(result.rest);
		var direction = result.value;
		expect_in(direction, ["e", "w", "n", "s"]);
		
		var step = piece_id + col + row + direction;
		
		GENERIC.log("step", step);
		
		return {
			'value': {
				'step': step
			},
			'rest': rest
		}
	}
	
	/**
	  Converts textual FAN to objects that have gametree-like structure
	*/
	function convert_from_FAN_to_gametree(text) {
		var tokens = notated_game.split(" ");
 
		//FIXME: header
		var body = read_body(tokens);
	}
	
	function get_piece_from_notation(notation) {
		return get_piece(notation.charAt(0));
	}
	
	return {
		'convert_FAN_to_AST': convert_FAN_to_AST,
		'convert_from_gametree': convert_from_gametree,
	  'convert_to_gametree': convert_to_gametree,
	  'convert_notated_step_to_coordinates': convert_notated_step_to_coordinates,
	  'get_step_as_notated': get_step_as_notated,
	  'get_piece_from_notation': get_piece_from_notation
	};
}();


//FIMXE for testing only
$(function() {
	var FAN_game = '1g  Ra1 Db1 Rc1 Rd1 De1 Rf1 Rg1 Rh1 Ra2 Hb2 Cc2 Md2 Ee2 Cf2 Hg2 Rh2 1s   ra7 hb7 cc7 ed7 me7 df7 hg7 rh7 ra8 rb8 rc8 dd8 ce8 rf8 rg8 rh8 2g   Ee2n Ee3n Ee4n Hg2n 2s   ed7s ed6s ed5s hg7s 3g   De1n Ee5w Ed5n Hb2n [ 3g ea3s db4w ch4e hg4n ]  3s   ed4s hb7s ra7e rh7w 4g "this is good position"  Db1n Hb3n Hb4n Db2n 4s   ed3n Md2n ed4w Md3n "very good move" 5g   Hb5w De2w Rc1w Rd1w [ 5g ha5n hb4s hd4w hf4e ]  5s   ec4n Md4w ec5w Mc4n 6g   Ed6s Mc5s Ed5w Mc4e 6s   eb5s eb4e Db3n me7w 7g   Ec5e Md4s Ha5s Db4s';
	//console.log("FAN -> AST", TRANSLATOR.convert_FAN_to_AST(FAN_game));	
});
