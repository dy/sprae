/* Hallmark · pre-emit critique: P5 H4 E5 S5 R5 V5 */
// Incompressible 2D smoke for the background-shader study.
// Semi-Lagrangian advection + buoyancy + vorticity confinement + pressure projection.
// The solver is deliberately separate from the decorative trail engine: its RGBA16F
// state stores velocity.xy, density, and temperature.
;(() => {
  const RENDER = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_viewY;
uniform sampler2D u_trail;
uniform vec4 u_seed;
uniform vec3 u_c0, u_c1, u_c2, u_c3, u_cA;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise21(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
vec3 cmap(float d, float cyan) {
  d = clamp(d, 0., 1.);
  vec3 col = mix(u_c0, u_c1, smoothstep(.025, .36, d));
  col = mix(col, u_c2, smoothstep(.30, .68, d));
  col = mix(col, u_c3, smoothstep(.62, .96, d));
  col = mix(col, u_cA, clamp(cyan, 0., 1.) * smoothstep(.16, .7, d) * .52);
  return col;
}
vec3 grain(vec3 color) {
  float grit = hash(gl_FragCoord.xy * .73 + u_seed.xy) - .5;
  float fibre = noise21(gl_FragCoord.xy * vec2(.055, .34) + u_seed.zw) - .5;
  return color + (grit * .72 + fibre * .28) * .038;
}
float densityAt(vec2 uv) { return texture(u_trail, uv).b; }

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_res;
  // The viewport is a crop through a taller fluid domain: the emitters stay
  // below the composition while developed smoke enters the visible field.
  vec2 uv = screenUv - vec2(0., u_viewY);
  vec2 texel = 1. / vec2(textureSize(u_trail, 0));
  vec2 e2 = texel * 2.;
  vec2 e4 = texel * 4.;

  // Optical density is reconstructed only from simulated matter. Wider taps act
  // like a short line-of-sight integration through a shallow smoke volume.
  vec4 state = texture(u_trail, uv);
  float rho = state.b * .56;
  rho += (densityAt(uv + e2.xy) + densityAt(uv - e2.xy)
        + densityAt(uv + e2.yx) + densityAt(uv - e2.yx)) * .08;
  rho += (densityAt(uv + e4) + densityAt(uv - e4)
        + densityAt(uv + vec2(e4.x, -e4.y))
        + densityAt(uv + vec2(-e4.x, e4.y))) * .03;

  float dens = 1. - exp(-max(rho, 0.) * 1.28);
  dens = smoothstep(.006, .62, dens)
       * smoothstep(max(0., u_viewY - .06), u_viewY + .04, screenUv.y);

  // Density gradients provide real flank lighting; hot, newly emitted smoke is
  // the cyan accent. No procedural cloud is mixed into the silhouette.
  float left = densityAt(uv - vec2(e2.x, 0.));
  float right = densityAt(uv + vec2(e2.x, 0.));
  float below = densityAt(uv - vec2(0., e2.y));
  float above = densityAt(uv + vec2(0., e2.y));
  vec2 grad = vec2(right - left, above - below);
  float light = clamp(dot(grad, normalize(vec2(-.7, .72))) * 1.4, -.22, .22);
  float edge = smoothstep(.015, .18, length(grad)) * (1. - smoothstep(.52, .9, dens));
  float cyan = clamp(state.a * .26 + edge * .14, 0., 1.);

  vec3 color = cmap(dens, cyan);
  color *= 1. + light * smoothstep(.06, .72, dens);
  color *= 1. - .08 * smoothstep(.78, 1., dens);
  outColor = vec4(grain(color), 1.);
}`

  const ADVECT = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_size, u_mouse, u_prevMouse;
uniform vec4 u_seed;
uniform float u_dt, u_time, u_down, u_aspect;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec4 bilerpState(vec2 uv) {
  vec2 p = uv * u_size - .5;
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 a = (i + .5) / u_size;
  vec2 e = 1. / u_size;
  vec4 A = texture(u_state, a);
  vec4 B = texture(u_state, a + vec2(e.x, 0.));
  vec4 C = texture(u_state, a + vec2(0., e.y));
  vec4 D = texture(u_state, a + e);
  return mix(mix(A, B, f.x), mix(C, D, f.x), f.y);
}
float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-5), 0., 1.);
  return length(p - a - ab * h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  vec2 texel = 1. / u_size;
  vec2 velocity = texture(u_state, uv).xy;
  vec4 s = bilerpState(clamp(uv - velocity * u_dt * texel, texel * .5, 1. - texel * .5));

  // Semi-Lagrangian transport with distinct physical half-lives.
  s.xy *= exp(-u_dt * .16);
  s.z *= exp(-u_dt * .052);
  s.w *= exp(-u_dt * .32);

  // Temperature and suspended matter create buoyancy. A tiny lateral pressure
  // drift keeps the plume from locking to the simulation columns.
  s.y += u_dt * (48. * s.w + 12. * s.z);
  s.x += u_dt * (.16 + .11 * sin(u_time * .105 + u_seed.z));
  float sourceX = mix(.08, .22, hash(u_seed.xy * .17 + u_seed.zw * .31))
                + .018 * sin(u_time * .21 + u_seed.x);

  // Pointer movement writes momentum along its swept segment; holding also adds
  // smoke and heat. Momentum is capped in cell units per second.
  vec2 raw = (u_mouse - u_prevMouse) * u_size;
  if (u_mouse.x > -5. && length(raw) > 1e-4 && length(raw) < u_size.x * .42) {
    float distance = segmentDistance(gl_FragCoord.xy, u_prevMouse * u_size, u_mouse * u_size);
    float influence = exp(-distance * distance / 110.);
    vec2 pointerVelocity = raw / max(u_dt, 1e-3);
    float speed = length(pointerVelocity);
    if (speed > 46.) pointerVelocity *= 46. / speed;
    s.xy += pointerVelocity * influence * .34;
  }

  // One burner, with a narrow hot core inside a low wide fume bed. This is an
  // emitter boundary condition; every shape above it comes from the fluid solve.
  vec2 q = (uv - vec2(sourceX, .026)) * vec2(u_aspect, 1.);
  float core = exp(-(q.x * q.x / .00042 + q.y * q.y / .00013));
  float bed = exp(-(q.x * q.x / .0068 + q.y * q.y / .00030));
  float pulse = .62 + .38 * pow(.5 + .5 * sin(u_time * .86 + u_seed.w * 2.7 + q.x * 31.), 2.);
  float source = (core * .74 + bed * .22) * pulse;

  // A cooler, weaker burner gives the physical field enough breadth for a
  // background composition without faking haze in the render pass.
  float sourceX2 = mix(.74, .90, hash(u_seed.zw * .23 + u_seed.xy * .41));
  vec2 q2 = (uv - vec2(sourceX2, .022)) * vec2(u_aspect, 1.);
  float core2 = exp(-(q2.x * q2.x / .00055 + q2.y * q2.y / .00015));
  float bed2 = exp(-(q2.x * q2.x / .0085 + q2.y * q2.y / .00034));
  float pulse2 = .52 + .48 * pow(.5 + .5 * sin(u_time * .67 + u_seed.x * 1.9 + q2.x * 27.), 2.);
  float secondary = (core2 * .62 + bed2 * .18) * pulse2 * .58;

  vec2 mouseDelta = (uv - u_mouse) * vec2(u_aspect, 1.);
  float held = exp(-dot(mouseDelta, mouseDelta) / .0026) * u_down;
  float matter = source + secondary + held * .58;
  float heat = source + secondary * .62 + held * .8;
  s.z = min(2.2, s.z + matter * u_dt * 1.08);
  s.w = min(1.5, s.w + heat * u_dt * 2.35);
  s.y += matter * u_dt * 25.;
  s.x += u_dt * (source * (7. + 20. * sin(u_time * .84 + u_seed.y) + 7. * sin(q.x * 47. + u_time * 1.13))
       + secondary * (-5. + 15. * sin(u_time * .71 + u_seed.z + 1.8) + 5. * sin(q2.x * 41. - u_time * .93)));

  // Paired, slowly rising eddies restore the sub-grid instability that the
  // semi-Lagrangian step dissipates. They force velocity only; density remains
  // fully transported by the projected flow.
  float va = fract(u_time * .071 + u_seed.z * .013);
  float vb = fract(va + .5);
  vec2 ca = vec2(sourceX + .046 * sin(u_time * .37 + u_seed.x), .065 + va * .42);
  vec2 cb = vec2(sourceX + .052 * sin(u_time * .31 + u_seed.w + 2.4), .065 + vb * .42);
  vec2 ra = (uv - ca) * vec2(u_aspect, 1.);
  vec2 rb = (uv - cb) * vec2(u_aspect, 1.);
  float ea = sin(va * 3.14159265); ea *= ea;
  float eb = sin(vb * 3.14159265); eb *= eb;
  float wa = exp(-dot(ra, ra) / .0032) * ea;
  float wb = exp(-dot(rb, rb) / .0038) * eb;
  s.xy += vec2(-ra.y, ra.x) * (wa * 520. * u_dt);
  s.xy -= vec2(-rb.y, rb.x) * (wb * 460. * u_dt);
  vec2 rc = (uv - vec2(sourceX2 + .04 * sin(u_time * .29 + u_seed.y), .07 + vb * .36))
          * vec2(u_aspect, 1.);
  float wc = exp(-dot(rc, rc) / .0042) * eb;
  s.xy += vec2(-rc.y, rc.x) * (wc * 330. * u_dt);

  // Solid side/floor boundaries, open dissipating roof.
  float side = smoothstep(0., texel.x * 2.5, uv.x)
             * smoothstep(0., texel.x * 2.5, 1. - uv.x);
  float floor = smoothstep(0., texel.y * 2.5, uv.y);
  s.x *= side;
  s.y *= floor;
  float roof = smoothstep(.92, 1., uv.y);
  s.z *= 1. - roof * min(.9, u_dt * 1.7);
  s.w *= 1. - roof * min(.9, u_dt * 2.4);

  outColor = vec4(s.xy, max(s.zw, vec2(0.)));
}`

  const CURL = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * u_texel;
  vec2 L = texture(u_state, uv - vec2(u_texel.x, 0.)).xy;
  vec2 R = texture(u_state, uv + vec2(u_texel.x, 0.)).xy;
  vec2 B = texture(u_state, uv - vec2(0., u_texel.y)).xy;
  vec2 T = texture(u_state, uv + vec2(0., u_texel.y)).xy;
  float curl = .5 * (R.y - L.y - T.x + B.x);
  outColor = vec4(curl, 0., 0., 1.);
}`

  const VORTICITY = `#version 300 es
precision highp float;
uniform sampler2D u_state, u_curl;
uniform vec2 u_texel;
uniform float u_dt;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * u_texel;
  float L = abs(texture(u_curl, uv - vec2(u_texel.x, 0.)).r);
  float R = abs(texture(u_curl, uv + vec2(u_texel.x, 0.)).r);
  float B = abs(texture(u_curl, uv - vec2(0., u_texel.y)).r);
  float T = abs(texture(u_curl, uv + vec2(0., u_texel.y)).r);
  float C = texture(u_curl, uv).r;
  vec2 force = .5 * vec2(T - B, R - L);
  force /= length(force) + 1e-4;
  force *= C * 22.;
  force.y *= -1.;
  vec4 state = texture(u_state, uv);
  state.xy += force * u_dt;
  float speed = length(state.xy);
  if (speed > 58.) state.xy *= 58. / speed;
  outColor = state;
}`

  const DIVERGENCE = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * u_texel;
  vec2 C = texture(u_state, uv).xy;
  vec2 L = texture(u_state, uv - vec2(u_texel.x, 0.)).xy;
  vec2 R = texture(u_state, uv + vec2(u_texel.x, 0.)).xy;
  vec2 B = texture(u_state, uv - vec2(0., u_texel.y)).xy;
  vec2 T = texture(u_state, uv + vec2(0., u_texel.y)).xy;
  if (uv.x < u_texel.x) L.x = -C.x;
  if (uv.x > 1. - u_texel.x) R.x = -C.x;
  if (uv.y < u_texel.y) B.y = -C.y;
  if (uv.y > 1. - u_texel.y) T.y = C.y;
  float divergence = .5 * (R.x - L.x + T.y - B.y);
  outColor = vec4(divergence, 0., 0., 1.);
}`

  const PRESSURE = `#version 300 es
precision highp float;
uniform sampler2D u_pressure, u_divergence;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * u_texel;
  float L = texture(u_pressure, uv - vec2(u_texel.x, 0.)).r;
  float R = texture(u_pressure, uv + vec2(u_texel.x, 0.)).r;
  float B = texture(u_pressure, uv - vec2(0., u_texel.y)).r;
  float T = texture(u_pressure, uv + vec2(0., u_texel.y)).r;
  float divergence = texture(u_divergence, uv).r;
  outColor = vec4((L + R + B + T - divergence) * .25, 0., 0., 1.);
}`

  const PROJECT = `#version 300 es
precision highp float;
uniform sampler2D u_state, u_pressure;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * u_texel;
  float L = texture(u_pressure, uv - vec2(u_texel.x, 0.)).r;
  float R = texture(u_pressure, uv + vec2(u_texel.x, 0.)).r;
  float B = texture(u_pressure, uv - vec2(0., u_texel.y)).r;
  float T = texture(u_pressure, uv + vec2(0., u_texel.y)).r;
  vec4 state = texture(u_state, uv);
  state.xy -= .5 * vec2(R - L, T - B);
  float speed = length(state.xy);
  if (speed > 58.) state.xy *= 58. / speed;
  if (uv.x < u_texel.x * 1.5 || uv.x > 1. - u_texel.x * 1.5) state.x = 0.;
  if (uv.y < u_texel.y * 1.5) state.y = max(0., state.y);
  outColor = state;
}`

  function supported(gl) {
    return !!gl?.getExtension('EXT_color_buffer_float')
  }

  function create(gl, vertexSource, { pressureIterations = 12 } = {}) {
    if (!supported(gl)) return null

    const shaders = []
    const programs = []
    const stateFilter = gl.getExtension('OES_texture_float_linear') ? gl.LINEAR : gl.NEAREST
    const compile = (type, source) => {
      const shader = gl.createShader(type)
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'fluid shader')
      }
      return shader
    }
    const program = (fragment, uniforms) => {
      const p = gl.createProgram()
      programs.push(p)
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vertexSource))
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragment))
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) || 'fluid link')
      }
      const result = { p }
      for (const name of uniforms) result[name] = gl.getUniformLocation(p, name)
      return result
    }

    const advect = program(ADVECT, ['u_state', 'u_size', 'u_mouse', 'u_prevMouse', 'u_seed', 'u_dt', 'u_time', 'u_down', 'u_aspect'])
    const curl = program(CURL, ['u_state', 'u_texel'])
    const vorticity = program(VORTICITY, ['u_state', 'u_curl', 'u_texel', 'u_dt'])
    const divergence = program(DIVERGENCE, ['u_state', 'u_texel'])
    const pressure = program(PRESSURE, ['u_pressure', 'u_divergence', 'u_texel'])
    const project = program(PROJECT, ['u_state', 'u_pressure', 'u_texel'])

    let width = 0
    let height = 0
    let state = []
    let pressureField = []
    let curlField = null
    let divergenceField = null
    let stateFlip = 0

    const destroyTarget = target => {
      if (!target) return
      gl.deleteFramebuffer(target.fbo)
      gl.deleteTexture(target.tex)
    }
    const target = () => {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, stateFilter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, stateFilter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('fluid framebuffer incomplete')
      }
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return { tex, fbo }
    }
    const clearTarget = item => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, item.fbo)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    const bind = (unit, texture, location) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(location, unit)
    }
    const draw = (prog, output) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, output.fbo)
      gl.viewport(0, 0, width, height)
      gl.useProgram(prog.p)
    }

    function resize(viewWidth, viewHeight) {
      const aspect = Math.max(.35, Math.min(2.4, viewWidth / Math.max(1, viewHeight)))
      // Keep cells approximately square at every viewport ratio while capping the
      // long side. Portrait phones no longer pay for unused off-axis columns.
      const longSide = 320
      const nextWidth = aspect >= 1 ? longSide : Math.max(112, Math.round(longSide * aspect))
      const nextHeight = aspect >= 1 ? Math.max(134, Math.round(longSide / aspect)) : longSide
      if (nextWidth === width && nextHeight === height) return false

      state.forEach(destroyTarget)
      pressureField.forEach(destroyTarget)
      destroyTarget(curlField)
      destroyTarget(divergenceField)
      width = nextWidth
      height = nextHeight
      state = [target(), target()]
      pressureField = [target(), target()]
      curlField = target()
      divergenceField = target()
      stateFlip = 0
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return true
    }

    function step({ dt, time, mouse, previousMouse, down, seed }) {
      if (!width || !height) return
      dt = Math.max(1 / 240, Math.min(1 / 24, dt))
      const texelX = 1 / width
      const texelY = 1 / height

      // 1. Advect velocity, density, and temperature; apply forces and emitters.
      let next = 1 - stateFlip
      draw(advect, state[next])
      bind(0, state[stateFlip].tex, advect.u_state)
      gl.uniform2f(advect.u_size, width, height)
      gl.uniform2f(advect.u_mouse, mouse[0], mouse[1])
      gl.uniform2f(advect.u_prevMouse, previousMouse[0], previousMouse[1])
      gl.uniform4f(advect.u_seed, seed[0], seed[1], seed[2], seed[3])
      gl.uniform1f(advect.u_dt, dt)
      gl.uniform1f(advect.u_time, time)
      gl.uniform1f(advect.u_down, down)
      gl.uniform1f(advect.u_aspect, width / height)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      stateFlip = next

      // 2. Measure curl, then restore small rotational structures lost by advection.
      draw(curl, curlField)
      bind(0, state[stateFlip].tex, curl.u_state)
      gl.uniform2f(curl.u_texel, texelX, texelY)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      next = 1 - stateFlip
      draw(vorticity, state[next])
      bind(0, state[stateFlip].tex, vorticity.u_state)
      bind(1, curlField.tex, vorticity.u_curl)
      gl.uniform2f(vorticity.u_texel, texelX, texelY)
      gl.uniform1f(vorticity.u_dt, dt)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      stateFlip = next

      // 3. Helmholtz–Hodge projection: divergence → Jacobi pressure → subtract gradient.
      draw(divergence, divergenceField)
      bind(0, state[stateFlip].tex, divergence.u_state)
      gl.uniform2f(divergence.u_texel, texelX, texelY)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      clearTarget(pressureField[0])
      clearTarget(pressureField[1])
      let pressureFlip = 0
      for (let i = 0; i < pressureIterations; i++) {
        const pressureNext = 1 - pressureFlip
        draw(pressure, pressureField[pressureNext])
        bind(0, pressureField[pressureFlip].tex, pressure.u_pressure)
        bind(1, divergenceField.tex, pressure.u_divergence)
        gl.uniform2f(pressure.u_texel, texelX, texelY)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        pressureFlip = pressureNext
      }

      next = 1 - stateFlip
      draw(project, state[next])
      bind(0, state[stateFlip].tex, project.u_state)
      bind(1, pressureField[pressureFlip].tex, project.u_pressure)
      gl.uniform2f(project.u_texel, texelX, texelY)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      stateFlip = next
    }

    function reset() {
      state.forEach(clearTarget)
      pressureField.forEach(clearTarget)
      if (curlField) clearTarget(curlField)
      if (divergenceField) clearTarget(divergenceField)
      stateFlip = 0
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    function dispose() {
      state.forEach(destroyTarget)
      pressureField.forEach(destroyTarget)
      destroyTarget(curlField)
      destroyTarget(divergenceField)
      programs.forEach(p => gl.deleteProgram(p))
      shaders.forEach(s => gl.deleteShader(s))
    }

    return {
      resize,
      step,
      reset,
      dispose,
      get texture() { return state[stateFlip]?.tex || null },
      get size() { return [width, height] },
    }
  }

  window.SpraeSmokeFluid = { fragment: RENDER, viewOffsetY: .28, supported, create }
})()
