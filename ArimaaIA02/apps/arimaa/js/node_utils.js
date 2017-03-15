function is_node_singleton(node) {
  return node.moves_from_node.length === 0;
}

function is_node_singleton_before(node, move_index, gametree) {
	var next = gametree.next_nodeid(node, move_index);
	return is_node_singleton(gametree.select_node(next));
}
