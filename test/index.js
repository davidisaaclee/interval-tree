import test from 'ava';
import * as R from 'ramda';

import * as IT from '../src';
import * as errors from '../src/errors';

const fixtures = (() => {
	let retval = {};

	const intervals = [
		{ range: { low: 17, high: 19 }, id: 'interval1' },
		{ range: { low: 5, high: 8 }, id: 'interval2' },
		{ range: { low: 21, high: 24 }, id: 'interval3' },
		{ range: { low: 4, high: 8 }, id: 'interval4' },
		{ range: { low: 15, high: 18 }, id: 'interval5' },
		{ range: { low: 7, high: 10 }, id: 'interval6' },
		{ range: { low: 16, high: 22 }, id: 'interval7' },
	];

	const tree = R.pipe(...R.map(IT.insert, intervals))(IT.empty);

	retval['tree1'] = { tree, intervals };

	return retval;
})();

test('empty / isEmpty', t => {
	t.true(IT.isEmpty(IT.empty));
});

test('insert single item', t => {
	const interval1 = { range: { low: 0, high: 10 }, id: 'interval1' };
	const tree = R.pipe(
		IT.insert(interval1),
	)(
		IT.empty
	);

	t.false(IT.isEmpty(tree));
	t.deepEqual(IT.toObject(tree), {
		[interval1.id]: interval1
	});
});

test('insert multiple items', t => {
	const interval1 = { range: { low: 0, high: 2 }, id: 'interval1' };
	const interval2 = { range: { low: -5, high: 1 }, id: 'interval2' };
	const interval3 = { range: { low: 5, high: 10 }, id: 'interval3' };
	const tree = R.pipe(
		IT.insert(interval1),
		IT.insert(interval2),
		IT.insert(interval3),
	)(
		IT.empty
	);

	t.false(IT.isEmpty(tree));
	t.deepEqual(IT.toObject(tree), {
		[interval1.id]: interval1,
		[interval2.id]: interval2,
		[interval3.id]: interval3,
	});
});

test('insert throws on negative length interval ranges', t => {
	const negativeLengthInterval = {
		range: { low: 10, high: 5 },
		id: 'interval1' 
	};
	t.throws(
		() => R.pipe(
			IT.insert(negativeLengthInterval),
		)(
			IT.empty
		),
		errors.messages.negativeLengthInterval(negativeLengthInterval));
});

test('queryIntersection', t => {
	const interval1 = { range: { low: 0, high: 2 }, id: 'interval1' };
	const interval2 = { range: { low: -5, high: 1 }, id: 'interval2' };
	const interval3 = { range: { low: 5, high: 10 }, id: 'interval3' };
	const tree = R.pipe(
		IT.insert(interval1),
		IT.insert(interval2),
		IT.insert(interval3),
	)(
		IT.empty
	);

	t.deepEqual(
		IT.queryIntersection(
			{ low: 1, high: 2 },
			tree),
		{
			[interval1.id]: interval1,
			[interval2.id]: interval2,
		});

	t.deepEqual(
		IT.queryIntersection(
			{ low: 3, high: 4 },
			tree),
		{});
});

test('queryIntersection2', t => {
	t.deepEqual(
		IT.queryIntersection(
			{ low: 23, high: 25 },
			fixtures.tree1.tree),
		{
			[fixtures.tree1.intervals[2].id]: fixtures.tree1.intervals[2],
		});

	t.deepEqual(
		IT.queryIntersection(
			{ low: 12, high: 14 },
			fixtures.tree1.tree),
		{});

	t.deepEqual(
		IT.queryIntersection(
			{ low: 21, high: 23 },
			fixtures.tree1.tree),
		{
			[fixtures.tree1.intervals[2].id]: fixtures.tree1.intervals[2],
			[fixtures.tree1.intervals[6].id]: fixtures.tree1.intervals[6],
		});
});

test('removing a leaf item from a tree', t => {
	const tree =
		fixtures.tree1.tree;
	const treeWithoutInterval2 =
		IT.remove(fixtures.tree1.intervals[2].id, tree);

	t.deepEqual(
		IT.toObject(treeWithoutInterval2),
		R.dissoc(fixtures.tree1.intervals[2].id, IT.toObject(tree)));
});

test('removing a middle node from a tree', t => {
	const tree =
		fixtures.tree1.tree;
	const treeWithoutInterval1 =
		IT.remove(fixtures.tree1.intervals[1].id, tree);

	t.deepEqual(
		IT.toObject(treeWithoutInterval1),
		R.dissoc(fixtures.tree1.intervals[1].id, IT.toObject(tree)));
});

test('removing each node from a tree', t => {
	const tree =
		fixtures.tree1.tree;

	for (let i = 0; i < fixtures.tree1.intervals.length; i++) {
		const interval = fixtures.tree1.intervals[i];

		t.deepEqual(
			IT.toObject(IT.remove(interval.id, tree)),
			R.dissoc(interval.id, IT.toObject(tree)));
	}
});

test.todo('attempting to remove an item that doesn\'t exist from a tree');

test.todo('removing item does not create an invalid augmented interval tree');

