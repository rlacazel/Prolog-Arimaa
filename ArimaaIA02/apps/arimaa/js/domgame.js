	function get_square(row, col) {
		return $('.board .row').eq(row).find('.square').eq(col);
	}

	function show_comments_for_move(move) {
		var text = !!move ? move.comment || "" : "";
  	$('.comments_for_move').val(text);
	}	

	function show_comments_for_node(current_node) {
		if(!current_node) return;
  	$('.comments_for_node').val(current_node.comment || "");
	}	

	function show_turn(gamestate) {
		if(gamestate.turn === ARIMAA.gold) {
			$('.turn')
				.text($('.localization.gold').text())
				.css('color', "yellow");
		} else {
			$('.turn')
				.text($('.localization.silver').text())
				.css('color', "white");
		}
	}
	
	function show_current_position_info(gamestate, current_node, current_move) {
		show_comments_for_node(current_node);
		show_comments_for_move(current_move);
		show_turn(gamestate);
	}
	
	function show_dom_board(board, gamestate) {
		if($('.board .square img').length > 0) {
			update_dom_board(board, gamestate);
			return;
		}
		
  	var dom_board = create_dom_board(board);
  	$('.board').html(dom_board);
  	GENERIC.for_each(ARIMAA.traps, function(trap) {
  			$('.row').eq(trap[0]).find('.square').eq(trap[1]).addClass('trap');
  	});
  	
  	$('.row').eq(0).find('.square').each(function() {
  		$(this).addClass('homerow').addClass('silver');
  	});

  	$('.row').eq(ARIMAA.board_height - 1).find('.square').each(function() {
  		$(this).addClass('homerow').addClass('gold');
  	});  	
	}

//FIXME: piece testing should be in arimaa logic
	function is_piece(piece) { return piece !== undefined && piece['type'] !== undefined; }
	
	function get_pic(piece, side) {
		return piece.type + ".png";
	}
	
	function sideprefix(piece) {
		return piece.side === ARIMAA.gold ? 'g' : piece.side === ARIMAA.silver ? 's' : '';
	}
	
	var uniq_ids = 52;
	function unique_id() { return uniq_ids++; }
	
	function create_square(piece) {
		if(is_piece(piece)) {
			return '<div class="square" id="square'+ unique_id() +'"><img class="piece_image" src="pics/' + sideprefix(piece) + get_pic(piece) + '" /></div>';
		} else return '<div class="square"></div>';
	}
	
	function create_dom_board(board) {
		var result = "";
		for(var i = 0; i < board.length; ++i) {
			var mapped_row = GENERIC.map(board[i], create_square);
			var row = GENERIC.reduce("", mapped_row, function(s1, s2) { return s1 + s2; });
			result += "<div class='row'>" + row + "</div>";
			result += "<div class='clear'></div>";
		}
		
		return result;
	}
	
	function coordinate_for_element(elem) {
		return {
			'row': row_index(elem),
			'col': col_index(elem)
		}		
	}
	
	function row_index(elem) {
		return parseInt($('.row').index(elem.closest('.row')));
	}
	
	function col_index(elem) {
		var row = elem.closest('.row');
		var elems_in_row = row.find('.square');
		return parseInt(elems_in_row.index(elem));
	}

		
	function print_board(board) {
		console.log("....................................");
		for(var j = 0; j < ARIMAA.board_height; ++j) {
			var row = "";
			for(var i = 0; i < ARIMAA.board_width; ++i) {
				row += board[j][i].type + " ";
			}
			console.log(row);			
		}
		
	}
	
	function update_dom_board(board, gamestate) {
		//print_board(board);		

		$('.board .row').each(function(j, row) {
			var $row = $(row);
			$row.find('.square').each(function(i, elem) {
				var elem = $(elem);
				
				var real_piece = board[j][i];
				var piece = elem.find('.piece_image');
				if(piece.length > 1) throw "length = " + piece.length;
				if(real_piece.type === undefined) { // empty
					if(piece.length > 0) {
						piece.remove(); 
					} // remove old, existing piece					
					// else nothing to do
				} else {
					var img = '<img class="piece_image" src="pics/' + sideprefix(real_piece) + get_pic(real_piece) + '" />';

					if(piece.length === 0) { // old has nothing
						elem.html(img);
					} else {
						// old has somethingn and might need replacing
						var image = (piece[0].src.split("pics/")[1]); //FIXME from attribute or class
						var name = image.split('.png')[0];
						var piece_type = name.charAt(0);
						var piece_name = name.slice(1);
						
						if(real_piece.side.side.charAt(0) === piece_type && real_piece.type === piece_name) { // empty
							// same, no need to update
						} else {
							piece.remove(); // remove old
							elem.html(img);
						}
					}
				}
			});
		});
		
	}
