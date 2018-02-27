import * as R from 'ramda';
import * as lenses from './lenses';

const printInterval = interval => interval == null
	? `(empty)`
	: `((${interval.range.low}, ${interval.range.high}), ${interval.id})`;

export const messages = {
	negativeLengthInterval: interval => (
		`\`high\` of interval range must be greater than or equal to \`low\`:
		${printInterval(interval)}`
	),

	leftChildOutOfOrder: parentNode => (
		`Left child is out of order: ${JSON.stringify(parentNode)}`
	),

	rightChildOutOfOrder: parentNode => (
		`Right child is out of order: ${JSON.stringify(parentNode)}`
	),

	wrongLowestEndpointStored: (expected, node) => (
		`Wrong lowest endpoint stored on node.
	Expected: ${expected}
	Actual: ${R.view(lenses.lowestEndpointInSubtree, node)}`
	),

	wrongHighestEndpointStored: (expected, node) => (
		`Wrong highest endpoint stored on node.
	Expected: ${expected}
	Actual: ${R.view(lenses.highestEndpointInSubtree, node)}`
	),
};



