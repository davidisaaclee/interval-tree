# interval-tree
An implementation of a symmetrically-augmented interval tree with an
immutable functional interface. All state is stored as plain objects
for easy serialization or use in a Redux state.

## Installation
```bash
yarn add davidisaaclee/interval-tree
```

### Development
```bash
# Clone repository.
git clone https://github.com/davidisaaclee/interval-tree
cd interval-tree

# Install dependencies.
yarn

# Build for ES modules, CommonJS, and UMD.
yarn build

# Run tests.
yarn test

# Optional: Build documentation and place in `docs/`.
yarn run docs
```

## Usage

### Constructing a tree
```javascript
import * as IntervalTree from 'interval-tree';

let tree = IntervalTree.empty;

tree =
	IntervalTree.insert(
		{
			id: 'interval1', 
			range: {
				low: 2,
				high: 10
			}
		},
		tree);

const intervalsToAdd = [
	{
		id: 'interval2', 
		range: {
			low: 3,
			high: 4
		}
	},
	{
		id: 'interval3', 
		range: {
			low: -5,
			high: 0
		}
	},
];

tree = intervalsToAdd.reduce(
	(tree, interval) => IntervalTree.insert(interval, tree),
	tree);


tree =
	IntervalTree.remove(
		'interval2',
		tree);
```

### Querying for intersecting intervals
```javascript
// `tree` is the tree we constructed in the example above,
// with intervals `interval1` and `interval3`.
const intersects5To10 =
	IntervalTree.queryIntersection(
		{ low: 5, high: 10 },
		tree);

assert.deepEqual(intersects5To10, {
	'interval1': {
		id: 'interval1', 
		range: {
			low: 2,
			high: 10
		}
	}
});


const intersectsNegative4To3 =
	IntervalTree.queryIntersection(
		{ low: -4, high: 3 },
		tree);

assert.deepEqual(intersectsNegative4To3, {
	'interval1': {
		id: 'interval1', 
		range: {
			low: 2,
			high: 10
		}
	},
	'interval3': {
		id: 'interval3', 
		range: {
			low: -5,
			high: 0
		}
	},
});
```

### Curried usage
All exposed functions have been passed through
[Ramda's `curry`](http://ramdajs.com/docs/#curry) function, which
allows the functions to be optionally called in curried form.

```javascript
import * as IntervalTree from 'interval-tree';

let tree = IntervalTree.empty;

tree = IntervalTree.insert(interval1)(tree);
// is the same as
tree = IntervalTree.insert(interval1, tree);
```

This allows for chaining functions by composing them.
```javascript
import * as R from 'ramda';

// `pipe` is left-to-right function composition.
// http://ramdajs.com/docs/#pipe

const tree = R.pipe(
	IntervalTree.insert(interval1),
	IntervalTree.insert(interval2),
	IntervalTree.insert(interval3),
	IntervalTree.remove('interval2')
)(IntervalTree.empty);
```

## See also
There are a lot of other well-written interval tree packages. I wrote
this one because I wanted an interval tree I could use in a Redux
state, and all of the implementations I found were class-based or
mutable.

- [ShieldBattery/node-interval-tree](https://github.com/ShieldBattery/node-interval-tree):
A self-balancing interval tree written in TypeScript. Class-based and
mutable.
- [shinout/interval-tree2](https://github.com/shinout/interval-tree2)
- [mikolalysenko/interval-tree-1d](https://github.com/mikolalysenko/interval-tree-1d)

- [toberndo/interval-query](https://github.com/toberndo/interval-query):
A segment tree implementation, which is similar to and generally
faster than an interval tree, except it doesn't allow inserting items
after the tree is built.
- [A nice explanation and visualization of interval trees](https://www.coursera.org/learn/algorithms-part1/lecture/ot9vw/interval-search-trees),
from a Princeton computer science lecture.

