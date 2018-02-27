import * as R from 'ramda';

import * as errors from './errors';
import * as lenses from './lenses';
import { instantiate as instantiateBST } from './BST';

const BST = instantiateBST({
	shouldBeLeftChild: (parentData, childData) => (
		parentData.item.range.low > childData.item.range.low
	),
});


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

// IntervalTree:: BST<{ item: Item, highestEndpointInSubtree: Index, lowestEndpointInSubtree: Index }>
// #public
// #typealias
// An augmented interval tree node.


// -- Construction

// empty:: IntervalTree
// #public
// An empty interval tree.
const empty = BST.empty;

// Creates a BST.Data object for the specified IntervalTree item.
// Checks for valid range.
const dataForItem = (
	item,
	lowestEndpointInSubtree = item.range.low,
	highestEndpointInSubtree = item.range.high
) => {
	if (item.range.high < item.range.low) {
		throw new Error(errors.messages.negativeLengthInterval(item));
	}

	return {
		item,
		lowestEndpointInSubtree,
		highestEndpointInSubtree,
	}
};

// node:: (Item, IntervalTree, IntervalTree, ?Index, ?Index) -> IntervalTree
// Create a node with a value.
const node = (
	item, left = null, right = null, 
	lowestEndpointInSubtree = item.range.low,
	highestEndpointInSubtree = item.range.high
) => BST.node(
	dataForItem(
		item,
		lowestEndpointInSubtree,
		highestEndpointInSubtree),
	left,
	right);


// -- Mutators

// insert:: (Item) -> (IntervalTree) -> IntervalTree
// #public
// Insert an item into a tree. Does not rebalance the tree.
const insert = R.curry((item, tree) => R.pipe(
	BST.insert,
	updateExtrema
)(
	dataForItem(item), 
	tree));

// remove:: (ItemID) -> (IntervalTree) -> IntervalTree
// #public
// Returns a tree without the item with the specified item ID.
// If multiple items have the same item ID, behavior is undefined.
const remove = R.curry((itemID, tree) => (
	R.pipe(
		BST.remove(data => data.item.id === itemID),
		updateExtrema
	)(tree)
));

// -- Accessors

// isEmpty:: (IntervalTree) -> bool
// #public
// Checks if a specified interval tree is empty.
const isEmpty = BST.isEmpty;

// toObject:: (IntervalTree) -> map<ItemID, Item>
// #public
// Lists all intervals in an interval tree in a map from item ID to item.
const toObject = R.pipe(
	BST.toObject(data => data.item.id),
	R.map(data => data.item));

// queryIntersection:: (Range) -> (IntervalTree) -> map<ItemID, Item>
// #public
// Checks for intersections within the specified range.
// Includes intersections with endpoints of the query range.
function _queryIntersection(range, tree) {
	if (isEmpty(tree)) {
		return {};
	}

	if (rangesIntersect(range, R.view(lenses.range, tree))) {
		return Object.assign(
			{ [R.view(lenses.itemID, tree)]: R.view(lenses.item, tree) },
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

// validate:: (IntervalTree) -> IntervalTree
// #public
// Checks that the provided tree is a valid `IntervalTree`.
// Throws an error if the tree is invalid.
// Returns the original tree if valid.
function validate(tree) {
	return R.compose(BST.validate, validateIntervalTree)(tree);

	function validateIntervalTree(tree) {
		if (isEmpty(tree)) {
			return tree;
		}

		const range = R.view(lenses.range, tree);
		if (range.low > range.high) {
			throw new Error(
				error.messages.negativeLengthInterval(
					R.view(lenses.item, tree)));
		}

		let lowestEndpoint = range.low;
		let highestEndpoint = range.high;

		// Validate children.
		[tree.left, tree.right].forEach(child => {
			if (!isEmpty(child)) {
				validateIntervalTree(child);

				lowestEndpoint =
					Math.min(
						R.view(lenses.lowestEndpointInSubtree, child),
						lowestEndpoint);
				highestEndpoint =
					Math.max(
						R.view(lenses.highestEndpointInSubtree, child),
						highestEndpoint);
			}
		});

		if (lowestEndpoint != R.view(lenses.lowestEndpointInSubtree, tree)) {
			throw new Error(
				errors.messages.wrongLowestEndpointStored(
					lowestEndpoint,
					tree));
		}
		if (highestEndpoint != R.view(lenses.highestEndpointInSubtree, tree)) {
			throw new Error(
				errors.messages.wrongHighestEndpointStored(
					highestEndpoint,
					tree));
		}

		return tree;
	}
}


// -- Private helpers

// rangesIntersect:: (Range) -> (Range) -> Bool
// Checks if two ranges intersect, including their endpoints.
const rangesIntersect = R.curry((a, b) => (
	a.high >= b.low && a.low <= b.high
));

// updateExtrema:: (IntervalTree) -> IntervalTree
// Marks the specified node with its descendents' highest and lowest endpoints.
const updateExtrema = R.pipe(
	updateHighestEndpointInTree,
	updateLowestEndpointInTree);

// updateHighestEndpointInTree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `highestEndpointInSubtree` property.
function updateHighestEndpointInTree(tree) {
	if (isEmpty(tree)) {
		return tree;
	}

	const updateChildren = R.pipe(
		R.over(lenses.leftChild, updateHighestEndpointInTree),
		R.over(lenses.rightChild, updateHighestEndpointInTree)
	);

	const highestEndpoint = R.converge(
		Math.max,
		[
			R.view(R.compose(lenses.range, R.lensProp('high'))),
			R.pipe(
				R.view(R.compose(lenses.leftChild, lenses.highestEndpointInSubtree)),
				R.defaultTo(-Infinity)),
			R.pipe(
				R.view(R.compose(lenses.rightChild, lenses.highestEndpointInSubtree)),
				R.defaultTo(-Infinity))
		]);

	return R.pipe(
		updateChildren,
		R.converge(
			R.set(lenses.highestEndpointInSubtree),
			[highestEndpoint, R.identity])
	)(
		tree
	);
}

// updateLowestEndpointInTree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `lowestEndpointInSubtree` property.
function updateLowestEndpointInTree(tree) {
	if (isEmpty(tree)) {
		return tree;
	}

	const updateChildren = R.pipe(
		R.over(lenses.leftChild, updateLowestEndpointInTree),
		R.over(lenses.rightChild, updateLowestEndpointInTree)
	);

	const lowestEndpoint = R.converge(
		Math.min,
		[
			R.view(R.compose(lenses.range, R.lensProp('low'))),
			R.pipe(
				R.view(R.compose(lenses.leftChild, lenses.lowestEndpointInSubtree)),
				R.defaultTo(Infinity)),
			R.pipe(
				R.view(R.compose(lenses.rightChild, lenses.lowestEndpointInSubtree)),
				R.defaultTo(Infinity))
		]);

	return R.pipe(
		updateChildren,
		R.converge(
			R.set(lenses.lowestEndpointInSubtree),
			[lowestEndpoint, R.identity])
	)(
		tree
	);
}

export {
	empty,
	node,
	insert,
	remove,
	isEmpty,
	toObject,
	queryIntersection,
	validate,
};

