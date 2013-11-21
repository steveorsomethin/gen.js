((_, tf) => {
    var should = chai.should(),
        assert = chai.assert;

    describe('fjs', () => {
        describe('match', () => {
            it('should match tuples of bools', () => {
                tf.matchBools([true, true]).should.equal('tt');
                tf.matchBools([true, false]).should.equal('tf');
                tf.matchBools([false, true]).should.equal('ft');
                tf.matchBools([false, false]).should.equal('ff');
            });

            it('should match tuples of numbers', () => {
                tf.matchNumbers([0, 100]).should.equal('0 ANY');
                tf.matchNumbers([0, 50]).should.equal('0 ANY');
                tf.matchNumbers([1, 0]).should.equal('1 0');
                tf.matchNumbers([2, 1]).should.equal('2 1');
                tf.matchNumbers([50, 100]).should.equal('ANY');
            });

            it('should match tuples of strings', () => {
                tf.matchStrings(['red', 'cat']).should.equal('A red cat');
                tf.matchStrings(['blue', 'cat']).should.equal('A blue cat');
                tf.matchStrings(['yellow', 'cat']).should.equal('A cat of some color');
                tf.matchStrings(['red', 'dog']).should.equal('A red dog');
                tf.matchStrings(['blue', 'dog']).should.equal('A blue dog');
                tf.matchStrings(['yellow', 'dog']).should.equal('A dog of some color');
                tf.matchStrings(['red', 'otter']).should.equal('A red or blue something');
                tf.matchStrings(['blue', 'narwhal']).should.equal('A red or blue something');
                tf.matchStrings(['pink', 'human']).should.equal('Something entirely different');
            });

            it('should match over discriminated unions', () => {
                var {match, discrim, option} = _,
                    {Some, None} = option,
                    shape = discrim({Square: ['width', 'height'], Circle: ['radius']}),
                    Square = shape.Square,
                    Circle = shape.Circle,
                    matchShape = (p) => match(p,
                                            Square, (width, height) => width * height,
                                            Circle, (radius) => Math.round(Math.PI * radius * radius),
                                            _, () => 0),
                    matchOption = (p) => match(p,
                                            Some, (value) => value,
                                            None, () => 'Got none, oh well');

                matchShape(Square(8, 8)).should.equal(64);
                matchShape(Circle(3)).should.equal(28);

                matchOption(Some('Got some!')).should.equal('Got some!');
                matchOption(None()).should.equal('Got none, oh well');
            });

            it('should evaluate right hand functions', () => {
                tf.fib(10).should.equal(55);
            });

            it('should match with left hand predicates', () => {
                tf.matchRanges(101).should.equal('> 100');
                tf.matchRanges(-1).should.equal('< 0');
                tf.matchRanges(50).should.equal('0 <= x <= 100');
                tf.matchRanges(NaN).should.equal('Outside a known range: NaN');
                tf.matchRanges().should.equal('Outside a known range: undefined');
            });

            it('should match with complex left hand predicates', () => {
                tf.matchComplexRanges([10, 20, 30]).should.equal('< 20, 20, > 20');
                tf.matchComplexRanges([5, 0, 10]).should.equal('0 < x < 10, 0, _');
                tf.matchComplexRanges([7, 7, 7]).should.equal('_');
            });

            it('should match over maps', () => {
                tf.matchMaps({x: 70, y: 40}).should.equal('x > 60, y == 40');
                tf.matchMaps({y: 40}).should.equal('y == 40');
                tf.matchMaps({x: 50}).should.equal('x == 50');
                tf.matchMaps({y: 100}).should.equal('_');
            });

            it('should match over type checks', () => {
                tf.matchInstanceOf(['I am an']).should.equal('I am an Array');
                tf.matchInstanceOf({'I am an': 0, 'Object': 1}).should.equal('I am an Object');
            });
        });

        describe('compose', () => {
            it('should properly chain calls', () => {
                tf.compose1(10).should.equal(3600);
                tf.compose2().should.equal(3600);
            });
        });

        describe('thread', () => {
            it('should properly chain calls', () => {
                tf.thread().should.equal(3600);
            });
        });

        describe('flip', () => {
            it('should apply arguments in reversed order', () => {
                var {flip, sub, div} = _,
                    subf = flip(sub),
                    divf = flip(div);
                
                subf(1, 5).should.equal(4);
                divf(2, 10).should.equal(5);
            });
        });

        describe('range', () => {
            var {range, toArray, thread, inf, ninf, take} = _;

            it('should iterate ascending', () => {
                thread(range(0, 5), toArray).should.eql([0, 1, 2, 3, 4, 5]);
            });

            it('should iterate descending', () => {
                thread(range(0, -5), toArray).should.eql([0, -1, -2, -3, -4, -5]);
            });

            it('should support infinite ascension', () => {
                thread(range(0, inf), take(5), toArray).should.eql([0, 1, 2, 3, 4]);
            });

            it('should support infinite descension', () => {
                thread(range(0, ninf), take(5), toArray).should.eql([0, -1, -2, -3, -4]);
            });

            it('should yield a single element when the range params are equal', () => {
                thread(range(1, 1), toArray).should.eql([1]);
            });
        });

        describe('rangeStep', () => {
            var {rangeStep, toArray, thread, inf, ninf, take} = _;

            it('should iterate ascending', () => {
                thread(rangeStep(0, 25, 5), toArray).should.eql([0, 5, 10, 15, 20, 25]);
            });

            it('should iterate descending', () => {
                thread(rangeStep(0, -25, -5), toArray).should.eql([0, -5, -10, -15, -20, -25]);
            });

            it('should support infinite ascension', () => {
                thread(rangeStep(0, inf, 10), take(5), toArray).should.eql([0, 10, 20, 30, 40]);
            });

            it('should support infinite descension', () => {
                thread(rangeStep(0, ninf, -10), take(5), toArray).should.eql([0, -10, -20, -30, -40]);
            });

            it('should yield an infinite unchanging sequence when the step is 0', () => {
                thread(rangeStep(1, inf, 0), take(5), toArray).should.eql([1, 1, 1, 1, 1]);
            });
        });

        describe('map', () => {
            var {range, toArray, thread, map, sqr} = _;

            it('should lazily transform sequences', () => {
                thread(range(0, 5), map(sqr), toArray).should.eql([0, 1, 4, 9, 16, 25]);
            });
        });

        describe('foldl', () => {
            var {range, head, thread, foldl, add} = _;

            it('should lazily reduce sequences', () => {
                thread(range(0, 5), foldl(add, 0), head).should.eql(15);
            });
        });

        describe('head', () => {
            var {head} = _;

            it('should return the first element of a sequence', () => {
                head([1, 2, 3]).should.eql(1);
            });

            it('should return the first element of a single element sequence', () => {
                head([1]).should.eql(1);
            });

            it('should return undefined on empty input', () => {
                assert.equal(head([]), undefined);
            });
        });

        describe('tail', () => {
            var {thread, range, tail, toArray} = _;

            it('should return everything except the first element of a sequence', () => {
                thread(range(1, 3), tail, toArray).should.eql([2, 3]);
            });

            it('should return empty on sequences of length 0 or 1', () => {
                toArray(tail([1])).should.eql([]);
                toArray(tail([])).should.eql([]);
            });
        });

        describe('last', () => {
            var {last} = _;

            it('should return the last element of a sequence', () => {
                last([1, 2, 3]).should.eql(3);
            });

            it('should return the last element of a single element sequence', () => {
                last([1]).should.eql(1);
            });

            it('should return undefined on empty input', () => {
                assert.equal(last([]), undefined);
            });
        });

        describe('init', () => {
            var {thread, range, init, toArray} = _;

            it('should return everything except the last element of a sequence', () => {
                thread(range(1, 3), init, toArray).should.eql([1, 2]);
            });

            it('should return empty on sequences of length 0 or 1', () => {
                toArray(init([1])).should.eql([]);
                toArray(init([])).should.eql([]);
            });
        });

        describe('zip', () => {
            var {thread, range, zip, toArray} = _;

            it('should yield tuples of values', () => {
                thread(zip(range(1, 3), range(4, 6)), toArray).should.eql([[1, 4], [2, 5], [3,6]]);
            });

            it('should only yield up to the shortest sequences length', () => {
                thread(zip(range(1, 3), range(4, 9)), toArray).should.eql([[1, 4], [2, 5], [3,6]]);
                thread(zip(range(1, 20), range(4, 6)), toArray).should.eql([[1, 4], [2, 5], [3,6]]);
            });

            it('should return empty on sequences of length 0', () => {
                toArray(zip([1], [])).should.eql([]);
                toArray(zip([], [])).should.eql([]);
            });
        });

        describe('repeat', () => {
            var {thread, take, repeat, toArray} = _;

            it('should yield value infinitely', () => {
                thread(repeat('x'), take(5), toArray).should.eql(['x', 'x', 'x', 'x', 'x']);
            });
        });

        describe('replicate', () => {
            var {replicate, toArray} = _;

            it('should yield value up to specified count', () => {
                toArray(replicate(5, 'x')).should.eql(['x', 'x', 'x', 'x', 'x']);
            });
        });

        describe('repeatedly', () => {
            var {ret, thread, take, repeatedly, toArray} = _;

            it('should yield function result infinitely', () => {
                thread(repeatedly(ret('x')), take(5), toArray).should.eql(['x', 'x', 'x', 'x', 'x']);
            });
        });

        describe('cons', () => {
            var {thread, range, cons, toArray} = _;

            it('should yield values merged together', () => {
                thread(cons(0, range(1, 5)), toArray).should.eql([0, 1, 2, 3, 4, 5]);
            });
        });

        describe('conj', () => {
            var {thread, range, conj, toArray} = _;

            it('should yield values merged together', () => {
                thread(conj(range(1, 5), 6), toArray).should.eql([1, 2, 3, 4, 5, 6]);
            });
        });

        describe('concat', () => {
            var {thread, range, concat, toArray} = _;

            it('should yield values merged together', () => {
                thread(concat(range(1, 3), range(4, 6)), toArray).should.eql([1, 2, 3, 4, 5, 6]);
            });
        });

        describe('reverse', () => {
            var {thread, range, reverse, toArray} = _;

            it('should yield values in reverse', () => {
                thread(range(1, 5), reverse, toArray).should.eql([5, 4, 3, 2, 1]);
            });

            it('should handle empty sequences', () => {
                thread([], reverse, toArray).should.eql([]);
            });
        });

        describe('take', () => {
            var {thread, range, take, toArray} = _;

            it('should yield the specified number of values', () => {
                thread(range(1, 5), take(2), toArray).should.eql([1, 2]);
            });

            it('should terminate with the underlying sequence', () => {
                thread(range(1, 5), take(20), toArray).should.eql([1, 2, 3, 4, 5]);
            });

            it('should yield empty when taking 0', () => {
                thread(range(1, 5), take(0), toArray).should.eql([]);
            });
        });

        describe('takeWhile', () => {
            var {thread, range, takeWhile, lt, ret, toArray} = _;

            it('should yield values while the predicate evaluates to true', () => {
                thread(range(1, 5), takeWhile(lt(3)), toArray).should.eql([1, 2]);
            });

            it('should terminate with the underlying sequence', () => {
                thread(range(1, 5), takeWhile(lt(20)), toArray).should.eql([1, 2, 3, 4, 5]);
            });

            it('should yield empty when no elements match predicate', () => {
                thread(range(1, 5), takeWhile(ret(false)), toArray).should.eql([]);
            });
        });
    });
})(_, tf);