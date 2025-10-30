---
layout: default
title: Drops
redirect_from:
  - /drops.html
  - /examples.html
  - /drops
---

<ul>
{% for ex in site.examples %}
  <li><a href="{{ ex.url }}">{{ ex.title }}</a> – {{ ex.instrument }}</li>
{% endfor %}
</ul>
