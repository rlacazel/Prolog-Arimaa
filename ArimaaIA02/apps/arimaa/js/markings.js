function create_marking_handler(gametree, viewer) {
	var all_markers = GENERIC.map(["A", "B", "C"], function(elem) { return "marker_" + elem; })
	var marker = "";

	function clear_markers_from_dom_board() {
		var squares = $('.square');
		GENERIC.for_each(all_markers, function(marker) {
			squares.removeClass(marker);
		});
	}
	
	function show_markers() {
		// it's possible that new board hasn't been constructed (for a reason)
		// so old markers must be wiped out
		clear_markers_from_dom_board();
		
		var markings = gametree.get_markings(viewer.current_id());
		GENERIC.log(markings);
		GENERIC.for_each(markings, function(marking) {
			GENERIC.log("markings");
			GENERIC.log(marking.row, marking.col, marking.marking);
			$('.row').eq(marking.row).find('.square').eq(marking.col).addClass("marker_" + marking.marking);
		});
	}

	function toggle_marker(elem) {
		GENERIC.log("toggle");
		if(marker === "") return;
		
		var clazz = 'marker_' + marker;
		var coordinate = coordinate_for_element(elem);
		gametree.toggle_marking(viewer.current_id(), coordinate, marker);
		GENERIC.log("toggle");
		elem.toggleClass(clazz);
	}

	function hover_marker(elem) {
		if(marker === undefined) return;

		var clazz = 'hovermarker_' + marker;
		elem.addClass(clazz);
	}

	function unhover_marker(elem) {
		if(marker === undefined) return;

		var clazz = 'hovermarker_' + marker;
		elem.removeClass(clazz);
	}

	function clear_markers_from_node(nodeid) {
		gametree.clear_markings(nodeid);
	}
	
	function marker_on_click(elem) {
		var marker_down = 'marker_pressed';
		if(elem.hasClass(marker_down)) {
			elem.removeClass(marker_down);
			marker = "";					
		} else {
			marker = elem.text();
			$('.marker').removeClass(marker_down);
			elem.addClass(marker_down);
		}
		
	}
	
	return {
	  'is_marker_selected': function() { return marker !== ""; },
	  'clear_markers_from_dom_board': clear_markers_from_dom_board,
	  'show_markers': show_markers,
	  'toggle_marker': toggle_marker,
	  'hover_marker': hover_marker,
	  'unhover_marker': unhover_marker,
	  'clear_markers_from_node': clear_markers_from_node,
	  'marker_on_click': marker_on_click	  
	}
}
	


