<link rel="stylesheet" href="./assets/style.css"/>

<!-- FIXME: we need to use gist-based drops, and keep examples folder for basic UI examples -->

<ul>
{% for ex in site.examples %}
  <li><a href="{{ ex.url }}">{{ ex.title }}</a></li>
{% endfor %}
</ul>
