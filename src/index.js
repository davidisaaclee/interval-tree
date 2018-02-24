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

// IntervalTree:: union<null, { item: Item, highestEndpointInSubtree: Index, lowestEndpointInSubtree: Index, left: IntervalTree, right: IntervalTree}>
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
		lowestEndpointInSubtree: item.range.low,
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
		return updateExtrema(Object.assign(
			{}, 
			tree,
			{ left: insert(item, tree.left) })); 
	} else {
		return updateExtrema(Object.assign(
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
	} else if (tree.right.lowestEndpointInSubtree > range.high) {
		return queryIntersection(range, tree.left);
	} else {
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

// updateExtrema:: (IntervalTree) -> IntervalTree
// Marks the specified node with its descendents' highest and lowest endpoints.
const updateExtrema = R.pipe(updateHighestEndpointInTree, updateLowestEndpointInTree);

// updateHighestEndpointInTree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `highestEndpointInSubtree` property.
function updateHighestEndpointInTree(tree) {
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

// updateLowestEndpointInTree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `lowestEndpointInSubtree` property.
function updateLowestEndpointInTree(tree) {
	if (isEmpty(tree)) {
		return tree;
	}

	const lowestEndpointLeft = tree.left == null
		? -Infinity
		: tree.left.lowestEndpointInSubtree;

	const lowestEndpointRight = tree.right == null
		? -Infinity
		: tree.right.lowestEndpointInSubtree;

	const lowestEndpointInSubtree =
		Math.max(
			lowestEndpointLeft,
			lowestEndpointRight,
			tree.item.range.low);

	return Object.assign(
		{},
		tree,
		{ lowestEndpointInSubtree });
}

export {
	empty,
	insert,
	isEmpty,
	toObject,
	queryIntersection,
};

