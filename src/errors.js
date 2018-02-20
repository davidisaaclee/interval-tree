
import { isEmpty } from './index';

const printInterval = interval => isEmpty(interval) 
	? `(empty)`
	: `((${interval.range.low}, ${interval.range.high}), ${interval.id})`;

const negativeLengthInterval = interval => (
	`\`high\` of interval range must be greater than or equal to \`low\`:
	${printInterval(interval)}`
);

export const messages = {
	negativeLengthInterval,
};



