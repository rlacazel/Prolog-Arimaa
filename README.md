[Works only for Unix and Windows, not for Mac]

# Prolog-Arimaa
Tool to create Arimaa Prolog IA with JS game interface. Usage a Pengine to convert Prolog in JS.

## Install SWI Prolog
1. Download prolog from [prolog](http://www.swi-prolog.org/download/stable)
2. Install it with default option

## Install Arimaa game and start coding your IA
### Get Arimaa game
1. Download folder ([zip file](https://github.com/rlacazel/Prolog-Arimaa/archive/master.zip))
2. Unzip it in your working folder

### Run Arimaa game
1. Enter in folder ArimaaIA02
2. Execute run.pl (allow authorization if asked)
The server is now running
3. You can then access to the game in any browser via: [http://localhost:3030](http://localhost:3030)
In the interface you play the gold (bottom) color and you IA is the silver color (top)

### Code your IA
The ONLY file you have to touch to code your IA is ArimaaIA02\apps\arimaa\arimaa.pl
1. Update ArimaaIA02\apps\arimaa\arimaa.pl
2. Restart the server: Close the SWI-Prolog console and re-execute run.pl
3. Refresh your browser page or click [http://localhost:3030](http://localhost:3030)
Your new IA will be loaded (silver player)

#### Exemple of asserta and retract
```prolog
% declare the dynamic fact
:- dynamic moves/1.

% predicat to add a new move to the list of moves
add_move(NewMove) :- moves(M), retract(moves(M)), asserta(moves([NewMove|M])).

% init moves with an empty list, add a new move to this list, return the new moves with the added move
test(M) :- asserta(moves([])), add_move([[1,0],[2,0]]), moves(M).
```

## Problem you may encounter with Unix
### library uuid can't be loeaded:
1. Install the library [OSSP UUID](http://www.ossp.org/pkg/lib/uuid/)
2. Recompile prolog (example under Arch Linux):
	- yaourt -Sy uuid
	- yaourt -D swi-prolog-devel (yes to remove prolog if conflict)

