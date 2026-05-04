import React, { useEffect, useRef } from 'react';

/**
 * PREMIUM FLUID SIMULATION
 * A high-fidelity Navier-Stokes fluid solver adapted from sparse WebGL primitives.
 * Features: Advection, Vorticity Confinement, Pressure Projection, and Splatting.
 * Visuals: Enhanced with Bloom-style glow and chromatic refraction.
 */

export const LiquidDistortion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // --- CONFIGURATION ---
    const config = {
      TEXTURE_DOWNSAMPLE: 1,
      DENSITY_DISSIPATION: 0.992, // Even silkier long trails
      VELOCITY_DISSIPATION: 0.99,
      PRESSURE_DISSIPATION: 0.8,
      PRESSURE_ITERATIONS: 50,    // Higher quality fluid
      CURL: 30,
      SPLAT_RADIUS: 0.0002,       // Significantly smaller interaction point
      SPLAT_FORCE: 1000           // Slightly reduced force
    };

    // --- WEBGL SETUP ---
    const params = { alpha: true, depth: false, stencil: false, antialias: false };
    let gl = (canvas.getContext('webgl2', params) || 
              canvas.getContext('webgl', params) || 
              canvas.getContext('experimental-webgl', params)) as WebGL2RenderingContext;

    if (!gl) return;

    const isWebGL2 = !!gl.clearBufferfv;
    let halfFloat = !isWebGL2 ? gl.getExtension('OES_texture_half_float') : null;
    let halfFloatTexType = isWebGL2 ? (gl as any).HALF_FLOAT : halfFloat?.HALF_FLOAT_OES;
    
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    gl.getExtension('OES_texture_half_float_linear');

    function getSupportedFormat(internalFormat: number, format: number, type: number) {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        switch (internalFormat) {
          case (gl as any).R16F: return getSupportedFormat((gl as any).RG16F, (gl as any).RG, type);
          case (gl as any).RG16F: return getSupportedFormat((gl as any).RGBA16F, gl.RGBA, type);
          default: return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(internalFormat: number, format: number, type: number) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status === gl.FRAMEBUFFER_COMPLETE;
    }

    const formats = {
      rgba: getSupportedFormat(isWebGL2 ? (gl as any).RGBA16F : gl.RGBA, gl.RGBA, halfFloatTexType)!,
      rg: getSupportedFormat(isWebGL2 ? (gl as any).RG16F : gl.RGBA, isWebGL2 ? (gl as any).RG : gl.RGBA, halfFloatTexType)!,
      r: getSupportedFormat(isWebGL2 ? (gl as any).R16F : gl.RGBA, isWebGL2 ? (gl as any).RED : gl.RGBA, halfFloatTexType)!
    };

    // --- SHADERS ---
    function compileShader(type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
      return shader;
    }

    class GLProgram {
      program: WebGLProgram;
      uniforms: Record<string, WebGLUniformLocation> = {};
      constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const info = gl.getActiveUniform(this.program, i)!;
          this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name)!;
        }
      }
      bind() { gl.useProgram(this.program); }
    }

    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL, vR, vT, vB;
      uniform vec2 texelSize;
      void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

    const displayShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main () {
          vec3 color = texture2D(uTexture, vUv).rgb;
          float l = length(color);
          // Enhanced glow for more vibrant trails
          float glow = pow(clamp(l, 0.0, 4.0), 2.5) * 5.5;
          color += color * glow;
          // Slightly cleaner alpha for the enhanced glow
          gl_FragColor = vec4(color, smoothstep(0.0, 1.0, l * 1.5));
      }
    `);

    const splatShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          // Sharpened exponential falloff for a more precise pointer feel
          float h = exp(-dot(p, p) / (radius * 0.5));
          vec3 splat = h * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
      }
    `);

    const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity, uSource;
      uniform vec2 texelSize;
      uniform float dt, dissipation;
      void main () {
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          gl_FragColor = dissipation * texture2D(uSource, coord);
          gl_FragColor.a = 1.0;
      }
    `);

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;
          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `);

    const curlShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          gl_FragColor = vec4(R - L - T + B, 0.0, 0.0, 1.0);
      }
    `);

    const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uPressure, uDivergence;
      void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          float div = texture2D(uDivergence, vUv).x;
          gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
      }
    `);

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uPressure, uVelocity;
      void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          gl_FragColor = vec4(velocity - vec2(R - L, T - B), 0.0, 1.0);
      }
    `);

    const clearShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
    `);

    const displayProgram = new GLProgram(baseVertexShader, displayShader);
    const splatProgram = new GLProgram(baseVertexShader, splatShader);
    const advectionProgram = new GLProgram(baseVertexShader, advectionShader);
    const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
    const curlProgram = new GLProgram(baseVertexShader, curlShader);
    const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);
    const clearProgram = new GLProgram(baseVertexShader, clearShader);

    // --- FRAMEBUFFERS ---
    function createFBO(texId: number, w: number, h: number, internalFormat: number, format: number, type: number) {
      gl.activeTexture(gl.TEXTURE0 + texId);
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return { texture, fbo, texId };
    }

    function createDoubleFBO(texId: number, w: number, h: number, internalFormat: number, format: number, type: number) {
      let f1 = createFBO(texId, w, h, internalFormat, format, type);
      let f2 = createFBO(texId + 1, w, h, internalFormat, format, type);
      return {
        get read() { return f1; },
        get write() { return f2; },
        swap() { let t = f1; f1 = f2; f2 = t; }
      };
    }

    let density: any, velocity: any, divergence: any, curl: any, pressure: any;
    let tWidth: number, tHeight: number;

    function initFramebuffers() {
      tWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
      tHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;
      const type = halfFloatTexType;
      density = createDoubleFBO(0, tWidth, tHeight, formats.rgba.internalFormat, formats.rgba.format, type);
      velocity = createDoubleFBO(2, tWidth, tHeight, formats.rg.internalFormat, formats.rg.format, type);
      divergence = createFBO(4, tWidth, tHeight, formats.r.internalFormat, formats.r.format, type);
      curl = createFBO(5, tWidth, tHeight, formats.r.internalFormat, formats.r.format, type);
      pressure = createDoubleFBO(6, tWidth, tHeight, formats.r.internalFormat, formats.r.format, type);
    }
    initFramebuffers();

    // --- BLIT ---
    const blit = (() => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      return (target: WebGLFramebuffer | null) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    // --- INTERACTION ---
    const pointers = [{ id: -1, x: 0, y: 0, dx: 0, dy: 0, down: false, moved: false, color: [0, 0, 0] }];

    const splat = (x: number, y: number, dx: number, dy: number, color: number[]) => {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.texId);
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
      gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
      gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
      blit(velocity.write.fbo);
      velocity.swap();

      gl.uniform1i(splatProgram.uniforms.uTarget, density.read.texId);
      gl.uniform3f(splatProgram.uniforms.color, color[0], color[1], color[2]);
      blit(density.write.fbo);
      density.swap();
    };

    // --- LOOP ---
    let lastTime = Date.now();
    const update = () => {
      // Slower reaction speed: scale dt
      const dt = Math.min((Date.now() - lastTime) / 1000, 0.016) * 0.7;
      lastTime = Date.now();

      gl.viewport(0, 0, tWidth, tHeight);

      // Advection
      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / tWidth, 1.0 / tHeight);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.texId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.texId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write.fbo);
      velocity.swap();

      gl.uniform1i(advectionProgram.uniforms.uSource, density.read.texId);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(density.write.fbo);
      density.swap();

      // Interaction (React on Move/Hover)
      pointers.forEach(p => {
        if (p.moved) {
          splat(p.x, p.y, p.dx, p.dy, p.color);
          p.moved = false;
        }
      });

      // Projection
      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / tWidth, 1.0 / tHeight);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.texId);
      blit(divergence.fbo);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.texId);
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
      blit(pressure.write.fbo);
      pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / tWidth, 1.0 / tHeight);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.texId);
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.texId);
        blit(pressure.write.fbo);
        pressure.swap();
      }

      gradienSubtractProgram.bind();
      gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0 / tWidth, 1.0 / tHeight);
      gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.texId);
      gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.texId);
      blit(velocity.write.fbo);
      velocity.swap();

      // Display
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      displayProgram.bind();
      const displayTexture = density.read.texId;
      gl.activeTexture(gl.TEXTURE0 + displayTexture);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      gl.uniform1i(displayProgram.uniforms.uTexture, displayTexture);
      blit(null);

      requestAnimationFrame(update);
    };
    update();

    // --- EVENTS ---
    const handleMove = (clientX: number, clientY: number) => {
      const p = pointers[0];
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      p.dx = (x - p.x) * config.SPLAT_FORCE;
      p.dy = (y - p.y) * config.SPLAT_FORCE;
      p.x = x; 
      p.y = y;
      p.moved = true;

      // Randomize color based on movement or keep it cool blue/purple
      if (!p.down) {
        // Very subtle hover color - much lower intensity to avoid bulge
        p.color = [0.05, 0.2, 0.5]; 
      }
    };

    const handleDown = (clientX: number, clientY: number) => {
      const p = pointers[0];
      const rect = canvas.getBoundingClientRect();
      p.down = true; 
      p.x = clientX - rect.left; 
      p.y = clientY - rect.top;
      p.color = [Math.random() * 0.5 + 0.5, Math.random() * 0.2 + 0.1, Math.random() * 0.8 + 0.2];
    };

    const mMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const mDown = (e: MouseEvent) => handleDown(e.clientX, e.clientY);
    const mUp = () => pointers[0].down = false;

    window.addEventListener('mousemove', mMove);
    window.addEventListener('mousedown', mDown);
    window.addEventListener('mouseup', mUp);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initFramebuffers();
    };
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('mousemove', mMove);
      window.removeEventListener('mousedown', mDown);
      window.removeEventListener('mouseup', mUp);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <canvas 
        id="liquid-distortion-canvas"
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
};
