// TODO: figure out if I care about namespaces or if it's just going to be
// a big dumping ground.

// This is for most moves, but not en passantes or certain under-specified moves.
// In particular, notation conveying moves such as "e file pawn to d file" which
// can be an unambiguous capture and just noted as "ed" is not matched: the notation
// is forced to include the destination fully (which seems reasonable given most
// examples).
// Ur dick is as long as the longest regex you've written
var moveNotationRegex = /([RNBQKP]{0,1})([a-h]{0,1})([1-8]{0,1})(x{0,1})([a-h][1-8])([+#]{0,1})|(O-O)|(O-O-O)/;

var chessNotationToCoords = function(chess) {
    var code_of_1 = '1'.charCodeAt(0);
    var code_of_a = 'a'.charCodeAt(0);
    return [chess.charCodeAt(1) - code_of_1,
	    chess.charCodeAt(0) - code_of_a]
}

// Dumb function to copy and then alter the copy of a board.
// Makes the move in the board by setting the piece at dest to
// that which was at src and setting src to vacant.
var makeMoveInBoard = function(board, src, dest) {
    var copy_board = board.map(function (r) { return r.slice(0) });
    var src_coords = chessNotationToCoords(src);
    var dest_coords = chessNotationToCoords(dest);
    copy_board[dest_coords[0]][dest_coords[1]] = board[src_coords[0]][src_coords[1]];
    copy_board[src_coords[0]][src_coords[1]] = ' ';
    return copy_board;
}

// Since everything in the PNG+fork notation is based on a tree of moves,
// this is the main tree structure for everything.
var MoveTreeNode = function (board_state, kids) {
    this.current_state = board_state;
    this.kids = kids;
    this.comment = '';
    // This is about the specific type of move, whereas the comment is free-form
    this.move_annotation = '';
    this.getNextBoardState = function(move, is_white) {
	var move_parsed = move.match(moveNotationRegex);
	if(!move_parsed[0]) {
            return null;
	}

	if (move_parsed[7]) {
            // king's side castling
	    if (is_white) {
                if (this.current_state[0].slice(4) === 'K  R') {
                    var castled = makeMoveInBoard(this.current_state, 'e1', 'g1');
		    castled = makeMoveInBoard(castled, 'h1', 'f1');
		    return castled;
		}
	    } else {
                if (this.current_state[7].slice(4) === 'k  r') {
                    var castled = makeMoveInBoard(this.current_state, 'e8', 'g8');
		    castled = makeMoveInBoard(castled, 'h8', 'f8');
		    return castled;
		}
	    }
	    return null;
	}

	if (move_parsed[8]) {
            // queen's side castling
	    if (is_white) {
                if (this.current_state[0].slice(0) === 'R   K') {
                    var castled = makeMoveInBoard(this.current_state, 'e1', 'c1');
		    castled = makeMoveInBoard(castled, 'a1', 'd1');
		    return castled;
		}
	    } else {
                if (this.current_state[7].slice(0) === 'r   k') {
                    var castled = makeMoveInBoard(this.current_state, 'e8', 'c8');
		    castled = makeMoveInBoard(castled, 'a8', 'd8');
		    return castled;
		}
	    }
	    return null;
	}

	// Get the piece passed in.
	var piece = 'P';
	if (move_parsed[1]) piece = move_parsed[1];

	// Get as much data on the source as possible.
	var src_file = move_parsed[2];
	var src_rank = move_parsed[3];

	var is_capture = move_parsed[4] === 'x';

	var dest = move_parsed[5];
	if(!dest) return null;
	var check = move_parsed[6];

	
    }
};

// Makes the tree root for the default opening.
// Probably worth assuming white is along
// makeRoot.current_state[0]
var makeRoot = function() {
    // TODO: not hack black piece = lower case lol
    return new MoveTreeNode([['RNBQKBNR'],
			     ['PPPPPPPP'],
			     ['        '],
			     ['        '],
			     ['        '],
			     ['        '],
			     ['pppppppp'],
			     ['rnbqkbnr']], []);
};

// Clean up tag values: remove the surrounding quotes and if there are any
// backslashes, process them (converting \" to a " and \\ to a \).
var fixPGNTagValue = function(tag_value) {
    if (tag_value[0] === '"') {
	tag_value = tag_value.slice(1).slice(0, -1);
    }
    return tag_value.replace('\\"', '"').replace('\\\\', '\\');
}

// TODO: handle comments in the tags properly
var readPGNText = function (source_code) {
    var lines = source_code.split('\n');
    this.tags = {};
    var i;
    for(i = 0; i < lines.length; i++) {
        if(lines[i][0] !== '[') {
            break;
	} 
	var key = lines[i].split(/s+/)[0].slice(1);
	// All the crap after the key except the trailing "]"
	var value = lines[i].slice(key.length + 1).trim().slice(0, -1);
	this.tags[key] = fixPGNTagValue(value);
    }

    this.move_tree_root = makeRoot();
    
};
