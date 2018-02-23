/** @module IntervalTree */
import assert from 'assert';
import * as R from 'ramda';

import * as errors from './errors';

// Index:: number
// #public
// #typealias
// The type of the bounds of the intervals in an interval tree.

// ItemID:: string
// #public
// #typealias
// A unique ID for an item contained in an interval tree.

// Range:: { low: Index, high: Index }
// #public
// #typealias
// A range of numbers specified by an upper and lower bound.

// Item:: { id: ItemID, range: Range }
// #public
// #typealias
// An item contained in an interval tree.

// IntervalTree:: union<null, { item: Item, highestEndpointInSubtree: Index, left: IntervalTree, right: IntervalTree}>
// #public
// #typealias
// An augmented interval tree node.


// -- Construction

// empty:: IntervalTree
// #public
// An empty interval tree.
const empty = null;

// node:: (Item, IntervalTree, IntervalTree) -> IntervalTree
// Create a node with a value.
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

// insert:: (Item) -> (IntervalTree) -> IntervalTree
// #public
// Insert an item into a tree. Does not rebalance the tree.
function _insert(item, tree) {
	const nodeToInsert = node(item);

	if (isEmpty(tree)) {
		return nodeToInsert;
	}

	if (item.range.low < tree.item.range.low) {
		return updateHighestEndpointInSubtree(Object.assign(
			{}, 
			tree,
			{ left: insert(item, tree.left) })); 
	} else {
		return updateHighestEndpointInSubtree(Object.assign(
			{},
			tree,
			{ right: insert(item, tree.right) }));
	}
};
const insert = R.curry(_insert);


// -- Accessors

// isEmpty:: (IntervalTree) -> bool
// #public
// Checks if a specified interval tree is empty.
const isEmpty = tree => tree == null;


// toObject:: (IntervalTree) -> map<ItemID, Item>
// #public
// Lists all intervals in an interval tree in a map from item ID to item.
function _toObject(tree) {
	if (isEmpty(tree)) {
		return {};
	} else {
		return Object.assign(
			{ [tree.item.id]: tree.item },
			toObject(tree.left),
			toObject(tree.right));
	}
}
const toObject = R.curry(_toObject);

// queryIntersection:: (Range) -> (IntervalTree) -> map<ItemID, Item>
// #public
// Checks for intersections within the specified range.
// Includes intersections with endpoints of the query range.
function _queryIntersection(range, tree) {
	if (isEmpty(tree)) {
		return {};
	}

	if (rangesIntersect(range, tree.item.range)) {
		return Object.assign(
			{ [tree.item.id]: tree.item },
			queryIntersection(range, tree.left),
			queryIntersection(range, tree.right));
	} else if (isEmpty(tree.left)) {
		return queryIntersection(range, tree.right);
	} else if (tree.left.highestEndpointInSubtree < range.low) {
		return queryIntersection(range, tree.right);
	} else {
		// We can't make any assumptions about right subtree.
		// If we stored the lowest endpoint in subtree, we could do a check
		// like in the branch above, but to eliminate the right subtree.
		return Object.assign(
			queryIntersection(range, tree.left),
			queryIntersection(range, tree.right));
	}
}
const queryIntersection = R.curry(_queryIntersection);


// -- Private helpers

// rangesIntersect:: (Range) -> (Range) -> Bool
// Checks if two ranges intersect, including their endpoints.
const rangesIntersect = R.curry((a, b) => (
	a.high >= b.low && a.low <= b.high
));

// updateHighestEndpointInSubtree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `highestEndpointInSubtree` property.
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

	return Object.assign(
		{},
		tree,
		{ highestEndpointInSubtree });
}

export {
	empty,
	insert,
	isEmpty,
	toObject,
	queryIntersection,
};

