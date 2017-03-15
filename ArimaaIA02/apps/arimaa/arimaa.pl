:- module(bot,
      [  get_moves/3
      ]).

% Parsing
% - dos2unix to the file
% - replace (A \= B) par \+ (A == B)
% - for negation always use \+(Goal)
% - for all operation or comparaison (+, -, > ...) use parenthesis: X is (Y-1)
% - No native like random or nth0
% - no _ in move_piece([],[],_,_).
% - Never have possibility to ?



% board: [[0,0,rabbit,silver],[0,1,rabbit,silver],[0,2,horse,silver],[0,3,rabbit,silver],[0,4,elephant,silver],[0,5,rabbit,silver],[0,6,rabbit,silver],[0,7,rabbit,silver],[1,0,camel,silver],[1,1,cat,silver],[1,2,rabbit,silver],[1,3,dog,silver],[1,4,rabbit,silver],[1,5,horse,silver],[1,6,dog,silver],[1,7,cat,silver],[2,7,rabbit,gold],[6,0,cat,gold],[6,1,horse,gold],[6,2,camel,gold],[6,3,elephant,gold],[6,4,rabbit,gold],[6,5,dog,gold],[6,6,rabbit,gold],[7,0,rabbit,gold],[7,1,rabbit,gold],[7,2,rabbit,gold],[7,3,cat,gold],[7,4,dog,gold],[7,5,rabbit,gold],[7,6,horse,gold],[7,7,rabbit,gold]]
% gamestate: [side, [captured pieces] ] (e.g. [silver, [ [0,1,rabbit,silver],[0,2,horse,silver] ]) 

% get_moves(Moves, [silver, []], [[0,0,rabbit,silver],[0,1,rabbit,silver],[6,0,cat,gold],[6,1,horse,gold]]).

%get_moves([[0,0]],Gamestate,Board) :- generate_moves(Gamestate,Board,Moves,4).
get_moves(Moves,Gamestate,Board) :- generate_moves(Gamestate,Board,Moves,4).

% get_moves(Moves, [silver, []], [[0,0,rabbit,silver],[0,1,rabbit,silver],[0,2,horse,silver],[0,3,rabbit,silver],[0,4,elephant,silver],[0,5,rabbit,silver],[0,6,rabbit,silver],[0,7,rabbit,silver],[1,0,camel,silver],[1,1,cat,silver],[1,2,rabbit,silver],[1,3,dog,silver],[1,4,rabbit,silver],[1,5,horse,silver],[1,6,dog,silver],[1,7,cat,silver],[2,7,rabbit,gold],[6,0,cat,gold],[6,1,horse,gold],[6,2,camel,gold],[6,3,elephant,gold],[6,4,rabbit,gold],[6,5,dog,gold],[6,6,rabbit,gold],[7,0,rabbit,gold],[7,1,rabbit,gold],[7,2,rabbit,gold],[7,3,cat,gold],[7,4,dog,gold],[7,5,rabbit,gold],[7,6,horse,gold],[7,7,rabbit,gold]]).

% generate_moves([silver, []], [[0,0,rabbit,silver],[0,1,rabbit,silver],[6,0,cat,gold],[6,1,horse,gold]], Moves, 2).

% comp([[0,0,rabbit,silver],[0,1,rabbit,silver],[0,2,horse,silver],[0,3,rabbit,silver],[0,4,elephant,silver],[0,5,rabbit,silver],[0,6,rabbit,silver],[0,7,rabbit,silver],[1,0,camel,silver],[1,1,cat,silver],[1,2,rabbit,silver],[1,3,dog,silver],[1,4,rabbit,silver],[1,5,horse,silver],[1,6,dog,silver],[1,7,cat,silver],[2,7,rabbit,gold],[6,0,cat,gold],[6,1,horse,gold],[6,2,camel,gold],[6,3,elephant,gold],[6,4,rabbit,gold],[6,5,dog,gold],[6,6,rabbit,gold]], [[0,0,rabbit,silver],[0,1,rabbit,silver],[0,2,horse,silver],[0,3,rabbit,silver],[0,4,elephant,silver],[0,5,rabbit,silver],[0,6,rabbit,silver],[0,7,rabbit,silver],[1,0,camel,silver],[1,1,cat,silver],[1,2,rabbit,silver],[1,3,dog,silver],[1,4,rabbit,silver],[1,5,horse,silver],[1,6,dog,silver],[1,7,cat,silver],[2,7,rabbit,gold],[6,0,cat,gold],[6,1,horse,gold],[6,2,camel,gold],[6,3,elephant,gold],[6,4,rabbit,gold],[6,5,dog,gold],[6,6,rabbit,gold]], X).

generate_moves(_,_,[],0).
generate_moves(Gamestate,Board,[[From,To]|Moves],N) :- M is (N-1),
											get_a_random_ally_piece(Gamestate,Board,From),
											is_legal_move(Gamestate,Board,From,To),
											move_piece(Board,NewBoard,From,To),
											comp(Board,NewBoard,Diff), Diff \= [], % at least a significant moves has been done (has to be compared with the initial board)
											generate_moves(Gamestate,NewBoard,Moves,M), !.

:- dynamic(previous_moves/1).
  
previous_moves([]).
add_to_previous_moves(Move) :- previous_moves(X), retractall(previous_moves(_)), asserta(previous_moves([Move|X])).
											
strength(rabbit,1).
strength(cat,2).
strength(dog,3).
strength(horse,4).
strength(camel,5).
strength(elephant,6).
gold_home_row(5).
silver_home_row(0).
		
member(X, [X|_]).
member(X, [_|Tail]) :-  member(X, Tail). 

comp([], _, []) :- !.
comp(L, [], L) :- !.
comp([H|T], S, R) :-
    (   member(H, S)
    ->  comp(T, S, R)
    ;   R = [H|RT],
        comp(T, S, RT)
    ).
	
inter([], _, []) :- !.
inter([H1|T1], L2, [H1|Res]) :- member(H1, L2), !, inter(T1, L2, Res).
inter([_|T1], L2, Res) :- inter(T1, L2, Res).
  
findx(0,[Elem|_],Elem):- !.
findx(N,[_|List],Elem) :- findx(N1,List,Elem), N is (N1+1).
		
len([], 0) :- !.
len([_|L], Length) :- len(L, N1), Length is (N1+1).
		
choose_random([], []).
choose_random(List, Elt) :-
        len(List, Length),
        random(0, Length, Index),
        findx(Index, List, Elt).
		
choose_piece([Elt|_], Elt).
choose_piece([_|List], Elt) :- choose_piece(List, Elt).

% For all board piece, if the piece is tagged with MySide put it in the resulting list
get_all_ally_piece(_,[],[]).
get_all_ally_piece([MySide|Tail],[[Row,Col,_,MySide]|Board],[[Row,Col]|Pieces]) :- get_all_ally_piece([MySide|Tail],Board,Pieces).
get_all_ally_piece(Gamestate,[_|Board],Pieces) :- get_all_ally_piece(Gamestate,Board,Pieces).

get_a_random_ally_piece(Gamestate,Board,Piece) :- get_all_ally_piece(Gamestate,Board,Pieces), choose_random(Pieces,Piece).

% move_piece(Board,NewBoard,From,To)
move_piece([],[],_,_).
move_piece([[Row,Col,Type,Side]|Board],[[RowTo,ColTo,Type,Side]|NewBoard],[Row,Col],[RowTo,ColTo]) :- move_piece(Board, NewBoard, [Row,Col],[RowTo,ColTo]).
move_piece([[Row,Col,Type,Side]|Board],[[Row,Col,Type,Side]|NewBoard],[RowFrom,ColFrom],[RowTo,ColTo]) :- move_piece(Board, NewBoard, [RowFrom,ColFrom],[RowTo,ColTo]).

% Return false if piece does not exist
% get_piece_and_side_from_coord(Board,Coord,Piece,Side)
%get_piece_and_side_from_coord([],Coord,Type,Side).
get_piece_and_side_from_coord([[Row,Col,Type,Side]|_],[Row,Col],Type,Side).
get_piece_and_side_from_coord([_|Tail],Coord,Type,Side) :- get_piece_and_side_from_coord(Tail,Coord,Type,Side).

% get_neighbour_coord(Board, FromCoord, ToCoord)
get_neighbour_coord(Board, [R,C], [Rto,C]) :- \+(get_piece_and_side_from_coord(Board,[R,C],rabbit,gold)), (R < 7), Rto is (R+1).
get_neighbour_coord(_, [R,C], [R,Cto]) :- (C < 7), Cto is (C+1).
get_neighbour_coord(Board, [R,C], [Rto,C]) :- \+(get_piece_and_side_from_coord(Board,[R,C],rabbit,silver)), (R > 0), Rto is (R-1).
get_neighbour_coord(_, [R,C], [R,Cto]) :- (C > 0), Cto is (C-1).

% has_friendly_neighbour(Board, Coord)
has_friendly_neighbour(Board, Coord) :- get_neighbour_coord(Board, Coord, NeighbourCoord), get_piece_and_side_from_coord(Board, Coord, _, Side), get_piece_and_side_from_coord(Board, NeighbourCoord, _, Side).

has_enemie_neighbour_stronger(Board, Coord) :- get_neighbour_coord(Board, Coord, NeighbourCoord), 
											   get_piece_and_side_from_coord(Board, Coord, MyType, Side), 
										       get_piece_and_side_from_coord(Board, NeighbourCoord, EnemieType, EnemieSide),	
											   Side \= EnemieSide, strength(EnemieType,X1), strength(MyType,X2), X1 > X2.
											  
% is_frozen(Board, Coord)
is_frozen(Board, Coord) :- has_friendly_neighbour(Board, Coord), !, fail.
is_frozen(Board, Coord) :- has_enemie_neighbour_stronger(Board, Coord).
										  

% if silver_rabbit goes to gold home row or gold rabbit goes to silver home row
% is_gameover(Gamestate,Board)
is_gameover([MySide|_],[[Row,_,Type,Side]|_]) :- MySide == gold, gold_home_row(Row), Side == silver, Type == rabbit.
is_gameover([MySide|_],[[Row,_,Type,Side]|_]) :- MySide == silver, silver_home_row(Row), Side == gold, Type == rabbit.
is_gameover(Gamestate,[_|Tail]) :- is_gameover(Gamestate,Tail).

is_victory([MySide|_],[[Row,_,Type,Side]|_]) :- MySide == silver, gold_home_row(Row), Side == silver, Type == rabbit.
is_victory([MySide|_],[[Row,_,Type,Side]|_]) :- MySide == gold, silver_home_row(Row), Side == gold, Type == rabbit.
is_victory(Gamestate,[_|Tail]) :- is_victory(Gamestate,Tail).

% get_legal_move(Gamestate,Board,FromCoord,Moves)
% If game over, return empty
%get_legal_move(Gamestate,Board,_,[]) :- is_gameover(Gamestate,Board).
% if from coord do not contains piece, return empty
%get_legal_move(Gamestate,Board,FromCoord,[]) :- \+ get_piece_and_side_from_coord(Board,FromCoord,_,_).

is_case_busy([[Row,Col,_,_]|_],[Row,Col]). 
is_case_busy([_|Board],Piece) :- is_case_busy(Board,Piece).

% is_legal_move(Gamestate,Board,FromCoord,Move)
% If game over, return empty
is_legal_move([_|_],Board,From,To) :- 
						get_neighbour_coord(Board,From,To), % The to is a neighbour
						\+(is_case_busy(Board,To)). % check the to case is available , TODO: or it is weaker enemie piece that I can take place
						% previous_moves(Moves), \+(findx(_,Moves,To)). % Check if it is not one of my previous move