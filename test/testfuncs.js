var tf = ((_) => {
    var {match, gt, lt, eq, inRange, add, mul, sqr, ret, compose, thread} = _,
        tf = {
            matchBools: (p) => match(p,
                                    [true, true], 'tt',
                                    [true, false], 'tf',
                                    [false, true], 'ft',
                                    [false, false], 'ff'),

            matchNumbers: (p) => match(p,
                                    [0, _], '0 ANY',
                                    [1, 0], '1 0',
                                    [2, 1], () => '2 1',
                                    _, 'ANY'),

            matchStrings: (p) => match(p,
                                    ['red', 'cat'], 'A red cat',
                                    ['blue', 'cat'], 'A blue cat',
                                    [_, 'cat'], 'A cat of some color',
                                    ['red', 'dog'], 'A red dog',
                                    ['blue', 'dog'], 'A blue dog',
                                    [_, 'dog'], 'A dog of some color',
                                    ['red', _], _,
                                    ['blue', _], 'A red or blue something',
                                    _, 'Something entirely different'),

            fib: (n) => match(n,
                            0, 0,
                            1, 1,
                            _, () => tf.fib(n - 1) + tf.fib(n - 2)),

            matchRanges: (p) => match(p,
                                    gt(100), '> 100',
                                    lt(0), '< 0',
                                    inRange(0, 100), '0 <= x <= 100',
                                    _, (val) => 'Outside a known range: ' + val),

            matchComplexRanges: (p) => match(p,
                                        [lt(20), eq(20), gt(20)], '< 20, 20, > 20',
                                        [inRange(0, 10), eq(0), _], '0 < x < 10, 0, _',
                                        _, '_'),

            matchMaps: (p) => match(p,
                                {x: gt(60), y: 40}, 'x > 60, y == 40',
                                {y: 40}, 'y == 40',
                                {x: 50}, 'x == 50',
                                _, '_'),

            matchInstanceOf: (p) => (match(p,
                                        _.instanceOf(Array), (arr) => arr.concat('Array'),
                                        _.instanceOf(Object), (obj) => Object.keys(obj)).join(' ')),

            compose1: compose(add(2), mul(5), sqr),
            compose2: compose(ret(10), add(2), mul(5), sqr),

            thread: () => thread(10, add(2), mul(5), sqr)
        };

    return tf;
})(_);