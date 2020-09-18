// TODO: figure out if I care about namespaces or if it's just going to be
// a big dumping ground.

// Most moves. Dissection is allowed by the capturing groups. See the usage in
// the parser for details.
var moveNotationRegex = /([RNBQKP]{0,1})([a-h]{0,1})([1-8]{0,1})(x{0,1})([a-h][1-8])(=[RNBQ]){0,1}([+#]{0,1})|(O-O)|(O-O-O)/;

var chessNotationToCoords = function(chess) {
    var code_of_1 = '1'.charCodeAt(0);
    var code_of_a = 'a'.charCodeAt(0);
    return [chess.charCodeAt(1) - code_of_1,
	    chess.charCodeAt(0) - code_of_a]
}

var coordsToChessNotation = function(coords) {
    var rank = String.fromCharCode('1'.charCodeAt(0) + coords[0]);
    var file = String.fromCharCode('a'.charCodeAt(0) + coords[1]);
    return file + rank;
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

var ensureEmptyInBetween = function(board, src, dest) {
    var heaviside = function(x) {
        return Math.floor(x / Math.abs(x));
    }
    
    var unit_vector = [dest[0] - src[0], dest[1] - src[1]];
    unit_vector = unit_vector.map(heaviside);
    for(src = [src[0] + unit_vector[0], src[1] + unit_vector[1]];
	0 < src[0] && src[0] < 8 && 0 < src[1] && src[1] < 8;
	src = [src[0] + unit_vector[0], src[1] + unit_vector[1]]) {
        if (board[src[0]][src[1]] !== ' ') return false;
    }
    return true;
}

var isNotSelfCapture = function(p, q) {
    return ((p === p.toUpperCase()) !== (q === q.toUpperCase()));
}

var isCapturablePiece = function(p, q) {p
    var non_empty = p !== ' ' && q !== ' ';
    return non_empty && isNotSelfCapture(p, q);
}

var getPieceColor = function(p) {
    if (p === ' ') {
        return 'no';
    } else if (p.toLowerCase() === p) {
        return 'black';
    } else return 'white';
}

var getDelVec = function(v1, v2) {
    var del_x = (v2[0] - v1[0]);
    var del_y = (v2[1] - v1[1]);
    return [del_x, del_y];
}

var kingMoveDist = function(v1, v2) {
    return Math.max(...getDelVec(v1, v2).map(Math.abs));
}

// Given the usage in the function below source is [int, int]
// while spot_pgn is a string matching /[a-h][1-8]/.
var isChecking = function(piece, board, source, dest_pgn) {
    var dest = chessNotationToCoords(dest_pgn);
    var dest_piece = board[dest[0]][dest[1]];
    var del = getDelVec(source, dest);
    var king_dist = kingMoveDist(source, dest);
    if (king_dist === 0) return false;
    switch (piece) {
    case 'P':
	var is_close = king_dist === 1 && dest[0] > source[0];
	is_close = is_close || (king_dist === 2 && source[0] === 1 && dest[0] === 3);
	var capture = (dest[1] === source[1] || isCapturablePiece(piece, dest_piece));
	return is_close && capture;
    case 'p': // TODO: support en passantes
	var is_close = king_dist === 1 && dest[0] < source[0];
	is_close = is_close || (king_dist === 2 && source[0] === 6 && dest[0] === 4);
	var capture = (dest[1] === source[1] || isCapturablePiece(piece, dest_piece));
	return is_close && capture;
    case 'R':
    case 'r':
	// if the X or the Y ain't changed, it's a rook move
        return del[0] * del[1] == 0 && isNotSelfCapture(piece, dest_piece);
    case 'B':
    case 'b':
        return Math.abs(del[0]) === Math.abs(del[1]) && isNotSelfCapture(piece, dest_piece);
    case 'Q':
    case 'q':
	var rook_move = del[0] * del[1] === 0;
	var bishop_move = Math.abs(del[0]) === Math.abs(del[1]);
        return (rook_move || bishop_move)  && isNotSelfCapture(piece, dest_piece);
    case 'K':
    case 'k':
	return king_dist === 1 && isNotSelfCapture(piece, dest_piece);
    case 'N':
    case 'n':
	var abs_del = del.map(Math.abs);
	return (abs_del === [2, 1] || abs_del === [1, 2]) && isNotSelfCapture(piece, dest_piece);
    default:
	return false;
    }
}

// Get the coordinates of the source piece from the notation based
// on the pieces on the board. We will always know the piece from the
// notation and can set the case to handle whose piece it is hackily.
// The rank and file may or may not be provided.
var getSourcePieceNotation = function(board, piece, rank, file, dest) {
    var code_of_1 = '1'.charCodeAt(0);
    var code_of_a = 'a'.charCodeAt(0);
    var base_piece_notation = piece.toUpperCase();
    var tenable_coords = [];
    if(rank && file) {
        var coords = chessNotationToCoords(file + rank);
	if (board[coords[0]][coords[1]] === piece) {
            return file + rank;
	}
    } else if (rank) {
	var rank_coord = 7 - (rank.charCodeAt(0) - code_of_1);
        for(var i = 0; i < 8; i++) {
            if (board[rank_coord][i] === piece) {
                tenable_coords.push([rank_coord, i]);
	    }
	}
    } else if (file) {
	var file_coord = rank.charCodeAt(0) - code_of_a;
        for(var i = 0; i < 8; i++) {
            if (board[i][file_coord] === piece) {
                tenable_coords.push([i, file_coord]);
	    }
	}
    } else {
        for(var i = 0; i < 8; i++) {
            for(var j = 0; j < 8; j++) {
                if (board[i][j] === piece) {
                    tenable_coords.push([i, j]);
		}
	    }
	}
    }

    var checked_tenables = tenable_coords.filter(function(coords) {
        return isChecking(piece, board, coords, dest);
    });
    if (checked_tenables.length === 1) {
        return coordsToChessNotation(tenable_coords[0]);
    }
    return '';
};

// Since everything in the PNG+fork notation is based on a tree of moves,
// this is the main tree structure for everything.
var MoveTreeNode = function (board_state, kids) {
    this.current_state = board_state;
    this.kids = kids;
    this.parent = null;
    this.comment = '';
    // This is about the specific type of move, whereas the comment is free-form
    this.move_annotations = [];
    this.getNextBoardState = function(move, is_white) {
	var move_parsed = move.match(moveNotationRegex);
	if(!move_parsed || !move_parsed[0]) {
            return null;
	}

	var new_board;
	if (move_parsed[8]) {
            // king's side castling
	    if (is_white) {
                if (''.join(this.current_state[0].slice(4)) === 'K  R') {
                    new_board = makeMoveInBoard(this.current_state, 'e1', 'g1');
		    new_board = makeMoveInBoard(castled, 'h1', 'f1');
		}
	    } else {
                if (''.join(this.current_state[7].slice(4)) === 'k  r') {
                    new_board = makeMoveInBoard(this.current_state, 'e8', 'g8');
		    new_board = makeMoveInBoard(castled, 'h8', 'f8');
		}
	    }
	    return null;
	}else if (move_parsed[9]) {
            // queen's side castling (I should feel bad indexing into a list of 10
	    // things, but unlike py, js seems not to have tagged capture groups)
	    if (is_white) {
                if (''.join(this.current_state[0].slice(0)) === 'R   K') {
                    new_board = makeMoveInBoard(this.current_state, 'e1', 'c1');
		    new_board = makeMoveInBoard(castled, 'a1', 'd1');
		}
	    } else {
                if (''.join(this.current_state[7].slice(0)) === 'r   k') {
                    new_board = makeMoveInBoard(this.current_state, 'e8', 'c8');
		    new_board = makeMoveInBoard(castled, 'a8', 'd8');
		}
	    }
	    return null;
	} else {
	    // Get the piece passed in.
	    var piece = 'P';
	    if (move_parsed[1]) piece = move_parsed[1];
	    if (!is_white) piece = piece.toLowerCase();

	    // Get as much data on the move as possible.
	    var src_file = move_parsed[2];
	    var src_rank = move_parsed[3];
	    var is_capture = move_parsed[4] === 'x';
	    var dest = move_parsed[5];
	    if(!dest) return null;
	    var promotion = move_parsed[6];
	    if (promotion && is_white && dest[1] === '8') return null;
	    if (promotion && !is_white && dest[1] === '0') return null;
	    var check = move_parsed[7];

	    // Get the actual source
	    var src_notation = getSourcePieceNotation(this.current_state, piece, src_rank, src_file, dest);
	    if (!src_notation) return null;

	    // Prepare the return value
	    new_board = makeMoveInBoard(this.current_state, src_notation, dest);
	    if(promotion) {
		var new_piece = promotion[1];
		if (!is_white) new_piece = new_piece.toLowerCase();
		var dest_coords = chessNotationToCoords(dest);
		new_board[dest[0]][dest[1]] = new_piece;
	    }
	}

	// Make the new board to return
	var next_node = new MoveTreeNode(new_board, []);
	if (promotion) next_node.move_annotation.push('Pawn promoted to ' + promotion[1]);
	if (check && check === '+')
	    next_node.move_annotation.push('Opponent is in check');
	else if (check && check === '#')
	    next_node.move_annotation.push('Opponent is in checkmate');
	this.kids.push(next_node);
        next_node.parent = this;
	return next_node;
    };

    // Comparison by board state only.
    this.equal_boards = function(other_node) {
	if (!other_node) return false;
        for(var i = 0; i < 8; i++) {
            for(var j = 0; j < 8; j++) {
                if (this.current_state[i][j] !== other_node.current_state[i][j]) {
                    return false;
		}
	    }
	}
	return true;
    };

    this.nearest_node_in = function(other_board) {
	// for every ancestor in this tree, start an upwards search
	// for a node with a similar board state.
	var root_node = other_board;
	for(var current_check = root_node; current_check !== null;
	    root_node = current_check, current_check = current_check.parent) {
            for(var this_check = this; this_check != null; this_check = this_check.parent) {
                if (this_check.equal_boards(current_check)) {
                    return current_check;
		}
	    }
	}
	return root_node;
    };
}; // MoveTreenode definition

// Makes the tree root for the default opening.
// Probably worth assuming white is along
// makeRoot.current_state[0]
var makeRoot = function() {
    // TODO: not hack black piece = lower case lol
    return new MoveTreeNode(['RNBQKBNR'.split(''),
			     'PPPPPPPP'.split(''),
			     '        '.split(''),
			     '        '.split(''),
			     '        '.split(''),
			     '        '.split(''),
			     'pppppppp'.split(''),
			     'rnbqkbnr'.split('')], []);
};

// Clean up tag values: remove the surrounding quotes and if there are any
// backslashes, process them (converting \" to a " and \\ to a \).
var fixPGNTagValue = function(tag_value) {
    if (tag_value[0] === '"') {
	tag_value = tag_value.slice(1).slice(0, -1);
    }
    return tag_value.replace('\\"', '"').replace('\\\\', '\\');
}

// TODO: handle comments in the tags
var readPGNText = function (source_code, error_handler) {
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
	if (!this.tags.hasOwnProperty(key)) this.tags[key] = [];
	this.tags[key].push(fixPGNTagValue(value));
    }

    this.move_tree_root = makeRoot();
    var current = this.move_tree_root;
    var turn_count = 0;
    var counter_regex = /^\d+(\.|\.\.\.)$/
    var awaiting_char_for_parsing = '';
    var comment_buffer = [];
    for (; i < lines.length; i++) {
        var words = lines[i].split(/\s+/);
	for (var j = 0; j < words.length; j++) {
	    if (words[j] === "") continue;
	    if(awaiting_char_for_parsing !== '') {
		var ind_of_await = words[j].lastIndexOf(awaiting_char_for_parsing);
		if(ind_of_await < 0) {
                    if(comment_buffer) {
			comment_buffer.push(words[j]);
		    }
		    continue;
		}

                // handle comments and tree levels separately
		if (comment_buffer) {
                    comment_buffer.push(words[j].slice(0, ind_of_await + 1));
		    current.comment = ' '.join(comment_buffer);
		    comment_buffer = [];
		} else {
                    for(var k = ind_of_await; k >= 0 && words[j][k] == ')'; k--) {
                        if (current.parent === null) {
                            error_handler('CLOSING_PARENS', words[j]);
			    // We'll just try to have the moves be
			    // from the top-level layer if there's
			    // too many parens
			    break;
			}
			current = current.parent;
		    }
		}

		awaiting_char_for_parsing = '';
		words[j] = words[j].slice(ind_of_await + 1);
		if (!words[j]) continue;
	    } // Close if(awaiting...

	    var idx_of_open = words[j].indexOf('{');
	    if (idx_of_open >= 0) {
                if (words[j].length === 1) {
                    awaiting_char_for_parsing = '}';
		    comment_buffer = [' '];
		    continue;
		}

		var full_word = words[j];
		words[j] = full_word.slice(0, idx_of_open);
		words.splice(j + 1, 0, '{');
		words.splice(j + 2, 0, full_word.slice(idx_of_open + 1));
	    }
	    idx_of_open = words[j].indexOf('(');
	    if (idx_of_open >= 0) {
                if (words[j].length === 1) {
		    current = current.parent;
		}

		var full_word = words[j];
		words[j] = full_word.slice(0, idx_of_open);
		words.splice(j + 1, 0, '(');
		words.splice(j + 2, 0, full_word.slice(idx_of_open + 1));
	    }
	    
	    var counter_match = words[j].match(counter_regex);
	    if (counter_match) {
                var is_white = counter_match[1].length === 1;
		var turn_num = parseInt(words[j].replace('.', ''));
		if ((turn_count % 2 === 0) !== is_white) {
                    error_handler('COUNTER_PARITY', words[j]);
		} else if (Math.floor(turn_count / 2) + 1 !== turn_num) {
                    error_handler('COUNTER_INDEX', words[j]);
		}
		continue;
	    }
            var next_node = current.getNextBoardState(words[j], is_white);
	    if (!next_node) { 
                error_handler('MOVE', words[j]);
		if(!current.parent) return this;
		awaiting_char_for_parsing = ')';
	    }
	} // for word in line
    } // for line in lines
};

// Draws the editor state, adding the event handlers and managing
// the state tree.
var PGNEditor = function(textarea_id, display_container_id) {
    var _this = this;
    // Set before drawing
    this.input = document.getElementById(textarea_id);
    this.editor_root = document.getElementById(display_container_id);
    this.parsed_pgn = new readPGNText('', function(e, w) {console.log("IMPOSSIBLE " + e + " " + w);});
    this.move_tree_node = this.parsed_pgn.move_tree_root;

    this.re_parse_pgn = function() {
	_this.warning_list.innerHTML = '';
	var handle_error = function(err_id, word) {
	    var curr_warn = document.createElement('li');
	    curr_warn.innerText = 'Error type: ' + err_id + ' at "' + word + '"';
            _this.warning_list.appendChild(curr_warn);
	}
	_this.parsed_pgn = new readPGNText(_this.input.value, handle_error);
    };

    this.initialize_editor = function() {
	_this.editor_root.className = 'editor-root';
        _this.board = document.createElement('table');
	_this.editor_root.appendChild(_this.board);
	_this.warning_list = document.createElement('ul');
	_this.editor_root.appendChild(_this.warning_list);
	_this.next_move_sel = document.createElement('div');
	_this.editor_root.appendChild(_this.next_move_sel);
	_this.input.addEventListener('compositionend', _this.handle_editor_change);
	_this.input.addEventListener('input', _this.handle_editor_change);
	_this.draw_board();
    };

    this.handle_editor_change = function (_e) {
        _this.re_parse_pgn();
	_this.move_tree_node = _this.move_tree_node.nearest_node_in(_this.parsed_pgn.move_tree_root);
	_this.draw_board();
    }

    this.draw_board = function() {
        _this.board.innerHTML = '';
        for(var i = 0; i < 8; i++) {
	    var curr_row = document.createElement('tr');
            for(var j = 0; j < 8; j++) {
                var curr_cell = document.createElement('td');
		curr_cell.innerText = _this.move_tree_node.current_state[i][j].toLowerCase();
		// White is on the top in the current way makeRoot written, so the
		// top left corner ought to be black.
		curr_cell.className = 'board-cell-' + ((i % 2 != j % 2)? 'white' : 'black');
		curr_cell.className += ' board-cell-' + getPieceColor(_this.move_tree_node.current_state[i][j]) + '-piece';
		curr_row.appendChild(curr_cell);
	    }
	    _this.board.appendChild(curr_row);
	}
    };

    this.run = function () {
        _this.initialize_editor();
    };
};
