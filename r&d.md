## name

* rasa
* dew
* water
* humidify
* sprinkle
* va
* soma
* ley
* ros
* dewdrops
* mtn-dew
* pores
* drips
* straw
* spores
* spor
  + spores
  + russian
    - spor
  + sport
* spore
* sporae
  + scottish twist
  + sounds russian-ish too
  - a bit unusual from API perspective...
  + similar to algae
  + dots associate with colon prefix
* spour
* sprae?
  + reference to sporae and similar assoication
  + simpler word
  + better assoc with hydration


## :attr, :data, :id, :class, :style, :on, :aria - do we enforce JS object or support unscoped expression? -> Use JS convention, too many use-cases.

1. JS object
+ JS object can directly set value as `:props="obj"`
- JS object is a bit verbose `:props="{a:1, b:2}"`, `:on="{click(e){}, touch(e){}}"`
  + It's very explicitly JS, no confusion must be introduced
- It makes HTML look a bit more noisy
+ It is more familiar
+ JS syntax saves redundant questions and an item from docs

2. Custom expressions
+ We anyways introduce custom-ish expression in `:each="item in items"`
  - Vue introduces simple-ish parsing for that
+ Custom expressions are shorter: `:attr="a:1, b:2, c:3"`
- Custom expressions are confusing for style: `:style="a:1, b:2, c:3"` - very similar to direct style string