
var output_console = null;
var stdout_buffer;
var bot_vs_bot = false;

var ARIMAA_MAIN = ARIMAA_MAIN || function() {
	var bot = BOT;
	var action_buffer = []; // contains delayed actions, i.e. functions
	var human_side = ARIMAA.gold;
	var bot_side = ARIMAA.silver;
	var selection_handler;
	var current_nodehandle;
	var show_step_delay_human = 200; // milliseconds between steps for human
	var show_step_delay_bot = 450; // milliseconds between steps for bot
	var current_show_step_delay = show_step_delay_bot;
	
	var gametree, viewer, gametree_utils;
	//var arrow_handler;
	var current_move_index = 0;
	var bot_showing = false;
	
	var stepbuffer = [];
	
	var showing_slowly = false; // when moves are showed slowly, controls are locked
	
	function get_current_node() { return gametree.select_node(viewer.current_id()); }

	function make_step_to_gametree(step) {
		GENERIC.log("pushing to stepbuffer");
		// step = { 'from': selected, 'to': new_coordinate, 'piece': piece }
		step.notated = TRANSLATOR.get_step_as_notated(step);
		stepbuffer.push(step);
	}	

	function get_stepbuffer_as_notated() {
		var notated = GENERIC.reduce("", stepbuffer, function(result, step) {			
			return result + " " + TRANSLATOR.get_step_as_notated(step);
		});
		
		return $.trim(notated);
	}

	function show_pass_if_legal() {
		if(showing_slowly) return false;
		if(ARIMAA.is_passing_legal(viewer.gamestate(), viewer.board())) {
			$('.pass').removeAttr('disabled');
		} else {
			$('.pass').attr('disabled', 'disabled');
		}
	}
	
	function show_piece_at(from, to_elem) {
		//var piece = viewer.board()[coord.row][coord.col];
		//coordinate_for_elem($(this))
		//if(!elem.hasClass('selection_option')) return;
		//elem.css('background-color', 'yellow');

		//get_square(from.row, from.col).
	}

	function clear_selections() {
		$('.square.selection_option').removeClass('selection_option');
		$('.cloned_for_dnd').remove();
		//$('.ghost').hide();
		$('.square.hovered_selection').removeClass('hovered_selection');
	}

	function create_clone(selected) {
			//FIXME: change to some kind of shadow
		var orig = get_square(selected.row, selected.col).find('img');
		//var cloned = orig.clone(false).hide().addClass('cloned_for_dnd');

		var src = orig[0].src.split("/");
		src = src[src.length - 1];
		var ghost_id = '#' + turn_prefix(viewer.gamestate().turn) + viewer.board()[selected.row][selected.col].type + "_ghost";
		
		var ghost = $(ghost_id);
		var cloned = 
			ghost.clone(false)
			.removeAttr('id')
			.hide()
			.addClass('cloned_for_dnd');
		
		//ghost.show(); 
		
		cloned.appendTo(orig.closest('.square'));
		//cloned = ghost;

		/*
		cloned
		  .css('position', 'absolute')
			.css('left', orig.offset().left)
			.css('top', orig.offset().top)
			.show();
			*/

		//orig.closest('.square').addClass('dragged_original');			

		function is_original_square(elem) {
			var coord2 = coordinate_for_element(elem);
			return selected.row === coord2.row && selected.col === coord2.col;
		}
		
		orig.bind('mousemove.arimaa_tutorial', function(e) {
			$('.square.hovered_selection').removeClass('hovered_selection');
			cloned.hide();
			return false;
		});
		
		$('.square').bind('mousemove.arimaa_tutorial', function(e) {			
			$('.square.hovered_selection').removeClass('hovered_selection');
			if($(this).find('.cloned_for_dnd').length > 0) {
				$(this).find('.cloned_for_dnd').remove();
			}
			
			cloned.remove().appendTo($(this));
			
			if(!$(this).hasClass('selection_option')) { 
				cloned.hide();
			} else {
				cloned.show();
				$(this).addClass('hovered_selection');
			}
			//cloned.show();
			show_piece_at(selected, $(this));
			/*
			cloned
				.css('left', $(this).offset().left)
				.css('top', $(this).offset().top);
				*/
				//.css('left', e.pageX-cloned.width()/2)
				//.css('top', e.pageY-cloned.height()/2);
				return false;
		});			
		
	}
	
	function select_piece(elem) {
		var selected = coordinate_for_element(elem);

		clear_selections();

		var paths = selection_handler.click_at(selected);			

		if(!paths || paths.length === 0) {
			clear_selections();
			selection_handler.clear_selected();
			return false;
		}
		
		create_clone(selected);	
		// if piece has no path, clear
	}
	
	function select_target(elem) {
		var selected = coordinate_for_element(elem);

		if(selection_handler.currently_selected(selected)) {
			selection_handler.clear_selected();
			return;
		}
		
		$('.dragged_original').removeClass('dragged_original');			
		
		var path = selection_handler.select_at(selected);
		clear_selections();

		if(!path) {
			select_piece(elem);
			return false;	
		}

		selection_handler.clear_selected();

		play_step_sound();		

		var board_before = viewer.board();
		var gamestate_before = viewer.gamestate();
		
		function commit_steps() {
			var from = path[0];
			for(var i = 1; i < path.length; ++i) {
				var to = path[i];
				make_step_for_piece(from, to);
				from = to;
				//get_square(step.row, step.col).addClass('trap');
			};
			
			showing_slowly = false;
		}

		var from = path[0];
		function show_selected(from, rest) {
			if(rest.length === 0) {
				//viewer.gametree_goto(viewer.current_id());
				viewer.setBoard(board_before);
				viewer.setGamestate(gamestate_before);
				commit_steps();
				show_board();
				return;
			}
			
			var to = rest[0];
			showing_slowly = true;

			show_make_step_for_piece(from, to, 
					function() {						
						show_selected(to, rest.slice(1));
					});
		}
		
		current_show_step_delay = show_step_delay_human;
		show_selected(from, path.slice(1));
		
		show_current_turn();			
		
		
		// if piece === target, clear
		// if target is not in path, clear
	}

	function original_state() {
		$('.dragged_original').removeClass('dragged_original');
		selection_handler.clear_selected();
		clear_selections();
	}
	
	function bind_select_piece() {		
		$( document ).on('mousedown', '.square', function() {
			if(showing_slowly || bot_showing) return false;

			var elem = $(this);
			var selected = coordinate_for_element(elem);
			
			if(selection_handler.currently_selected(selected)) {
				original_state();
				return false;				
			}
			
			if(!selection_handler.has_selected()) {
				select_piece(elem);
			} else {
				select_target(elem);
			}
			return false;
		})
		
		$( document ).on('mouseup', '.square', function(e) {
			$(this).unbind('mousemove.arimaa_tutorial');
			var elem = $(this);	
			var selected = coordinate_for_element(elem);
			
			if(selection_handler.has_selected() &&
				!selection_handler.currently_selected(selected)) {
				select_target(elem);
			}
			
			return false;
		});
		
	}

	function is_human_side(side) { return side === human_side; }
	
	// this is for making a new move
	function make_step_for_piece(selected, new_coordinate) {
		if(selected === undefined) return;

		var piece = viewer.board()[selected.row][selected.col];
		var step = { 'from': selected, 'to': new_coordinate, 'piece': piece } 
		//FIXME: making move to gametree should be behind common interface with getting new board
		result = ARIMAA.move_piece(viewer.gamestate(), viewer.board(), selected, new_coordinate);
		
		make_step_to_gametree(step);
		// if turn changed, commit the steps into gametree as a move
		if(result.gamestate.turn !== viewer.gamestate().turn) {
			commit_move_to_gametree();

			viewer.gametree_goto(current_nodehandle.id);
			show_board();
			//arrow_handler.clear_arrows();

			if(result.gamestate.turn === bot_side || bot_vs_bot) {
				//show_move_slowly(viewer.current_id(), 0);
				//bot_move();
				//action_buffer.push(bot_move);
				setTimeout(bot_move_call_prolog, 1, result.gamestate.turn); // indirect call gives time to hide arrows
				//arrow_handler.show_off();				
			}
		} else {
			viewer.setBoard(result.board);
			viewer.setGamestate(result.gamestate);
			
			if(is_human_side(result.gamestate.turn)) {
				//show_board(); // show board only for human when making a step
			}
			
			//show_board();
			//arrow_handler.clear_arrows();
		}
	}

	// this is for showing already made moves
	function show_make_step_for_piece(selected, new_coordinate, after_action) {
		// if this function is called with not showing_slowly, the moving slowly has been interrupted
		if(!showing_slowly) return;

		/****
		 Animation for step
		 FIXME: create seperate function
		 anyways this is a bit dirty way to animate
		 though eventually the current dom based thing might change to use of absolute positions and maybe canvas
		***/
		
		var pieceElem = $('.row').eq(selected.row).find('.square').eq(selected.col).find('img');
		var toElem = $('.row').eq(new_coordinate.row).find('.square').eq(new_coordinate.col);

		if(pieceElem.length === 0) {
			$('.clone_animation_piece').stop(false, true);
			after_animation();
			return;
		}
		
		var x_change = (new_coordinate.col - selected.col) * (toElem.outerWidth());
		var y_change = (new_coordinate.row - selected.row) * (toElem.outerHeight());

		// this must be done after getting pieceElem
		var result = ARIMAA.move_piece(viewer.gamestate(), viewer.board(), selected, new_coordinate);
		viewer.setBoard(result.board);
		viewer.setGamestate(result.gamestate);

		// animation clones that are still being animated must be fast-forwarded
		$('.clone_animation_piece').stop(false, true);
		
		var x = pieceElem.offset().left + x_change;
		var y = pieceElem.offset().top + y_change;

		var clone = pieceElem.clone(false).hide().removeClass('square');
		clone.addClass('clone_animation_piece');
		
		clone
			.css('position', 'absolute')
			.css('left', pieceElem.position().left)
			.css('top', pieceElem.position().top)
			.css('width', pieceElem.outerWidth())
			.css('height', pieceElem.outerHeight())

		pieceElem.hide();
		clone.show();
			
		function after_animation() {
			// if this function is called with not showing_slowly, the moving slowly has been interrupted			
			if(!clone || !showing_slowly) {
				return;
			}

			clone.remove();
			show_board();			
			
			if(!!after_action) { after_action(); }
		  //arrow_handler.clear_arrows();
		}
		
		var real_delay = current_show_step_delay - 50;

		$('.boardwrapper').append(clone);

		clone.animate({
			'left': '+='+x_change,
			'top': '+='+y_change
		}, real_delay, after_animation);

	}
	
	function show_step_delay(turn) {
		return is_human_side(turn) ? show_step_delay_human : show_step_delay_bot;
	}
	
	function moves_from(node) { return node.moves_from_node.length; }

	function show_step(step) {
		// if this function is called with not showing_slowly, the moving slowly has been interrupted
		if(!showing_slowly) return;
		
		play_step_sound();
		
		if(step.type === 'setting') {
			var result = ARIMAA.add_piece(step.piece, step.to, viewer.board(), viewer.gamestate());
			viewer.setBoard(result.board);
			viewer.setGamestate(result.gamestate);
			show_board();
		} else if (step.type === 'pass') {
			var result = ARIMAA.pass(viewer.board(), viewer.gamestate());
			viewer.setBoard(result.board);
			viewer.setGamestate(result.gamestate);
		  show_board();
		  //arrow_handler.clear_arrows();
		} else if(step.type === 'removal') {
			throw "removal step should not be handled here, the game logic should take care of it";			
			// this can be skipped, since the effect is already done in previous step
		} else {
			show_make_step_for_piece(step.from, step.to);
		}
	}

	function do_next_action() {
		if(action_buffer.length > 0) {
			var action = action_buffer.pop();
			action();
		}
	}
	
	function show_steps_slowly(steps, nodeid, move_index) {
		// if this function is called with not showing_slowly, the moving slowly has been interrupted
		if(!showing_slowly) return;
		
		if(steps.length === 0) {
			bot_showing = false;
			showing_slowly = false;
			viewer.gametree_goto(nodeid);
			show_current_turn();
			//arrow_handler.show_on();
			show_board();
			do_next_action();
			return;
		}

		//if(steps[1] !== undefined) show_shadow_piece_at(steps[1].notated, steps[1].to.row, steps[1].to.col);
		
		show_step(steps[0]);
		setTimeout(function() {
				if(showing_slowly) show_steps_slowly(steps.slice(1), nodeid, move_index); 
			}, current_show_step_delay);				
	}
	
	function show_next_move_slowly() {
		show_move_slowly(viewer.current_id(), current_move_index);
	}

	function show_move_slowly(nodeid, move_index) {
		if(showing_slowly) return;
		showing_slowly = true; // only at this point if we want to show_board which contains show_shadow

		var node = gametree.select_node(gametree.previous_nodeid(nodeid));
		//node = 

		if(node.moves_from_node.length > 0) {
			function show_fun() {
				var steps = node.moves_from_node[move_index].steps;
				show_steps_slowly(steps, nodeid, move_index);
			}

			viewer.setBoard(node.board);
			viewer.setGamestate(node.gamestate);
			show_board();
			undo_all_steps();
			
			// set correct starting position first and have a delay			
			setTimeout(show_fun, show_step_delay);
		} else {

		}		 
	}

	function getKeyCode(event) { return event.keycode || event.which;	}
	
	function pass_if_legal() {
		if(showing_slowly) return;
		
		if(ARIMAA.is_passing_legal(viewer.gamestate(), viewer.board())) {
			stepbuffer.push({ 'type': 'pass' });
			commit_move_to_gametree();
			viewer.gametree_goto(current_nodehandle.id);
			show_board();
			// when passing, call prolog only if it was the human playing 
			if (result.gamestate.turn.side != "silver")
			{
				bot_move_call_prolog(result.gamestate.turn);
			}
		}
	}
	
	function bind_control_move() {
		$('.pass').click(function() { pass_if_legal(); $(this).blur(); });
		
	 $(document).keydown(function(event) {
    	var code = getKeyCode(event);
            
      if(code === 80 /* p */) { toggleDebugInfo(); }
      if(code === 79 /* o */) { showCurrentDebugInfo(); }
      
      // prevent moving of window when arrow keys are pressed
      if(code >= 37 && code <= 40) { return false; }
    });
  }

	function debug(value) {
		$('.debug').append(prettyPrint(value));
	}

	function toggleDebugInfo() {
		if(!ARIMAA_DEBUG_ON) return;

		$('.debug').toggleClass('shown');
		if($('.debug').hasClass('shown')) {
			$('body').css('margin-top', $('.debug').height());
		} else {
			$('body').css('margin-top', 0);
		}
	}
      
	function showCurrentDebugInfo() {
		if(!ARIMAA_DEBUG_ON) return;
		
		$('.debug').html('');
		debug({
				"current_id: ": viewer.current_id(),
				"current_move_index": current_move_index,
				"stepbuffer": stepbuffer
		});
		$('.debug').addClass('shown');
	}
      
	function create_tree_and_viewer() {
  	gametree = create_gametree();
  	viewer = create_viewer(gametree);
  	gametree_utils = create_gametree_utils(gametree);
  	//arrow_handler = create_arrow_handler(gametree, viewer);
  	selection_handler = create_selection_handler(gametree, viewer);
	}
	
	function commit_board(board, gametree) {
		var rows = [0, 1, 6, 7];
		var temp_board = empty_board();
		var temp_gamestate = ARIMAA.get_initial_gamestate();
		var steps = [];
		
		for(var row = 0; row < rows.length; ++row) {
			
			for(var i = 0; i < ARIMAA.board_width; ++i) {
				var piece = board[rows[row]][i];
				
				var step = {
					'type': 'setting',
					'piece': piece,
					'to': {
						'col': i,
						'row': rows[row]
					}
				}
				steps.push(step);
				//make_step_to_gametree(step);					
			}
						
			if(row === 1 || row === 3) {
				var result = gametree.make_move({'steps': steps}, current_nodehandle);
				current_nodehandle = result.nodehandle;
				viewer.gametree_goto(result.nodehandle.id);
				steps = [];
			}
		}		
	}
	
	function commit_move_to_gametree() {
		var move_name = 
		// move number +
			"[*] " +			
				get_stepbuffer_as_notated();
				
		var move = {
			'id': move_name, 
			'steps': stepbuffer
		}
		
		stepbuffer = [];
		
		var result = gametree.make_move(move, current_nodehandle);
		var nodehandle = result.nodehandle;
		var move_index = result.move_index;
		
		current_nodehandle = nodehandle;
	}	
	
	function init_game() {
  	create_tree_and_viewer();
  	current_nodehandle = gametree.get_initial_nodehandle();
		viewer.gametree_goto(gametree.get_initial_nodehandle().id);
		//commit_board(init_arimaa_board().board, gametree);
		commit_board(random_arimaa_board().board, gametree);
		viewer.gametree_goto(current_nodehandle.id);
		show_board();
		show_current_turn();
	}
	
	function show_current_turn() {
		show_turn(viewer.gamestate());
	}	
             
        function is_empty(obj)
        {
            return (Object.getOwnPropertyNames(obj).length === 0);
        }
        
        function board_to_prolog(board)
        {
            var prolog = "[";
            for (var row in board) 
            {
                for (var col in board[row]) 
                {
                    var piece = board[row][col];
                    if (!is_empty(piece))
                    {
                        var prolog = prolog + "[" + row + "," + col + "," + piece.type + "," + piece.side.side + "],";
                    }
                }
            }
            prolog = prolog.slice(0, -1) + "]";
            return prolog;
        }

        function gamestate_to_prolog(gamestate)
        {
            var prolog = "[";
            // side of player to play
            prolog += gamestate.turn.side;
            prolog += ","
            // Captured piece
            prolog += "[";
            for (var i in gamestate.captured)
            {
                prolog = prolog + "[" + gamestate.captured[i].type + "," + gamestate.captured[i].side.side + "],";
            }
            if (gamestate.captured.length > 0)
            {
                prolog = prolog.slice(0, -1);
            }
            prolog += "]";
            prolog += "]";
            return prolog;
        }
        
        // Form of : [[[col,row],[col,row]],[[col,row],[col,row]],[[col,row],[col,row]],[[col,row],[col,row]]]
        function convert_prolog_move_to_js(prolog_steps, board)
        {
            var move = Object();
            var steps = []
            //var list_steps = prolog_steps.
            //list_steps = prolog_steps.split("]],[[");
            var list_steps = prolog_steps.match(/\[\[\d,\d\],\[\d,\d\]\]/g);
            for(var i in list_steps)
            {
                var step = list_steps[i];
                if(step.length == 13)
                {
                    steps.push({
                        'from': { 'row': step.charAt(2), 'col': step.charAt(4) },
                        'piece': board[step.charAt(4)][step.charAt(2)],
                        'to': { 'row': step.charAt(8), 'col': step.charAt(10) }
                    });
                }
            }
            move.steps = steps;
            return move;
        }
        
        function print_debug(trace)
        {
            output_console = document.getElementById('stdout');    
            stdout_buffer = document.createElement('div');
            stdout_buffer.innerHTML = trace;
            output_console.appendChild(stdout_buffer);   
        }
        
	/*function bot_move() {
		bot_showing = true;
		show_current_turn();
		
		if(ARIMAA.is_gameover(viewer.board(), viewer.gamestate())) return;

                gamestate_to_prolog(viewer.gamestate());
                board_to_prolog(viewer.board());
                var move = bot.get_move(viewer.board(), viewer.gamestate());
                
                execute("get_moves(X," + gamestate_to_prolog(viewer.gamestate()) + "," + board_to_prolog(viewer.board()) + ").")
                // var move = convert_prolog_move_to_js("[[[0,1],[0,2]],[[1,1],[1,2]],[[2,1],[2,2]],[[3,1],[3,2]]]", viewer.board());
                
		GENERIC.for_each(move.steps, function(step) {
			make_step_for_piece(step.from, step.to);
		});

		current_show_step_delay = show_step_delay_bot;
		show_move_slowly(current_nodehandle.id, 0);
	}*/
	
        function bot_move_call_prolog(turn)
        {
            bot_showing = true;
            show_current_turn();

            if(ARIMAA.is_gameover(viewer.board(), viewer.gamestate())) return;
            
            gamestate_to_prolog(viewer.gamestate());
            board_to_prolog(viewer.board());
			var query = "get_moves(Moves," + gamestate_to_prolog(viewer.gamestate()) + "," + board_to_prolog(viewer.board()) + ").";
            print_debug("<br />YOUR BOT << " + query);
            execute(query)
        }
        
        function bot_move_get_answer_from_prolog(prolog_answer)
        {
			print_debug("YOUR BOT >> " + JSON.stringify(prolog_answer));
			var move_answer = JSON.stringify(prolog_answer.Moves);
			
            var move = convert_prolog_move_to_js(move_answer, viewer.board());
            
            GENERIC.for_each(move.steps, function(step) {
                make_step_for_piece(step.from, step.to);
            });
			
			if (move.steps.length < 4)
			{
				pass_if_legal();
			}

            current_show_step_delay = show_step_delay_bot;
            show_move_slowly(current_nodehandle.id, 0);
        }
        
	function build_move_tree(moves) {
  	var nodehandle = gametree.get_initial_nodehandle();

		//FIXME: can be recursive with variations
  	GENERIC.for_each(moves, function(move) {
			nodehandle.main_line = true; // main line positions have special attribute
 			var result = gametree.make_move(move, nodehandle);
			var new_nodehandle = result.nodehandle;
			nodehandle = new_nodehandle;
			//GENERIC.log(nodehandle.gamestate.steps);
		});

		build_dom_tree(gametree, domtree,
									/* callbacks */
									delete_position, move_variation_up, move_variation_down);
	}

	function show_captured(gamestate) {
		if(!gamestate.captured) return;
		var result = "";
		
		var sorted_captured = [].concat(gamestate.captured);
		function compare_strength(a, b) { return a.strength > b.strength ? -1 : 1; }
		sorted_captured.sort(function(a, b) { return a.side === b.side ? compare_strength(a, b) : a.side === ARIMAA.silver ? - 1: 1; });
		
		GENERIC.for_each(sorted_captured, function(piece) {
			var name = "pics/" + piece.side.side.slice(0, 1) + piece.type + ".png";
			var capture = "<img class='captured_piece' src='" + name + "' />"; 
			result += capture;
		});

		$('.captured_pieces').html('').append(result);
	}
	
	function show_steps_left(gamestate) {
		$('.steps_left').html(gamestate.steps);
	}
	
	function show_board() {
		show_captured(viewer.gamestate());
		show_dom_board(viewer.board(), viewer.gamestate());
		show_pass_if_legal();
		show_steps_left(viewer.gamestate());
		
		if(ARIMAA.is_gameover(viewer.board(), viewer.gamestate()) || ARIMAA.is_gold_rabbit_at_goal(viewer.board())) {
			$('.gameover_info').show();

			if(ARIMAA.is_gold_rabbit_at_goal(viewer.board())) {
				$('.game_win').show();			
			} else {
				$('.game_lost').show();
			}

			$('.turninfo').html('');
			$('.steps_left').html('0');
		}
	}
	
	function undo_all_steps() {
		stepbuffer = [];
	}
	
	function undo_steps() {
		if(showing_slowly || !is_human_side(viewer.gamestate().turn)) return;
		original_state();
		stepbuffer = [];
		viewer.gametree_goto(viewer.current_id());
		show_board();
	}
	
	function bind_close_rules() {
		$('.rules_close').click(function() { 
			$('body').addClass('rules_closed');
			$('#show_rules').show();
		});
		
		$('#show_rules').click(function() {
			$(this).hide();
			$('body').removeClass('rules_closed');
		});
	}
	
	function bind_toggleable() {
		$('.toggleable').click(function() {
			//var shown = $('.toggleable:visible');
			//$('.toggleable').hide();
			//$('.toggleable')
			$(this).toggleClass("rule_toggled");
		});
		
		$('.rules_homerow').hover(function() { $('.homerow.silver').addClass('highlight'); },
															function() { $('.homerow.silver').removeClass('highlight'); }
		);
	}
	
	function bind_game_lost() {
		$('.game_lost').click(function() {
			window.location.reload(true);
		});
	}	
	
	$(function() {
		create_tree_and_viewer();
				
		bind_control_move();
		bind_select_piece();
		bind_close_rules();
		bind_toggleable();
		bind_game_lost();

		$('.show').click(show_next_move_slowly);
		$('.undo').click(undo_steps);

		init_game();
		show_board();
	});
	
        return {
		bot_move_get_answer_from_prolog: bot_move_get_answer_from_prolog
	}
}();