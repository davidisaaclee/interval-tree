
import { isEmpty } from './index';

const printInterval = interval => isEmpty(interval) 
	? `(empty)`
	: `((${interval.range.low}, ${interval.range.high}), ${interval.id})`;

export const messages = {
	negativeLengthInterval: interval => (
		`\`high\` of interval range must be greater than or equal to \`low\`:
		${printInterval(interval)}`
	),

	leftChildOutOfOrder: parentNode => (
		`Left child is out of order.`
	),

	rightChildOutOfOrder: parentNode => (
		`Right child is out of order.`
	),

	wrongLowestEndpointStored: (expected, node) => (
		`Wrong lowest endpoint stored on node.\n\tExpected: ${expected}\n\tActual: ${node.lowestEndpointInSubtree}`
	),

	wrongHighestEndpointStored: (expected, node) => (
		`Wrong highest endpoint stored on node.\n\tExpected: ${expected}\n\tActual: ${node.highestEndpointInSubtree}`
	),
};



