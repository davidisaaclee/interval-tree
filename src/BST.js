import * as R from 'ramda';

import * as errors from './errors';

// BST<Data>:: union<null, { data: Data, left: BST, right: BST}>
// #public
// #typealias
// A binary search tree node.

// -- Lenses
const lenses = {
	// leftChild :: Lens BST BST
	leftChild: R.lensProp('left'),

	// rightChild :: Lens BST BST
	rightChild: R.lensProp('right'),

	// data :: Lens BST Item
	data: R.lensProp('data'),
};

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


// -- Construction

// empty:: BST
// #public
// An empty tree.
const empty = null;

// node:: (Data, BST, BST) -> BST
// Create a node.
function node(data, left = empty, right = empty) {
	return { data, left, right };
}


// -- Mutators

// insert:: (BST.Data) -> (BST) -> BST
// #public
// Insert an item into a tree. Does not rebalance the tree.
function makeInsert(shouldBeLeftChild) {
	function _insert(data, tree) {
		if (isEmpty(tree)) {
			return node(data);
		}

		const descendLens = shouldBeLeftChild(tree.data, data)
			? lenses.leftChild
			: lenses.rightChild;

		return R.over(descendLens, insert(data), tree);
	};

	const insert = R.curry(_insert);
	return insert;
}

// remove:: (BST.Data -> boolean) -> (BST) -> BST
// #public
// Returns a tree without the item which passes the specified predicate.
// If multiple items passes the predicate, behavior is undefined.
function _remove(predicate, tree) {
	if (isEmpty(tree)) {
		return tree;
	} else if (R.pipe(R.view(lenses.data), predicate)(tree)) {
		if (!isEmpty(tree.left) && !isEmpty(tree.right)) {
			// Get in-order successor to `tree`; "delete" it; replace values in `tree`.
			const successorLens =
				lensForSuccessorElement(tree);
			// assert(successorLens != null);

			const successor = 
				R.view(successorLens, tree);
			/*
		assert.notEqual(
			successor,
			null,
			`Expected successor of ${JSON.stringify(tree)}`);
			*/

			return R.pipe(
				R.set(successorLens, empty),
				R.set(lenses.data, R.view(lenses.data, successor))
			)(tree);
		} else if (!isEmpty(tree.left)) {
			return tree.left;
		} else if (!isEmpty(tree.right)) {
			return tree.right;
		} else {
			return empty;
		}
	} else {
		return R.pipe(
			R.over(lenses.leftChild, remove(predicate)),
			R.over(lenses.rightChild, remove(predicate))
		)(tree);
	}
}
const remove = R.curry(_remove);

// -- Accessors

// isEmpty:: (BST) -> bool
// #public
// Checks if a specified tree is empty.
function isEmpty(tree) {
	return tree == null;
}

// toObject:: (BST.Data -> string) -> (BST) -> map<ItemID, Item>
// #public
// Lists all items in the tree in a map, using the provided indexing
// function to generate keys for each item.
function _toObject(keyFromData, tree) {
	if (isEmpty(tree)) {
		return {};
	} else {
		return Object.assign(
			{ [keyFromData(tree.data)]: tree.data },
			toObject(keyFromData, tree.left),
			toObject(keyFromData, tree.right));
	}
}
const toObject = R.curry(_toObject);

// validate:: (BST) -> BST
// #public
// Checks that the provided tree is a valid `BST`.
// Throws an error if the tree is invalid.
// Returns the original tree if valid.
function makeValidate(shouldBeLeftChild) {
	return function validate(tree) {
		if (isEmpty(tree)) {
			return tree;
		}

		// Validate ordering of immediate children.
		if (!isEmpty(tree.left) && !shouldBeLeftChild(tree.data, tree.left.data)) {
			throw new Error(errors.messages.leftChildOutOfOrder(tree));
		}
		if (!isEmpty(tree.right) && shouldBeLeftChild(tree.data, tree.right.data)) {
			throw new Error(errors.messages.rightChildOutOfOrder(tree));
		}

		// Validate children.
		[tree.left, tree.right].forEach(child => {
			if (!isEmpty(child)) {
				validate(child);
			}
		});

		return tree;
	}
}

// if shouldBeLeftChild(parent.data, child.data), child should go to left of parent
// ("greater than or equal")
export const instantiate = ({ shouldBeLeftChild }) => {
	return {
		empty,
		node,

		insert: makeInsert(shouldBeLeftChild),
		remove,

		isEmpty,
		validate: makeValidate(shouldBeLeftChild),
		toObject,
	}
};

