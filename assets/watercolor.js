// Watercolor wash background — dependency-free WebGL.
// Pigment pools drift in paper grain; pointer paints a wet trail, press seeds a bloom.
(() => {
  const canvas = document.getElementById('wash')
  if (!canvas) return

  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const TRAIL_POINTS = 16

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `

  const fragmentSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_scroll;
    uniform vec4 u_pointer;
    uniform vec4 u_impulse;
    uniform vec3 u_paper;
    uniform float u_seed;
    uniform vec4 u_trail[${TRAIL_POINTS}];

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float seeded(float id) {
      return hash21(vec2(u_seed * 0.73 + id * 19.17, u_seed * 1.31 - id * 7.13));
    }

    vec2 seeded2(float id) {
      return vec2(seeded(id), seeded(id + 31.7)) * 2.0 - 1.0;
    }

    float noise21(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float sum = 0.0;
      float amp = 0.52;
      mat2 turn = mat2(0.80, -0.60, 0.60, 0.80);
      for (int i = 0; i < 5; i++) {
        sum += amp * noise21(p);
        p = turn * p * 2.03 + 17.17;
        amp *= 0.5;
      }
      return sum;
    }

    vec2 scenePoint(vec2 uv) {
      vec2 p = uv - 0.5;
      p.x *= u_resolution.x / max(u_resolution.y, 1.0);
      return p;
    }

    vec2 pointerPoint() {
      vec2 p = u_pointer.xy - 0.5;
      p.x *= u_resolution.x / max(u_resolution.y, 1.0);
      return p;
    }

    vec2 impulsePoint() {
      vec2 p = u_impulse.xy - 0.5;
      p.x *= u_resolution.x / max(u_resolution.y, 1.0);
      return p;
    }

    vec3 fieldColor(float density, float cyanAmount) {
      vec3 paper = u_paper;
      vec3 pearl = vec3(0.805, 0.835, 0.890);
      vec3 blue = vec3(0.465, 0.590, 0.765);
      vec3 cyan = vec3(0.350, 0.705, 0.810);
      vec3 cobalt = vec3(0.315, 0.455, 0.690);
      float d = clamp(density, 0.0, 1.0);
      float cyanMix = smoothstep(0.18, 0.88, clamp(cyanAmount, 0.0, 1.0)) * 0.72;
      vec3 active = mix(blue, cyan, cyanMix);
      vec3 color = mix(paper, pearl, smoothstep(0.03, 0.58, d));
      color = mix(color, active, smoothstep(0.30, 0.92, d) * 0.75);
      color = mix(color, cobalt, smoothstep(0.84, 1.0, d) * (0.24 - cyanMix * 0.09));
      return color;
    }

    vec3 paperGrain(vec3 color, float strength) {
      float grit = hash21(gl_FragCoord.xy * 0.73) - 0.5;
      float fibre = noise21(gl_FragCoord.xy * vec2(0.055, 0.34)) - 0.5;
      return color + (grit * 0.72 + fibre * 0.28) * strength;
    }

    float segmentDistance(vec2 p, vec2 a, vec2 b) {
      vec2 ab = b - a;
      float along = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.00001), 0.0, 1.0);
      return length(p - (a + ab * along));
    }

    vec2 trailField(vec2 p) {
      float field = 0.0;
      float cyan = 0.0;
      vec2 previousPoint = vec2(0.0);
      float previousLive = 0.0;
      float previousFade = 0.0;

      for (int i = 0; i < ${TRAIL_POINTS}; i++) {
        vec4 sample = u_trail[i];
        float rawAge = u_time - sample.z;
        float age = max(0.0, rawAge);
        float live = step(0.0, rawAge)
                   * (1.0 - step(7.5, age))
                   * step(0.001, abs(sample.w));
        float fade = live * (1.0 - smoothstep(0.15, 7.5, age)) * abs(sample.w);
        float width = 0.018 + age * 0.009;
        vec2 point = scenePoint(sample.xy);

        float spot = (1.0 - smoothstep(width, width * 3.0, length(p - point))) * fade;
        float connected = previousLive * live * step(0.0, sample.w);
        float line = (1.0 - smoothstep(width * 0.72, width * 2.55,
          segmentDistance(p, previousPoint, point))) * min(previousFade, fade) * connected;
        float local = clamp(max(spot, line) * 0.86, 0.0, 0.94);

        field = 1.0 - (1.0 - field) * (1.0 - local);
        cyan = max(cyan, local * (0.72 + hash21(sample.xy * 71.0 + sample.z) * 0.28));
        previousPoint = point;
        previousLive = live;
        previousFade = fade;
      }
      return vec2(clamp(field, 0.0, 1.0), clamp(cyan, 0.0, 1.0));
    }

    float washDistance(vec2 p, vec2 center, vec2 scale, float seed, vec2 drift) {
      vec2 q = (p - center) * scale;
      float stain = fbm(q * 1.22 + vec2(seed, -seed * 0.71) + drift);
      float tide = fbm(q * 2.35 + vec2(-seed * 0.36, seed) - drift * 0.37);
      return length(q) + (stain - 0.5) * 0.30 + (tide - 0.5) * 0.09;
    }

    void main() {
      vec2 p = scenePoint(v_uv);
      float t = u_time;
      float scrollDrift = u_scroll * 0.20;
      vec2 mouse = pointerPoint();
      vec2 dm = p - mouse;

      float phase1 = seeded(1.0) * 6.2831853;
      float phase2 = seeded(2.0) * 6.2831853;
      float phase3 = seeded(3.0) * 6.2831853;
      float speed1 = mix(0.075, 0.125, seeded(4.0));
      float speed2 = mix(0.065, 0.115, seeded(5.0));
      float speed3 = mix(0.055, 0.105, seeded(6.0));

      vec2 center1 = vec2(-0.58, 0.20) + seeded2(11.0) * vec2(0.12, 0.11);
      vec2 center2 = vec2(-0.06, -0.56) + seeded2(12.0) * vec2(0.13, 0.10);
      vec2 center3 = vec2(0.62, -0.36) + seeded2(13.0) * vec2(0.11, 0.12);
      center1 += vec2(sin(t * speed1 + phase1), cos(t * speed1 * 0.73 + phase1 * 0.81)) * vec2(0.080, 0.050);
      center2 += vec2(cos(t * speed2 + phase2), sin(t * speed2 * 0.79 + phase2 * 0.74)) * vec2(0.065, 0.070);
      center3 += vec2(sin(t * speed3 + phase3), cos(t * speed3 * 0.67 + phase3 * 0.88)) * vec2(0.055, 0.065);

      vec2 scale1 = vec2(1.28, 1.58) * (1.0 + seeded2(21.0) * 0.07);
      vec2 scale2 = vec2(1.38, 1.72) * (1.0 + seeded2(22.0) * 0.07);
      vec2 scale3 = vec2(1.58, 1.94) * (1.0 + seeded2(23.0) * 0.07);
      scale1 *= 1.0 + sin(t * 0.17 + phase1) * 0.035;
      scale2 *= 1.0 + cos(t * 0.15 + phase2) * 0.032;
      scale3 *= 1.0 + sin(t * 0.13 + phase3) * 0.028;

      vec2 flow1 = vec2(t * 0.032 + scrollDrift, sin(t * 0.071 + phase1) * 0.12);
      vec2 flow2 = vec2(-t * 0.027 + scrollDrift * 0.60, cos(t * 0.063 + phase2) * 0.11);
      vec2 flow3 = vec2(t * 0.023 - scrollDrift * 0.35, sin(t * 0.057 + phase3) * 0.10);
      float d1 = washDistance(p, center1, scale1, 1.7 + seeded(31.0) * 8.0, flow1);
      float d2 = washDistance(p, center2, scale2, 6.4 + seeded(32.0) * 8.0, flow2);
      float d3 = washDistance(p, center3, scale3, 11.2 + seeded(33.0) * 8.0, flow3);

      float w1 = 1.0 - smoothstep(0.38, 0.78, d1);
      float w2 = 1.0 - smoothstep(0.36, 0.74, d2);
      float w3 = 1.0 - smoothstep(0.34, 0.68, d3);
      float pigment = w1 * 0.84 + w2 * 0.64 + w3 * 0.24;

      float wetEdge = exp(-abs(d1 - 0.62) * 24.0) * 0.13
                    + exp(-abs(d2 - 0.59) * 25.0) * 0.10
                    + exp(-abs(d3 - 0.54) * 27.0) * 0.05;
      vec2 grainDrift = seeded2(41.0) * 5.0 + vec2(t * 0.018, -t * 0.014);
      float granulation = fbm(p * 3.9 + vec2(2.1, -4.8) + grainDrift);
      pigment *= 0.72 + granulation * 0.32;
      pigment += wetEdge;

      float age = max(0.0, u_time - u_impulse.z);
      vec2 clickDelta = p - impulsePoint();
      float radius = 0.025 + age * 0.045;
      float ripple = exp(-abs(length(clickDelta) - radius) * 34.0)
                   * exp(-age * 0.34) * u_impulse.w;
      float bloom = exp(-dot(clickDelta, clickDelta) / (0.018 + age * 0.018))
                  * exp(-age * 0.24) * u_impulse.w;
      float held = exp(-dot(dm, dm) * 7.0) * u_pointer.w;
      pigment += bloom * 0.22 + ripple * 0.17 + held * 0.10;

      float density = smoothstep(0.06, 0.94, pigment);
      vec2 trail = trailField(scenePoint(v_uv));
      density = clamp(density + trail.x * 0.32, 0.0, 1.0);
      float cyanZone = clamp(w1 * 0.82 + granulation * 0.20, 0.0, 1.0);
      vec3 color = fieldColor(density, max(cyanZone, trail.y));
      color = mix(color, vec3(0.40, 0.76, 0.83), trail.x * 0.18);
      color = mix(color, vec3(0.48, 0.57, 0.72), wetEdge * 0.24 + ripple * 0.06);
      color = paperGrain(color, 0.050);
      gl_FragColor = vec4(color, 1.0);
    }
  `

  const fail = () => canvas.classList.add('is-fallback')

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  })

  if (!gl) return fail()

  const compile = (type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(info || 'Shader compilation failed')
    }
    return shader
  }

  let program
  try {
    program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
  } catch (error) {
    fail()
    console.warn('Sprae watercolor:', error.message)
    return
  }

  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const uniforms = Object.fromEntries(
    ['u_resolution', 'u_time', 'u_scroll', 'u_pointer', 'u_impulse', 'u_paper', 'u_seed'].map(name => [name, gl.getUniformLocation(program, name)])
  )
  // the hero's paper white is a design token: --paper in index.html's :root
  const paperMatch = getComputedStyle(document.documentElement).getPropertyValue('--paper')
    .trim().match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  const paperRgb = paperMatch
    ? [parseInt(paperMatch[1], 16) / 255, parseInt(paperMatch[2], 16) / 255, parseInt(paperMatch[3], 16) / 255]
    : [0.8745, 0.8745, 0.8745]   // #dfdfdf
  gl.uniform3f(uniforms.u_paper, ...paperRgb)
  const seedBits = new Uint32Array(1)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(seedBits)
  else seedBits[0] = Math.floor(Math.random() * 0xffffffff)
  gl.uniform1f(uniforms.u_seed, seedBits[0] / 4294967295 * 97)
  uniforms.u_trail = gl.getUniformLocation(program, 'u_trail[0]')
  const trailData = new Float32Array(TRAIL_POINTS * 4)

  let size = [0, 0]
  const resize = () => {
    const quality = innerWidth < 700 ? 0.82 : 0.92
    const dpr = Math.min(devicePixelRatio || 1, 1.25)
    const width = Math.max(1, Math.round(innerWidth * dpr * quality))
    const height = Math.max(1, Math.round(innerHeight * dpr * quality))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      size = [width, height]
      gl.viewport(0, 0, width, height)
    }
  }

  const pointer = { x: 0.2, y: 0.72, tx: 0.2, ty: 0.72, energy: 0, down: 0 }
  const impulse = { x: 0.2, y: 0.72, time: -100, strength: 0 }
  const trail = []
  let lastTrailInput = null
  let trailRestart = true
  let pointerSeen = false
  let trailActiveUntil = 0
  let paintingPress = false
  let scroll = 0
  let simTime = 0
  let previous = performance.now()
  let lastDraw = 0
  let dirty = true
  let paused = reduceQuery.matches

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const appendTrailPoint = (x, y, strength, start, vx = 0, vy = 0) => {
    trail.push({ x, y, birth: simTime, strength, start, vx, vy })
    if (trail.length > TRAIL_POINTS) trail.shift()
    dirty = true
  }

  const sampleTrail = (x, y, force = false) => {
    const now = performance.now()
    if (!lastTrailInput) {
      appendTrailPoint(x, y, pointer.down ? 1 : 0.68, true)
      lastTrailInput = { x, y, time: now }
      trailRestart = false
      return
    }

    const dx = x - lastTrailInput.x
    const dy = y - lastTrailInput.y
    const distance = Math.hypot(dx, dy)
    const elapsedMs = now - lastTrailInput.time
    const newStroke = trailRestart || elapsedMs > 700 || distance > 0.34
    if (newStroke) {
      appendTrailPoint(x, y, pointer.down ? 1 : 0.68, true)
      lastTrailInput = { x, y, time: now }
      trailRestart = false
      return
    }
    if (!force && distance < 0.012 && elapsedMs < 45) return

    const elapsed = Math.max(0.016, elapsedMs / 1000)
    const vx = clamp(dx / elapsed, -1.8, 1.8) * 0.024
    const vy = clamp(dy / elapsed, -1.8, 1.8) * 0.024
    const steps = Math.min(3, Math.max(1, Math.ceil(distance / 0.055)))
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps
      appendTrailPoint(
        lastTrailInput.x + dx * progress,
        lastTrailInput.y + dy * progress,
        pointer.down ? 1 : 0.68,
        false,
        vx,
        vy
      )
    }
    lastTrailInput = { x, y, time: now }
    trailRestart = false
  }

  const advectTrail = dt => {
    for (const point of trail) {
      const flowX = Math.sin(point.y * 8 + simTime * 0.18) * 0.006
      const flowY = 0.003 + Math.cos(point.x * 7 - simTime * 0.16) * 0.004
      const blend = 1 - Math.exp(-dt * 0.45)
      point.vx += (flowX - point.vx) * blend
      point.vy += (flowY - point.vy) * blend
      point.x += point.vx * dt
      point.y += point.vy * dt
    }
    while (trail.length && simTime - trail[0].birth > 7.6) trail.shift()
  }

  const updatePointer = (event, forceTrail = false) => {
    const x = Math.min(1, Math.max(0, event.clientX / innerWidth))
    const y = Math.min(1, Math.max(0, 1 - event.clientY / innerHeight))
    if (!pointerSeen) {
      pointer.x = pointer.tx = x
      pointer.y = pointer.ty = y
      pointerSeen = true
      trailRestart = true
      lastTrailInput = null
    }
    const speed = Math.hypot(x - pointer.tx, y - pointer.ty)
    pointer.tx = x
    pointer.ty = y
    pointer.energy = Math.min(1, pointer.energy + 0.08 + speed * 7.5)
    trailActiveUntil = performance.now() + 320
    if (forceTrail) sampleTrail(pointer.x, pointer.y, true)
    dirty = true
  }

  addEventListener('pointermove', updatePointer, { passive: true })
  addEventListener('pointerdown', event => {
    paintingPress = !event.target.closest('a, button, pre, code, p, h1, h2, h3, small, output, input, textarea')
    if (paintingPress) {
      document.body.classList.add('is-painting')
      getSelection()?.removeAllRanges()
    }
    pointer.down = paintingPress ? 1 : 0
    updatePointer(event, paintingPress)
    if (paintingPress) {
      pointer.energy = 1
      impulse.x = pointer.tx
      impulse.y = pointer.ty
      impulse.time = simTime
      impulse.strength = 1
    }
    dirty = true
  }, { passive: true })
  addEventListener('pointerup', () => {
    document.body.classList.remove('is-painting')
    if (paintingPress) getSelection()?.removeAllRanges()
    paintingPress = false
    pointer.down = 0
    dirty = true
  }, { passive: true })
  addEventListener('pointercancel', () => {
    document.body.classList.remove('is-painting')
    paintingPress = false
    pointer.down = 0
    pointerSeen = false
    trailRestart = true
    lastTrailInput = null
    dirty = true
  }, { passive: true })
  addEventListener('pointerout', event => {
    if (!event.relatedTarget) {
      document.body.classList.remove('is-painting')
      paintingPress = false
      pointer.down = 0
      pointerSeen = false
      trailRestart = true
      lastTrailInput = null
    }
  }, { passive: true })
  addEventListener('scroll', () => {
    const range = Math.max(1, document.documentElement.scrollHeight - innerHeight)
    scroll = scrollY / range
    dirty = true
  }, { passive: true })
  addEventListener('resize', () => { resize(); dirty = true }, { passive: true })

  reduceQuery.addEventListener?.('change', event => {
    paused = event.matches
    dirty = true
  })

  const draw = () => {
    resize()
    gl.uniform2f(uniforms.u_resolution, size[0], size[1])
    gl.uniform1f(uniforms.u_time, simTime)
    gl.uniform1f(uniforms.u_scroll, scroll)
    gl.uniform4f(uniforms.u_pointer, pointer.x, pointer.y, pointer.energy, pointer.down)
    gl.uniform4f(uniforms.u_impulse, impulse.x, impulse.y, impulse.time, impulse.strength)
    trailData.fill(0)
    trail.forEach((point, index) => {
      const offset = index * 4
      trailData[offset] = point.x
      trailData[offset + 1] = point.y
      trailData[offset + 2] = point.birth
      trailData[offset + 3] = point.strength * (point.start ? -1 : 1)
    })
    gl.uniform4fv(uniforms.u_trail, trailData)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const frame = now => {
    const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000))
    previous = now
    if (!paused && !document.hidden) {
      simTime += dt
      advectTrail(dt)
    }

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 7.5)
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 7.5)
    if (pointerSeen && now < trailActiveUntil) sampleTrail(pointer.x, pointer.y)
    pointer.energy *= Math.pow(0.12, dt)
    impulse.strength *= Math.pow(0.88, dt)

    const active = !paused || pointer.energy > 0.008 || pointer.down || dirty
    if (active && now - lastDraw >= 30) {
      draw()
      dirty = false
      lastDraw = now
    }
    requestAnimationFrame(frame)
  }

  resize()
  draw()
  requestAnimationFrame(frame)
})()
