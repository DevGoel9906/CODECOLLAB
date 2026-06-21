/**
 * services/stickerShader.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Interactive WebGL Metallic Sticker Shader Service
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // Global settings for uniform states
  const shaderState = {
    brightness: 1.0,
    contrast: 1.0,
    scale: 1.0,
    rotation: 0.0,
    chromaticAberration: 0.8,
    noise: 0.15,
    waveSpeed: 1.5,
    waveAmp: 0.04,
    time: 0.0,
    mouseX: 0.0,
    mouseY: 0.0,
    targetMouseX: 0.0,
    targetMouseY: 0.0
  };

  let gl = null;
  let program = null;
  let canvas = null;
  let texture = null;
  let animationId = null;

  // Vertex Shader source code
  const vsSource = `
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    varying vec4 v_position;
    uniform float u_time;
    uniform float u_waveSpeed;
    uniform float u_waveAmp;

    void main() {
      v_texCoord = a_texCoord;
      vec4 pos = a_position;
      
      // Vertical wave animation
      float wave = sin(pos.x * 3.14159 * 2.0 + u_time * u_waveSpeed) * u_waveAmp;
      pos.y += wave;
      
      v_position = pos;
      gl_Position = pos;
    }
  `;

  // Fragment Shader source code
  const fsSource = `
    precision highp float;
    varying vec2 v_texCoord;
    varying vec4 v_position;
    
    uniform sampler2D u_texture;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform float u_brightness;
    uniform float u_contrast;
    uniform float u_scale;
    uniform float u_rotation;
    uniform float u_chromaticAberration;
    uniform float u_noise;

    void main() {
      // 1. Pivot rotation and scale transformations around texture center
      vec2 st = v_texCoord - vec2(0.5);
      float c = cos(u_rotation);
      float s = sin(u_rotation);
      st = vec2(st.x * c - st.y * s, st.x * s + st.y * c) * u_scale;
      vec2 sampleCoord = st + vec2(0.5);

      // Check bounds
      if (sampleCoord.x < 0.0 || sampleCoord.x > 1.0 || sampleCoord.y < 0.0 || sampleCoord.y > 1.0) {
        discard;
      }

      // 2. Chromatic Aberration sampling
      // Displace red and blue channels using mouse coordinate inputs
      vec2 redOffset = vec2(u_chromaticAberration * 0.008) * (u_mouse + vec2(sin(u_time * 0.5) * 0.1, cos(u_time * 0.5) * 0.1));
      vec2 blueOffset = -redOffset;

      float r = texture2D(u_texture, sampleCoord + redOffset).r;
      float g = texture2D(u_texture, sampleCoord).g;
      float b = texture2D(u_texture, sampleCoord + blueOffset).b;
      float a = texture2D(u_texture, sampleCoord).a;

      if (a < 0.05) {
        discard; // Transparent pixel
      }

      vec4 baseColor = vec4(r, g, b, a);

      // 3. Normal mapping derivation (edge detection on height coordinates)
      float center = texture2D(u_texture, sampleCoord).r;
      float right = texture2D(u_texture, sampleCoord + vec2(0.008, 0.0)).r;
      float up = texture2D(u_texture, sampleCoord + vec2(0.0, 0.008)).r;
      
      vec2 gradient = vec2(right - center, up - center);
      vec3 normal = normalize(vec3(gradient * 6.0, 1.0));

      // 4. Dynamic reflections & Fresnel highlights
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 lightDir = normalize(vec3(u_mouse * 2.5, 1.2));
      vec3 halfDir = normalize(lightDir + viewDir);
      
      float spec = pow(max(dot(normal, halfDir), 0.0), 30.0);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);

      // Holographic/rainbow spectrum mapped by normal slope, mouse displacement, and time
      float hue = dot(normal.xy, vec2(1.2)) * 1.5 + u_time * 0.25 + length(u_mouse) * 0.4;
      vec3 rainbow = vec3(
        sin(hue * 2.0) * 0.5 + 0.5,
        sin(hue * 2.0 + 2.094) * 0.5 + 0.5,
        sin(hue * 2.0 + 4.188) * 0.5 + 0.5
      );

      // Blend metallic overlay into image colors
      vec3 metallicColor = baseColor.rgb * (1.0 - fresnel * 0.4) + (rainbow * fresnel * 0.8) + vec3(spec * 0.5);

      // 5. Brightness and Contrast adjustments
      vec3 finalColor = (metallicColor - vec3(0.5)) * u_contrast + vec3(0.5);
      finalColor = finalColor * u_brightness;

      // 6. Noise distortion / Brushed metallic texture overlay
      float noiseVal = fract(sin(dot(sampleCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
      finalColor = mix(finalColor, finalColor + vec3(noiseVal * 0.12 - 0.06), u_noise);

      gl_FragColor = vec4(finalColor, a);
    }
  `;

  // Shader compilation helper
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[Shader Engine] Compilation error: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Mobile check utility
  function isMobileDevice() {
    return (window.innerWidth < 768) || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  }

  // Setup standard CSS fallback image container
  function injectFallback(container, imageSrc) {
    container.innerHTML = '';
    
    // Create wrapper
    const fallbackWrapper = document.createElement('div');
    fallbackWrapper.className = 'shader-fallback-wrapper';
    fallbackWrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      perspective: 1000px;
    `;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.className = 'shader-fallback-img';
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      filter: drop-shadow(0 15px 35px rgba(0,0,0,0.4));
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 16px;
    `;

    // Metallic shimmer overlay element
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(79,195,179,0.2) 50%, rgba(255,255,255,0.15) 55%, transparent 70%);
      background-size: 200% 200%;
      mix-blend-mode: color-dodge;
      border-radius: 16px;
      animation: shimmerMove 4s infinite linear;
      opacity: 0.8;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmerMove {
        0% { background-position: -200% -200%; }
        100% { background-position: 200% 200%; }
      }
    `;
    document.head.appendChild(style);

    fallbackWrapper.appendChild(img);
    fallbackWrapper.appendChild(shimmer);
    container.appendChild(fallbackWrapper);

    // Mouse movement interactive 3D Tilt for fallback
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = -(y - rect.height / 2) / (rect.height / 2) * 12;
      const ry = (x - rect.width / 2) / (rect.width / 2) * 12;
      img.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
    });

    container.addEventListener('mouseleave', () => {
      img.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }

  // Initialize the WebGL sticker shader
  function init(containerId, imageSrc) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[Shader Engine] Target container #${containerId} not found.`);
      return;
    }

    // Force CSS Fallback on mobile/tablet to protect rendering performance
    if (isMobileDevice()) {
      console.info('[Shader Engine] Mobile device detected. Initializing performance fallback layout.');
      injectFallback(container, imageSrc);
      return;
    }

    // Clean container contents
    container.innerHTML = '';

    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 400;
    canvas.height = container.clientHeight || 400;
    canvas.style.cssText = 'width:100%; height:100%; display:block; cursor:pointer;';
    container.appendChild(canvas);

    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('[Shader Engine] WebGL not supported by this browser. Initializing fallback.');
      injectFallback(container, imageSrc);
      return;
    }

    // Compile shader programs
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    if (!vertexShader || !fragmentShader) {
      console.error('[Shader Engine] Failed to build shaders. Falling back.');
      injectFallback(container, imageSrc);
      return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[Shader Engine] Program link failure.');
      injectFallback(container, imageSrc);
      return;
    }

    gl.useProgram(program);

    // Setup coordinates grid
    const vertices = new Float32Array([
      -0.8,  0.8,   0.0, 0.0,
      -0.8, -0.8,   0.0, 1.0,
       0.8,  0.8,   1.0, 0.0,
       0.8, -0.8,   1.0, 1.0,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const FSIZE = vertices.BYTES_PER_ELEMENT;
    
    const a_position = gl.getAttribLocation(program, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_position);

    const a_texCoord = gl.getAttribLocation(program, 'a_texCoord');
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_texCoord);

    // Set texture settings
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Load sticker image
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      tick(); // Start render loops
    };
    image.src = imageSrc;

    // Listen to mouse coordinates within showcase card area
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Map to [-1.0, 1.0] coordinates space
      shaderState.targetMouseX = (x / rect.width) * 2.0 - 1.0;
      shaderState.targetMouseY = -((y / rect.height) * 2.0 - 1.0);
    });

    container.addEventListener('mouseleave', () => {
      shaderState.targetMouseX = 0.0;
      shaderState.targetMouseY = 0.0;
    });

    // Resize listener
    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!canvas || !gl) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  // Set uniform controls values
  function setUniform(name, val) {
    if (shaderState.hasOwnProperty(name)) {
      shaderState[name] = parseFloat(val);
    }
  }

  // Animation render loop
  function tick() {
    if (!gl || !program) return;

    // Smoothly interpolate mouse target coordinates (damping factor)
    shaderState.mouseX += (shaderState.targetMouseX - shaderState.mouseX) * 0.1;
    shaderState.mouseY += (shaderState.targetMouseY - shaderState.mouseY) * 0.1;

    shaderState.time += 0.015;

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Send uniforms to GPU
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), shaderState.time);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), shaderState.mouseX, shaderState.mouseY);
    gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), shaderState.brightness);
    gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), shaderState.contrast);
    gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), shaderState.scale);
    gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), shaderState.rotation);
    gl.uniform1f(gl.getUniformLocation(program, 'u_chromaticAberration'), shaderState.chromaticAberration);
    gl.uniform1f(gl.getUniformLocation(program, 'u_noise'), shaderState.noise);
    gl.uniform1f(gl.getUniformLocation(program, 'u_waveSpeed'), shaderState.waveSpeed);
    gl.uniform1f(gl.getUniformLocation(program, 'u_waveAmp'), shaderState.waveAmp);

    // Draw mesh
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationId = requestAnimationFrame(tick);
  }

  // Stop rendering loops
  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', onResize);
  }

  // Export service
  global.CodeCollabStickerShader = {
    init,
    setUniform,
    shaderState,
    stop
  };

})(window);
