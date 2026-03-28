"use client";

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;

const float Pi = 3.14159;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv.x *= resolution.x / resolution.y;
  vec2 p = 1.9 * uv;
  for(int i = 1; i < 7; i++) {
    vec2 newp = p;
    newp.x += 0.6 / float(i) * cos(float(i) * p.y + (time * 20.0) / 10.0 + 0.3 * float(i)) + 400.0 / 20.0;
    newp.y += 0.6 / float(i) * cos(float(i) * p.x + (time * 20.0) / 10.0 + 0.3 * float(i + 10)) - 400.0 / 20.0 + 15.0;
    p = newp;
  }

  vec3 raw = vec3(
    0.5 * sin(3.0 * p.x) + 0.5,
    0.5 * sin(3.0 * p.y) + 0.5,
    sin(p.x + p.y) * 0.5 + 0.5
  );

  vec3 pink = vec3(0.99, 0.83, 0.90);
  vec3 mint = vec3(0.80, 0.95, 0.89);
  vec3 sky = vec3(0.79, 0.91, 0.99);
  vec3 cream = vec3(1.00, 0.94, 0.90);

  vec3 col = mix(pink, mint, raw.r);
  col = mix(col, sky, raw.g * 0.62);
  col = mix(col, cream, raw.b * 0.34);
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

type GlContext = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  positionLocation: number;
  timeLoc: WebGLUniformLocation;
  resLoc: WebGLUniformLocation;
};

export const PastelShaderRemotion = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GlContext | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initWebGl = () => {
      const gl =
        (canvas.getContext("webgl") as WebGLRenderingContext | null) ??
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

      if (!gl) {
        console.error("[Shader] WebGL context olusturulamadi.");
        glRef.current = null;
        return;
      }

      const compileShader = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) {
          console.error("[Shader] Shader olusturulamadi.");
          return null;
        }
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error("[Shader] Shader compile hatasi:", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertex = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vertex || !fragment) {
        glRef.current = null;
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        console.error("[Shader] Program olusturulamadi.");
        glRef.current = null;
        return;
      }

      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("[Shader] Program link hatasi:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        glRef.current = null;
        return;
      }

      gl.useProgram(program);

      const buffer = gl.createBuffer();
      if (!buffer) {
        console.error("[Shader] Buffer olusturulamadi.");
        glRef.current = null;
        return;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const positionLocation = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const timeLoc = gl.getUniformLocation(program, "time");
      const resLoc = gl.getUniformLocation(program, "resolution");
      if (timeLoc === null || resLoc === null) {
        console.error("[Shader] Uniform lokasyonlari alinamadi.");
        glRef.current = null;
        return;
      }

      glRef.current = { gl, program, buffer, positionLocation, timeLoc, resLoc };
    };

    initWebGl();

    const onContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("[Shader] WebGL context lost.");
      glRef.current = null;
    };

    const onContextRestored = () => {
      console.info("[Shader] WebGL context restored.");
      initWebGl();
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      const ctx = glRef.current;
      if (ctx) {
        const { gl, program, buffer } = ctx;
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
      glRef.current = null;
    };
  }, []);

  useEffect(() => {
    const prev = lastSizeRef.current;
    if (!prev || prev.width !== width || prev.height !== height) {
      lastSizeRef.current = { width, height };
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    }
  }, [width, height]);

  useEffect(() => {
    const ctx = glRef.current;
    if (!ctx) return;

    const { gl, program, buffer, positionLocation, timeLoc, resLoc } = ctx;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.uniform1f(timeLoc, frame / fps);
    gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [frame, fps]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} />
    </AbsoluteFill>
  );
};
