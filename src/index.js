import * as R from 'ramda';

import * as errors from './errors';

// Item ::= { range :: Range, id :: ItemID }
// Range ::= { low :: Number, high :: Number }
// ItemID ::= Any

// Construction

// empty :: IntervalTree
const empty = null;


// Mutators

// insert :: Item -> IntervalTree -> IntervalTree
function _insert(item, tree) {
	// TODO
	return null;
};
const insert = R.curry(_insert);


// Accessors

// isEmpty :: IntervalTree -> Bool
const isEmpty = tree => tree == null;

// toObject :: (ItemID -> String) -> IntervalTree -> [Item]
const toObject = R.curry((calculateHash, tree) => ({}));


export {
	empty,
	insert,
	isEmpty,
	toObject,
};

