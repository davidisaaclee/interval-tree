import * as R from 'ramda';

import * as errors from './errors';

// Item ::= { range :: Range, value :: Value }
// Range ::= { low :: Number, high :: Number }
// Value ::= Any

// -- Construction

// empty :: IntervalTree
const empty = null;

// node :: (Item, IntervalTree?, IntervalTree?) -> IntervalTree
const node = (item, left = null, right = null) => {
	if (item.range.high < item.range.low) {
		throw new errors.InvalidRangeError(errors.messages.negativeLengthInterval(item));
	}

	return ({
		item,
		highestEndpointInSubtree: item.range.high,
		left,
		right
	})
};


// -- Mutators

// insert :: Item -> IntervalTree -> IntervalTree
function _insert(item, tree) {
	const nodeToInsert = node(item);

	if (isEmpty(tree)) {
		return nodeToInsert;
	}

	if (item.range.low < tree.item.range.low) {
		return updateHighestEndpointInSubtree({
			...tree,
			left: insert(item, tree.left),
		});
	} else {
		return updateHighestEndpointInSubtree({
			...tree,
			right: insert(item, tree.right)
		});
	}
};
const insert = R.curry(_insert);


// -- Accessors

// isEmpty :: IntervalTree -> Bool
const isEmpty = tree => tree == null;

// toObject :: (Value -> String) -> IntervalTree -> { String -> Item }
function _toObject(calculateHash, tree) {
	if (isEmpty(tree)) {
		return {};
	} else {
		return {
			[calculateHash(tree.item.value)]: tree.item,
			...toObject(calculateHash, tree.left),
			...toObject(calculateHash, tree.right),
		};
	}
}
const toObject = R.curry(_toObject);


// -- Helpers

// updateHighestEndpointInSubtree :: IntervalTree -> IntervalTree
function updateHighestEndpointInSubtree(tree) {
	if (isEmpty(tree)) {
		return tree;
	}

	const highestEndpointLeft = tree.left == null
		? -Infinity
		: tree.left.highestEndpointInSubtree;

	const highestEndpointRight = tree.right == null
		? -Infinity
		: tree.right.highestEndpointInSubtree;

	const highestEndpointInSubtree =
		Math.max(
			highestEndpointLeft,
			highestEndpointRight,
			tree.item.range.high);

	return {
		...tree,
		highestEndpointInSubtree
	};
}

export {
	empty,
	insert,
	isEmpty,
	toObject,
};

