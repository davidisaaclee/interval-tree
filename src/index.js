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

// -- Lenses
const lenses = {
	// leftChild :: Lens IntervalTree IntervalTree
	leftChild: R.lensProp('left'),

	// rightChild :: Lens IntervalTree IntervalTree
	rightChild: R.lensProp('right'),

	// item :: Lens IntervalTree Item
	item: R.lensProp('item'),

	// highestEndpointInSubtree :: Lens IntervalTree Index
	highestEndpointInSubtree: R.lensProp('highestEndpointInSubtree'),

	// lowestEndpointInSubtree :: Lens IntervalTree Index
	lowestEndpointInSubtree: R.lensProp('lowestEndpointInSubtree'),
};

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

	const descendLens = item.range.low < tree.item.range.low
		? lenses.leftChild
		: lenses.rightChild;

	return R.pipe(
		R.over(descendLens, insert(item)),
		updateExtrema
	)(tree);
};
const insert = R.curry(_insert);

// remove:: (ItemID) -> (IntervalTree) -> IntervalTree
// #public
// Returns a tree without the item with the specified item ID.
// If multiple items have the same item ID, behavior is undefined.
function _remove(itemID, tree) {
	if (isEmpty(tree)) {
		return tree;
	} else if (tree.item.id === itemID) {
		if (tree.left != null && tree.right != null) {
			// Get in-order successor to `tree`; "delete" it; replace values in `tree`.
			const successorLens =
				lensForSuccessorElement(tree);
			assert(successorLens != null);

			const successor = 
				R.view(successorLens, tree);
			assert.notEqual(successor, null, `Expected successor of ${JSON.stringify(tree)}`);

			return R.pipe(
				R.set(successorLens, null),
				R.set(lenses.item, successor.item),
				updateExtrema
			)(tree);
		} else if (tree.left != null) {
			return tree.left;
		} else if (tree.right != null) {
			return tree.right;
		} else {
			return empty;
		}
	} else {
		return R.pipe(
			R.over(lenses.leftChild, remove(itemID)),
			R.over(lenses.rightChild, remove(itemID)),
			updateExtrema
		)(tree);
	}
}
const remove = R.curry(_remove);

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
		R.over(lenses.rightChild, updateHighestEndpointInTree),
	);

	const highestEndpoint = R.converge(
		Math.max,
		[
			R.view(lenses.highestEndpointInSubtree),
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
			[highestEndpoint, R.identity]),
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
		R.over(lenses.rightChild, updateLowestEndpointInTree),
	);

	const lowestEndpoint = R.converge(
		Math.min,
		[
			R.view(lenses.lowestEndpointInSubtree),
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
			[lowestEndpoint, R.identity]),
	)(
		tree
	);
}

const hasChildren =
	tree => tree.left != null || tree.right != null;

// lensForCurrentMinElement :: (IntervalTree) -> ?(Lens IntervalTree IntervalTree)
// Returns a lens focused on the position of the current minimum element in the specified tree.
// If tree is empty, returns null instead of a lens.
function lensForCurrentMinElement(tree) {
	if (isEmpty(tree)) {
		return null;
	} else if (isEmpty(tree.left)) {
		return R.identity;
	} else {
		return R.compose(
			lenses.leftChild,
			R.defaultTo(
				R.identity,
				lensForCurrentMinElement(tree.left)));
	}
}

// lensForSuccessorElement :: (IntervalTree) -> ?(Lens IntervalTree IntervalTree)
// If tree has no successor, returns null instead of a lens.
function lensForSuccessorElement(tree) {
	if (isEmpty(tree)) {
		return null;
	} if (isEmpty(tree.right)) {
		return null;
	} else {
		return R.compose(
			lenses.rightChild,
			// guaranteed to be non-null
			lensForCurrentMinElement(tree.right));
	}
}

export {
	empty,
	insert,
	remove,
	isEmpty,
	toObject,
	queryIntersection,
};

