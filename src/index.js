import assert from 'assert';
import * as R from 'ramda';

import * as errors from './errors';

// Item ::= { range :: Range, id :: ID }
// Range ::= { low :: Number, high :: Number }
// ID ::= Any


// -- Construction

// empty :: IntervalTree
const empty = null;

// node :: (Item, IntervalTree?, IntervalTree?) -> IntervalTree
const node = (item, left = null, right = null) => {
	if (item.range.high < item.range.low) {
		throw new Error(errors.messages.negativeLengthInterval(item));
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

// toObject :: IntervalTree -> { ID -> Item }
function _toObject(tree) {
	if (isEmpty(tree)) {
		return {};
	} else {
		return {
			[tree.item.id]: tree.item,
			...toObject(tree.left),
			...toObject(tree.right),
		};
	}
}
const toObject = R.curry(_toObject);

// Note: Includes intersections with endpoints of range.
// queryIntersection :: Range -> IntervalTree -> { ID -> Item }
function _queryIntersection(range, tree) {
	if (isEmpty(tree)) {
		return {};
	}

	if (rangesIntersect(range, tree.item.range)) {
		return {
			[tree.item.id]: tree.item,
			...queryIntersection(range, tree.left),
			...queryIntersection(range, tree.right),
		};
	} else if (isEmpty(tree.left)) {
		return queryIntersection(range, tree.right);
	} else if (tree.left.highestEndpointInSubtree < range.low) {
		return queryIntersection(range, tree.right);
	} else {
		// We can't make any assumptions about right subtree.
		// If we stored the lowest endpoint in subtree, we could do a check
		// like in the branch above, but to eliminate the right subtree.
		return {
			...queryIntersection(range, tree.left),
			...queryIntersection(range, tree.right),
		};
	}
}
const queryIntersection = R.curry(_queryIntersection);


// -- Private helpers

// Note: Includes endpoints.
// rangesIntersect :: Range -> Range -> Bool
const rangesIntersect = R.curry((a, b) => (
	a.high >= b.low && a.low <= b.high
));

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
	queryIntersection,
};

