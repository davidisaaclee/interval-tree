import * as R from 'ramda';

// leftChild :: Lens IntervalTree IntervalTree
export const leftChild =
	R.lensProp('left');

// rightChild :: Lens IntervalTree IntervalTree
export const rightChild =
	R.lensProp('right');

// item :: Lens IntervalTree Item
export const item =
	R.lensPath(['data', 'item']);

// itemID :: Lens IntervalTree ItemID
export const itemID =
	R.compose(item, R.lensProp('id'));

// range :: Lens IntervalTree Range
export const range =
	R.compose(item, R.lensProp('range'));

// highestEndpointInSubtree :: Lens IntervalTree Index
export const highestEndpointInSubtree =
	R.lensPath(['data', 'highestEndpointInSubtree']);

// lowestEndpointInSubtree :: Lens IntervalTree Index
export const lowestEndpointInSubtree =
	R.lensPath(['data', 'lowestEndpointInSubtree']);

