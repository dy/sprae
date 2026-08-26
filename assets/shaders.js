// Production background: 7 · spray only.
// The complete shader gallery and all experimental modes live in
// design-variants/7-shaders.html. Press and hold on open paper to add matter.
(() => {
  const canvas = document.getElementById('wash')
  if (!canvas) return
  const fail = () => canvas.classList.add('is-fallback')
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false })
  if (!gl) return fail()

  const VERT = `#version 300 es
void main() {
  vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(v * 2. - 1., 0., 1.);
}`

  const UTILS = `
float thash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float tnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(thash(i), thash(i + vec2(1., 0.)), f.x),
             mix(thash(i + vec2(0., 1.)), thash(i + vec2(1.)), f.x), f.y);
}
float tfbm(vec2 p) {
  float sum = 0., amp = .52;
  mat2 turn = mat2(.80, -.60, .60, .80);
  for (int i = 0; i < 5; i++) {
    sum += amp * tnoise(p);
    p = turn * p * 2.03 + 17.17;
    amp *= .5;
  }
  return sum;
}
float tseed(float n) {
  return thash(u_seed.xy * .173 + u_seed.zw * .371 + vec2(n, n * 1.618));
}
vec2 foldSpray(vec2 p, float time) {
  float t = time * .28;
  vec2 warp = vec2(tfbm(p * .72 + u_seed.xy * .031 + vec2(t * .14, 2.)),
                   tfbm(p * .72 + u_seed.zw * .029 + vec2(-5., -t * .12))) - .5;
  return warp * .16;
}
`

  const FRAG_SPRAY = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform sampler2D u_trail;
uniform vec4 u_seed;
uniform vec3 u_c0, u_c1, u_c2, u_c3, u_cA;
out vec4 outColor;
${UTILS}

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float dither() { return fract(dot(gl_FragCoord.xy, sin(gl_FragCoord.yx))) - .5; }
vec3 grain(vec3 c) {
  float grit = hash(gl_FragCoord.xy * .73) - .5;
  float fibre = tnoise(gl_FragCoord.xy * vec2(.055, .34)) - .5;
  return c + (grit * .72 + fibre * .28) * .05;
}
vec2 ctr(vec2 frag) { return (frag - .5 * u_res) / min(u_res.x, u_res.y); }
float splume(vec2 w, vec2 c, vec2 ax, float along, float across) {
  vec2 rel = w - c;
  vec2 l = vec2(dot(rel, ax), dot(rel, vec2(-ax.y, ax.x)));
  return exp(-(l.x * l.x / (along * along) + l.y * l.y / (across * across)));
}
void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_res;
  vec2 p = ctr(frag);
  float t = u_time * .34;
  vec2 trailUV = uv + foldSpray(p, u_time) * min(u_res.x, u_res.y) / u_res;
  vec2 trailPx = 1. / vec2(textureSize(u_trail, 0));
  vec4 tr = texture(u_trail, trailUV);
  vec2 e4 = trailPx * 4.;
  float nL = texture(u_trail, trailUV - vec2(e4.x, 0.)).r;
  float nR = texture(u_trail, trailUV + vec2(e4.x, 0.)).r;
  float nB = texture(u_trail, trailUV - vec2(0., e4.y)).r;
  float nT = texture(u_trail, trailUV + vec2(0., e4.y)).r;
  vec2 e7 = trailPx * 9.;
  float diagonals = texture(u_trail, trailUV + e7).r
                  + texture(u_trail, trailUV - e7).r
                  + texture(u_trail, trailUV + vec2(e7.x, -e7.y)).r
                  + texture(u_trail, trailUV + vec2(-e7.x, e7.y)).r;
  vec2 e20 = trailPx * 20.;
  float farRing = texture(u_trail, trailUV + vec2(e20.x, 0.)).r
                + texture(u_trail, trailUV - vec2(e20.x, 0.)).r
                + texture(u_trail, trailUV + vec2(0., e20.y)).r
                + texture(u_trail, trailUV - vec2(0., e20.y)).r;
  float nearRing = nL + nR + nB + nT;
  float sprayCore = max(tr.r * .68 + nearRing * .08, 0.);
  float spraySoft = max(tr.r * .12 + nearRing * .07 + diagonals * .075 + farRing * .075, 0.);
  float sprayLight = clamp(.5 + (nL + nT - nR - nB) * .22, 0., 1.);
  vec2 wC = p + foldSpray(p + vec2(1.7, -.9), u_time) * 1.05;
  vec2 wI = p + foldSpray(p + vec2(-2.4, 1.5), u_time + 19.) * 1.12;
  vec2 span = u_res / min(u_res.x, u_res.y);
  vec2 split = .12 * vec2(cos(u_seed.w * 6.28), sin(u_seed.w * 6.28));
  float phaseC = t * .88 + u_seed.x * 6.28;
  float phaseI = -t * .72 + u_seed.z * 6.28;
  vec2 groupC = split + .18 * vec2(sin(phaseC), cos(phaseC));
  vec2 groupI = -split + .2 * vec2(cos(phaseI), sin(phaseI));

  float DC = 0., DI = 0.;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float r0 = tseed(100. + fi * 7.1);
    float r1 = tseed(101. + fi * 5.3);
    float r2 = tseed(102. + fi * 3.7);
    float r3 = tseed(103. + fi * 6.9);
    float isC = 1. - mod(fi, 2.);
    vec2 c = (vec2(r0, r1) - .5) * span * .88;
    c += mix(groupI, groupC, isC);
    if (i < 2) {
      float edge = floor(r2 * 4.);
      if (edge < 1.) c.x = -span.x * .54;
      else if (edge < 2.) c.x = span.x * .54;
      else if (edge < 3.) c.y = -span.y * .54;
      else c.y = span.y * .54;
    }
    float orbit = mix(.055, .145, r3);
    float phase = r2 * 6.28 + (1. - isC) * 1.7;
    c += orbit * vec2(
      sin(t * mix(.72, 1.26, r1) + phase),
      cos(t * mix(.58, 1.12, r0) + r3 * 6.28 + phase * .4)
    );
    float angle = tseed(104. + fi * 4.7) * 6.2831853
                + .3 * sin(t * .52 + fi * 1.7);
    vec2 ax = vec2(cos(angle), sin(angle));
    float along = mix(.3, .62, tseed(105. + fi * 2.9));
    float across = mix(.17, .36, tseed(106. + fi * 5.9));
    float amp = i < 2 ? mix(.82, 1.05, r3) : mix(.28, .62, tseed(107. + fi * 4.1));
    vec2 layerPoint = mix(wI, wC, isC);
    float plume = amp * splume(layerPoint, c, ax, along, across);
    DC += plume * isC;
    DI += plume * (1. - isC);
  }

  float nc  = tfbm(wC * 1.24 + u_seed.xy * .07 + vec2(t * .17, -t * .11));
  float nc2 = tfbm(wC * 3.05 + u_seed.zw * .06 - vec2(t * .08, t * .14));
  float ni  = tfbm(wI * 1.31 + u_seed.zw * .065 + vec2(-t * .13, t * .18));
  float ni2 = tfbm(wI * 2.84 + u_seed.yx * .055 + vec2(t * .11, t * .07));
  DC *= .5 + .68 * nc + .24 * nc2;
  DI *= .5 + .68 * ni + .24 * ni2;
  DC += spraySoft * .34;
  DI += sprayCore * .52;

  float cyanD = 1. - exp(-max(DC, 0.) * 1.42);
  float indigoD = 1. - exp(-max(DI, 0.) * 1.46);
  cyanD = smoothstep(.035, .88, cyanD + dither() * .01);
  indigoD = smoothstep(.035, .88, indigoD - dither() * .01);
  cyanD *= .84 + .28 * tfbm(wC * 2.08 + u_seed.zx * .05 + vec2(-t * .12, t * .09));
  indigoD *= .84 + .28 * tfbm(wI * 1.96 + u_seed.yw * .05 + vec2(t * .1, -t * .13));

  float drC = hash(floor(frag * .87) + u_seed.xy * 19.7);
  float drI = hash(floor(frag * .81) + u_seed.zw * 23.1);
  cyanD += smoothstep(.988, 1., drC) * .66 * cyanD * (1. - cyanD);
  indigoD += smoothstep(.989, 1., drI) * .62 * indigoD * (1. - indigoD);
  cyanD = clamp(cyanD, 0., 1.);
  indigoD = clamp(indigoD, 0., 1.);

  vec3 cyanPale = mix(u_c1, u_cA, .74);
  vec3 cyanDeep = mix(u_cA, u_c2, .42);
  vec3 indigoPale = mix(u_c2, u_c3, .55);
  vec3 indigoDeep = u_c3 * vec3(.72, .8, 1.);
  vec3 cyanPigment = mix(cyanPale, cyanDeep, smoothstep(.22, .88, cyanD));
  vec3 indigoPigment = mix(indigoPale, indigoDeep, smoothstep(.18, .86, indigoD));
  float cyanW = cyanD * (1. - .16 * indigoD) * (1. + tr.g * .22);
  float indigoW = indigoD;
  vec3 pigment = (cyanPigment * cyanW + indigoPigment * indigoW)
               / max(cyanW + indigoW, 1e-4);
  float cover = 1. - (1. - cyanD) * (1. - indigoD);
  vec3 color = mix(u_c0, pigment, smoothstep(.025, .96, cover) * .92);

  float sprayHalo = smoothstep(.003, .48, spraySoft);
  float sprayCenter = smoothstep(.2, .94, sprayCore);
  float billow = tfbm(p * 3.15 + u_seed.yz * .06 + vec2(-t * .05, t * .07));
  float detail = tfbm(p * 7.1 + u_seed.wy * .05 + vec2(t * .035, -t * .045));
  float volume = smoothstep(.28, .74, billow * .76 + detail * .24);
  float densityDepth = smoothstep(.28, .96, sprayCore);
  float depth = clamp(densityDepth * (.78 + .22 * volume)
                    + (sprayLight - .5) * .14 * densityDepth, 0., 1.);
  vec3 sprayEdgeColor = mix(u_c1, u_cA, .9);
  vec3 sprayBlue = mix(u_cA, u_c2, .58);
  vec3 sprayDeep = u_c3 * vec3(.72, .8, 1.);
  vec3 sprayCoreColor = mix(sprayBlue, sprayDeep, depth);
  vec3 sprayColor = mix(sprayEdgeColor, sprayCoreColor, sprayCenter);
  float interior = mix(.82, 1.08, volume);
  float sprayAlpha = sprayHalo * mix(.54, .9, sprayCenter)
                   * mix(1., interior, sprayCenter * .58);
  color = mix(color, sprayColor, clamp(sprayAlpha, 0., .94));
  outColor = vec4(grain(color), 1.);
}`

  const FRAG_TRAIL = `#version 300 es
precision highp float;
uniform sampler2D u_prev;
uniform vec2 u_tres;
uniform float u_time, u_dt, u_force, u_rad, u_aspect;
uniform vec2 u_m, u_pm;
uniform vec4 u_seed;
out vec4 outColor;
${UTILS}

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_tres;
  vec2 aspect = vec2(u_aspect, 1.);
  vec2 flow = vec2(.0015, -.012);
  vec2 a = uv - flow * u_dt;
  vec4 s = texture(u_prev, a);

  float diffuseRadius = mix(6., 2.6, clamp(u_force, 0., 1.));
  vec2 e = vec2(diffuseRadius, 0.) / u_tres;
  vec4 nb = (texture(u_prev, a + e.xy) + texture(u_prev, a - e.xy)
           + texture(u_prev, a + e.yx) + texture(u_prev, a - e.yx)) * .25;
  float diffusion = mix(8., 4.5, clamp(u_force, 0., 1.));
  s.rg = mix(s.rg, nb.rg, min(1., u_dt * diffusion));

  s.r = max(0., s.r * pow(.996, u_dt * 6.) - .00008);
  s.g = max(0., s.g * pow(.5, u_dt * 6.) - .002);

  vec2 m = u_m + foldSpray((u_m - .5) * aspect, u_time) / aspect;
  vec2 pm = u_pm + foldSpray((u_pm - .5) * aspect, u_time) / aspect;
  vec2 duv = uv - pm; duv -= round(duv);
  vec2 dmv = m - pm; dmv -= round(dmv);
  vec2 pa = duv * aspect, ba = dmv * aspect;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.);
  float d = length(pa - ba * h);
  float sp = exp(-d * d / (u_rad * u_rad)) * u_force
           * (.75 + .5 * hash(uv * 731. + fract(u_time) * 917.));

  float addition = sp * u_dt * 2.6;
  float density = min(s.r + addition * (1. - s.r), 1.);
  float fresh = min(s.g + sp * u_dt * 4.5, 1.);
  float dth = (hash(uv * 913. + fract(u_time * 7.) * 371.) - .5) / 255.;
  outColor = vec4(density + dth, fresh + dth, 128. / 255., 128. / 255.);
}`

  function compile(type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'shader')
    }
    return shader
  }

  function program(fragment, uniforms) {
    const result = gl.createProgram()
    gl.attachShader(result, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(result, compile(gl.FRAGMENT_SHADER, fragment))
    gl.linkProgram(result)
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(result) || 'link')
    }
    const locations = { p: result }
    for (const name of uniforms) locations[name] = gl.getUniformLocation(result, name)
    return locations
  }

  let spray, trail
  try {
    spray = program(FRAG_SPRAY, [
      'u_res', 'u_time', 'u_trail', 'u_seed',
      'u_c0', 'u_c1', 'u_c2', 'u_c3', 'u_cA'
    ])
    trail = program(FRAG_TRAIL, [
      'u_prev', 'u_tres', 'u_time', 'u_dt', 'u_force', 'u_rad',
      'u_aspect', 'u_m', 'u_pm', 'u_seed'
    ])
  } catch (error) {
    fail()
    console.warn('Sprae spray:', error.message)
    return
  }

  const paperMatch = getComputedStyle(document.documentElement).getPropertyValue('--paper')
    .trim().match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  const palette = {
    c0: paperMatch
      ? [parseInt(paperMatch[1], 16) / 255, parseInt(paperMatch[2], 16) / 255, parseInt(paperMatch[3], 16) / 255]
      : [0.8745, 0.8745, 0.8745],
    c1: [0.805, 0.835, 0.890],
    c2: [0.465, 0.590, 0.765],
    c3: [0.315, 0.455, 0.690],
    cA: [0.350, 0.705, 0.810],
  }

  const dpr = Math.min(devicePixelRatio || 1, 1.25)
  const resize = () => {
    canvas.width = Math.max(1, Math.round(innerWidth * dpr))
    canvas.height = Math.max(1, Math.round(innerHeight * dpr))
  }
  addEventListener('resize', resize)
  resize()

  const TRES = 512
  const trailTex = []
  const trailFbo = []
  let flip = 0
  for (let i = 0; i < 2; i++) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, TRES, TRES, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.clearColor(0, 0, 128 / 255, 128 / 255)
    gl.clear(gl.COLOR_BUFFER_BIT)
    trailTex.push(texture)
    trailFbo.push(framebuffer)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  let mx = -10, my = -10, tx = -10, ty = -10, pmx = -10, pmy = -10
  let down = 0, hold = 0
  const track = event => {
    const rect = canvas.getBoundingClientRect()
    tx = (event.clientX - rect.left) / rect.width
    ty = 1 - (event.clientY - rect.top) / rect.height
    if (mx < -5) { mx = tx; my = ty; pmx = tx; pmy = ty }
  }
  addEventListener('pointermove', track, { passive: true })
  addEventListener('pointerdown', event => {
    track(event)
    if (event.target.closest('a, button, pre, code, p, h1, h2, h3, small, output, input, textarea, select, summary, label, iframe, nav')) return
    down = 1
    document.body.classList.add('is-painting')
    getSelection()?.removeAllRanges()
  }, { passive: true })
  const lift = () => {
    down = 0
    document.body.classList.remove('is-painting')
  }
  addEventListener('pointerup', lift, { passive: true })
  addEventListener('pointercancel', lift, { passive: true })

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const timeOffset = Math.random() * 1000
  const seed = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100]
  let previous = performance.now()

  function frame(now) {
    requestAnimationFrame(frame)
    if (document.documentElement.classList.contains('wash-gradient')) {
      previous = now
      return
    }
    if (now - previous < 30) return
    const dt = Math.min(.05, (now - previous) / 1000)
    previous = now
    const time = timeOffset + (still ? 20 : now / 1000)

    pmx = mx; pmy = my
    mx += (tx - mx) * Math.min(1, dt * 10)
    my += (ty - my) * Math.min(1, dt * 10)
    hold = down ? hold + dt : 0
    const force = down && mx > -5 ? 1 : 0
    const radius = .038 + .024 * Math.min(1, hold / 2.2)

    gl.bindFramebuffer(gl.FRAMEBUFFER, trailFbo[flip])
    gl.viewport(0, 0, TRES, TRES)
    gl.useProgram(trail.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, trailTex[1 - flip])
    gl.uniform1i(trail.u_prev, 0)
    gl.uniform2f(trail.u_tres, TRES, TRES)
    gl.uniform1f(trail.u_time, time)
    gl.uniform1f(trail.u_dt, dt)
    gl.uniform1f(trail.u_force, force)
    gl.uniform1f(trail.u_rad, radius)
    gl.uniform1f(trail.u_aspect, innerWidth / innerHeight)
    gl.uniform2f(trail.u_m, mx, my)
    gl.uniform2f(trail.u_pm, pmx, pmy)
    gl.uniform4f(trail.u_seed, seed[0], seed[1], seed[2], seed[3])
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(spray.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, trailTex[flip])
    gl.uniform1i(spray.u_trail, 0)
    gl.uniform2f(spray.u_res, canvas.width, canvas.height)
    gl.uniform1f(spray.u_time, time)
    gl.uniform4f(spray.u_seed, seed[0], seed[1], seed[2], seed[3])
    gl.uniform3f(spray.u_c0, ...palette.c0)
    gl.uniform3f(spray.u_c1, ...palette.c1)
    gl.uniform3f(spray.u_c2, ...palette.c2)
    gl.uniform3f(spray.u_c3, ...palette.c3)
    gl.uniform3f(spray.u_cA, ...palette.cA)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    flip = 1 - flip
  }
  requestAnimationFrame(frame)
})()
