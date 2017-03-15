function create_viewer(gametree_) {
	var gametree = gametree_;
	var current_id = gametree.get_initial_nodehandle().id;
	
	var board = gametree.get_initial_nodehandle().board;
	var gamestate = gametree.get_initial_nodehandle().gamestate;	
	/* var board = init_arimaa_board()['board'];
	var gamestate = ARIMAA.get_initial_gamestate(); */
	
	function gametree_goto(id) {
		current_id = id;

		var node = gametree.select_node(id);

		board = node.board;
		gamestate = node.gamestate;
	}	

	/*
		//domtree.bind("deselect_all.jstree", function (event, data) {
		domtree.bind("deselect_node.jstree", function (event, data) {
				
				GENERIC.log("deselect");
				GENERIC.log(event);
				GENERIC.log(data);
			
				// gold turn to silver, vice versa
	    //domtree.jstree('set_type', 'gsingleton_before', 'li[rel="ssingleton_after"]');
	    //domtree.jstree('set_type', 'ssingleton_before', 'li[rel="gsingleton_after"]');
	  });
  		*/		

/*	  
	  domtree.bind("deselect_node.jstree", function(node) {
	  		GENERIC.log(node);
	  });
	  */
	
	return {
		'gametree_goto': gametree_goto,
		'board': function() { return board; },
		'gamestate': function() { return gamestate; },
		'setBoard': function(b) { board = b; },
		'setGamestate': function(g) { gamestate = g; },
		'gametree': function(){ return gametree; },
		'current_id': function(){ return current_id; },
	}
}
