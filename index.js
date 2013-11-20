var _;

(() => {
    function autoPartial(fn, self) {
        var wrapper = (prevArgs, ...args) => {
            var currArgs = prevArgs.concat(args);

            return currArgs.length >= fn.length ?
                fn.apply(self, currArgs) : wrapper.bind(self, currArgs);
        };

        return wrapper.bind(self, []);
    }

    var proto = {
        discrim: function(types) {
            if (this instanceof _.discrim) return;

            return Object.keys(types).reduce((result, key) => {
                function constructor() {
                    var instance;

                    if (this instanceof constructor) {
                        this.values = Array.prototype.slice.call(arguments);
                    } else {
                        instance = new constructor;
                        constructor.apply(instance, arguments);
                        return instance;
                    }
                };


                result[key] = constructor;
                result[key].prototype = new _.discrim;

                return result;
            }, {});
        },

        match: (input, ...args) => {
            var takeNextAction = false,
                pairs = args.reduce(function(prev, curr, i) {
                    if (i % 2) {
                        prev[prev.length - 1].push(curr);
                    } else {
                        prev.push([curr]);
                    }

                    return prev;
                }, []),
                actions = pairs.filter((pair) => {
                    var [pattern, action] = pair,
                        result = true,
                        reduceFn = (result, k, i) => {
                            var key = typeof k === 'string' ? k : i,
                                patternItem = pattern[key],
                                inputItem = input[key];

                            if (patternItem instanceof Function) {
                                if (!patternItem(inputItem)) {
                                    result = false;
                                }
                            } else if (patternItem !== _ && patternItem !== inputItem) {
                                result = false;
                            }

                            return result;
                        };

                    if (takeNextAction) {
                        result = action !== _;
                    } else if (pattern === _) {
                        result = true;
                    } else if (input instanceof _.discrim) {
                        result = pattern === _ || input instanceof pattern || pattern === input;
                    } else if (pattern instanceof Function) {
                        result = pattern(input);
                    } else if (pattern instanceof Array || pattern instanceof Object) {
                        result = Object.keys(pattern).reduce(reduceFn, result);
                    } else {
                        result = pattern === input;
                    }

                    if (result && action === _) {
                        takeNextAction = true;
                        result = false;
                    }

                    return result === true;
                }).map((pair) => pair[1]),
                action = actions && actions[0],
                result;

            if (input instanceof _.discrim) {
                result = action.apply(null, input.values);
            } else if (action instanceof Function) {
                result = action(input);
            } else {
                result = action;
            }

            return result;
        },

        autoPartial: autoPartial,

        ret: (val) => () => val,

        flip: autoPartial((f, a, b) => f(b, a)),

        compose: (...args) => (a) => args.reduce((acc, curr) => curr(acc), a),

        thread: (a, ...args) => args.reduce((acc, curr) => curr(acc), a),

        toArray: (seq) => {
            var result = [],
                next;

            seq = _.seq(seq);

            while(next = seq.next(), !next.done) {
                result.push(next.value);
            }

            return result;
        },

        split: (seq) => [seq.next(), seq],
        
        seq: function* (seq) {
            yield* seq;
        },

        head: (seq) => _.seq(seq).next().value,

        tail: function* (seq) {
            var i = 0;
            yield* (x for (x of seq) if (i++ > 0));
        },

        last: (seq) => {
            var next,
                prev;

            seq = _.seq(seq);

            while(next = seq.next(), !next.done) {
                prev = next.value;
            }

            return prev;
        },

        init: function* (seq) {
            var next,
                prev;

            seq = _.seq(seq);

            next = seq.next();
            prev = next.value;

            if (next.done) {
                yield* [];
            } else {
                while(next = seq.next(), !next.done) {
                    yield prev;
                    prev = next.value;
                }
            }
        },

        take: autoPartial(function* (count, seq) {
            var next;

            while (next = seq.next(), !next.done && count-- > 0) {
                yield next.value;
            }
        }),

        takeWhile: autoPartial(function* (fn, seq) {
            var next;

            while (next = seq.next(), !next.done && fn(next.value)) {
                yield next.value;
            }
        }),

        repeat: function* (a) {while (true) yield a},

        replicate: autoPartial((n, a) => _.take(n, _.repeat(a))),

        repeatedly: function* (f) {while (true) yield f()},

        // TODO:
        // reverse
        // drop
        // dropWhile

        map: autoPartial(function* (fn, seq) {yield* (fn(s) for (s of seq))}),

        foldl: autoPartial(function* (fn, init, seq) {
            var [head, tail] = _.split(_.seq(seq));
            
            if (head.done) {
                yield init;
            } else {
                yield* _.foldl(fn, fn(init, head.value), tail);
            }
        }),

        // TODO: Broken?
        foldr: autoPartial(function* (fn, init, seq) {
            var [head, tail] = _.split(_.seq(seq));
            
            console.log(init, head, tail);

            if (head.done) {
                yield init;
            } else {
                yield fn(head, _.foldr(fn, init, tail));
            }
        }),

        cons: autoPartial(function* (el, seq) {
            yield* [el];
            yield* seq;
        }),

        conj: autoPartial(function* (seq, el) {
            yield* seq;
            yield* [el];
        }),

        concat: autoPartial(function* (seqA, seqB) {
            yield* seqA;
            yield* seqB;
        }),

        reverse: function* (seq) {
            var [head, tail] = _.split(_.seq(seq));

            if (!head.done) {
                yield* _.conj(_.reverse(tail), head.value);
            }
        },

        zip: autoPartial(function* (a, b) {
            var nextA,
                nextB;

            a = _.seq(a);
            b = _.seq(b);

            while (nextA = a.next(), nextB = b.next(), !nextA.done && !nextB.done) {
                yield [nextA.value, nextB.value];
            }
        }),

        range: autoPartial(function* (from, to) {
            if (from <= to) {
                yield* _.rangeStep(from, to, 1);
            } else if (from >= to) {
                yield* _.rangeStep(from, to, -1);
            }
        }),

        rangeStep: autoPartial(function* (from, to, step) {
            while (from !== to + step) {
                yield from;
                from += step;
            }
        }),

        inf: Number.POSITIVE_INFINITY,
        ninf: Number.NEGATIVE_INFINITY,

        gt: autoPartial((a, b) => b > a),
        lt: autoPartial((a, b) => b < a),
        gte: autoPartial((a, b) => b >= a),
        lte: autoPartial((a, b) => b <= a),
        eq: autoPartial((a, b) => a === b),
        instanceOf: autoPartial((a, b) => b instanceof a),
        inRange: autoPartial((a, b, c) => c >= a && c <= b),

        add: autoPartial((a, b) => a + b),
        sub: autoPartial((a, b) => a - b),
        mul: autoPartial((a, b) => a * b),
        div: autoPartial((a, b) => a / b),
        sqr: (a) => a * a,

        asImmut: (obj, deep) => {
            Object.freeze(obj);

            if (deep !== false) {
                Object.getOwnPropertyNames(obj).forEach(function(prop) {
                    _.asImmut(obj[prop], deep);
                });
            }

            return obj;
        }
    };

    _ = this._ = this._ || proto;

    proto.option = proto.discrim({Some: ['value'], None: []});
})(_);
