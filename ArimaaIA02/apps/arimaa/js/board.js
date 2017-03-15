
	function map_pieces_with_given_properties_in_row(pieces, propertyName, propertyValue) {
		return GENERIC.map(pieces, function(elem) {
				var elem_copy = GENERIC.shallowCopyObject(elem);
				elem_copy[propertyName] = propertyValue;
				return elem_copy;
		});
	}
	
	function map_side(pieces, side) {
		return map_pieces_with_given_properties_in_row(pieces, 'side', side); 	
	}	
	
	function silverize(pieces) { return map_side(pieces, ARIMAA.silver); }	
	function goldify(pieces) { return map_side(pieces, ARIMAA.gold); }	
	
	function empty_row() { return GENERIC.create_array(8, { /* empty object*/ } ); }

	function init_arimaa_board() {		
		return {
			'board': [
				silverize(GENERIC.create_array(8, ARIMAA.rabbit)), 
				silverize([ARIMAA.dog, ARIMAA.horse, ARIMAA.cat, ARIMAA.camel, ARIMAA.elephant, ARIMAA.cat, ARIMAA.horse, ARIMAA.dog]),
				empty_row(),
				empty_row(),
				empty_row(),
				empty_row(),
				goldify([ARIMAA.dog, ARIMAA.horse, ARIMAA.cat, ARIMAA.elephant, ARIMAA.camel, ARIMAA.cat, ARIMAA.horse, ARIMAA.dog]),
				goldify(GENERIC.create_array(8, ARIMAA.rabbit))
			]			
		}
	}

	function get_random(num, values) {
		var copy = GENERIC.map(values, function(elem) { return elem; });
		var result = [];
		
		for(var i = 0; i < num; ++i) {
			var random = Math.floor(Math.random()*copy.length);
			if(random < 0 || random >= copy.length) throw "index failed";
			var elem = copy.splice(random, 1)[0]; // copy shrinks
			result.push(elem);
		}
		
		return {
			'value': result,
			'rest': copy
		}
	}
	
	function random_arimaa_board() {
		var animals = GENERIC.create_array(8, ARIMAA.rabbit).concat([ARIMAA.dog, ARIMAA.horse, ARIMAA.cat, ARIMAA.camel, ARIMAA.elephant, ARIMAA.cat, ARIMAA.horse, ARIMAA.dog]);
		var result = get_random(8, animals);
		
		var silvers_1 = result.value;
		var silvers_2 = get_random(8, result.rest).value;

		result = get_random(8, animals);
		var golds_1 = result.value;
		var golds_2 = get_random(8, result.rest).value;
		
		return {
			'board': [
				silverize(silvers_1), 
				silverize(silvers_2),
				empty_row(),
				empty_row(),
				empty_row(),
				empty_row(),
				goldify(golds_1),
				goldify(golds_2)
			]			
		}
	}
	
	function empty_board() {
		return GENERIC.create_array(8, empty_row());
	}