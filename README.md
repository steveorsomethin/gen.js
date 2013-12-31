Quick docs because I'm tired
====================================

### Getting Started ###

For now, cloning the repo and opening test/index.html in firefox nightly 28+ will suffice

### What is this thing? ###

I've been getting on with haskell and clojure recently. Thus, everything looks like a wonderful, concise nail for my new hammer. I've decided to port most of the basic tools that these languages supply to ES6 as an exercise that probably-maybe-won't ever turn into a real project.

### What can it do? ###

Pattern matching:
```javascript
    var fib = (n) => match(n,
                      0, 0,
                      1, 1,
                      _, () => fib(n - 1) + fib(n - 2))
```

Function composition:
```javascript
    var composed = compose(add(2), mul(5), sqr);
    
    console.log(composed(10)); // 3600
```

Discriminated unions:
```javascript
    var {Some, None} = discrim({Some: ['value'], None: []}),
        someResult = Some(5),
        noneResult = None();
        
    console.log(match(someResult,
                      Some, (value) => value,
                      None, () => 'Got none, oh well')); // 5
```

Lazy sequences:
```javascript
    var firstFiveFromInfinite = thread(range(0, inf), take(5), toArray),
        sumZeroToFive = thread(range(0, 5), foldl(add, 0), head);
    
    console.log(firstFiveFromInfinite); // [0, 1, 2, 3, 4]
    console.log(sumZeroToFive); // 15
```

Automatic partial application:
```javascript
    var add = autoPartial((a, b) => a + b),
        add1 = add(1),
        inRange = autoPartial((a, b, c) => c >= a && c <= b),
        betweenZeroAndFive = inRange(0, 5);
    
    console.log(add1(2)); // 3
    console.log(betweenZeroAndFive(3)); // true
    console.log(betweenZeroAndFive(10)); // false
    
```

And more. See test/testfuncs and test/tests.fjs.js for applied samples.

### This upsets me ###

Then it must have matured into usefulness!
