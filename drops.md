<link rel="stylesheet" href="./assets/github-style.css"/>

<ul>
{% for ex in site.examples %}
  <li><a href="{{ ex.url }}">{{ ex.title }}</a></li>
{% endfor %}
</ul>
