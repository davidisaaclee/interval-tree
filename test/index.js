import test from 'ava';
import * as R from 'ramda';

import * as IT from '../src';
import * as errors from '../src/errors';

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
	const interval1 = { range: { low: 0, high: 0 }, id: 'interval1' };
	const interval2 = { range: { low: 0, high: 10 }, id: 'interval2' };
	const tree = R.pipe(
		IT.insert(interval1),
		IT.insert(interval2),
	)(
		IT.empty
	);

	t.false(IT.isEmpty(tree));
	t.deepEqual(IT.toObject(tree), {
		[interval1.id]: interval1,
		[interval2.id]: interval2,
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
		errors.InvalidRangeError,
		errors.messages.negativeLengthInterval(negativeLengthInterval)
	);
});

