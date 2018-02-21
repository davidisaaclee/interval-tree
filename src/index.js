/** @module IntervalTree */
import assert from 'assert';
import * as R from 'ramda';

import * as errors from './errors';

/**
 * @typedef {number} Index
 */

/**
 * @typedef {string} ItemID
 */

/**
 * @typedef Range
 * @property {Index} low
 * @property {Index} high
 */

/**
 * @typedef Item
 * @property {Range} range
 * @property {ItemID} id
 */

/**
 * @typedef Node
 * @property {Item} item
 * @property {Index} highestEndpointInSubtree
 * @property {IntervalTree} left
 * @property {IntervalTree} right
 */

/**
 * @typedef {null} Leaf
 */

/**
 * @typedef {(Node|Leaf)} IntervalTree
 */


// -- Construction

/** 
 * An empty interval tree.
 * @type {IntervalTree}
 */
const empty = null;

/**
 * @private
 * @param {Item} item
 * @param {IntervalTree} left
 * @param {IntervalTree} right
 * @returns {IntervalTree}
 */
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

/**
 * Insert an item into a tree. Does not rebalance the tree.
 *
 * @alias module:IntervalTree.insert
 * @param {Item} item
 * @param {IntervalTree} tree
 * @returns {IntervalTree}
 */
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

/**
 * Checks if a specified interval tree is empty.
 *
 * @param {IntervalTree} tree
 * @returns {boolean}
 */
const isEmpty = tree => tree == null;

/**
 * Lists all intervals in an interval tree in a map from
 * item ID to item.
 *
 * @alias module:IntervalTree.toObject
 * @param {IntervalTree} tree
 * @returns {Object.<ItemID, Item>}
 */
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

/**
 * Checks for intersections within the specified range. Includes intersections
 * with endpoints of the query range.
 *
 * @alias module:IntervalTree.queryIntersection
 * @param {Range} range
 * @param {IntervalTree} tree
 * @returns {Object.<ItemID, Item>}
 */
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

