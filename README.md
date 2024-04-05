# Delta Map
An tool to set and query a map of elements that have a start and end index that connot occupy the same space in the map.

Imagine a 1D bitmap. 3 pixels white 5 pixels red and the remaining ones are white as well.
That can be achieved with the following code:

```
type Color = string;
const dm = new DeltaMap<color>('white');
dm.set(3, 'red', 8);
```

to retrieve a particular pixel color you can:
```
const col = dm.at(5);
```

Final scope + spec + roadmap are TBD, but right now:
- The 'end' argument is optional. If you have a element afterwards, it'll end right before it, if you don't, it'll go till infinity.
- set() will override (|| split || adjust) any existing values on the map.

