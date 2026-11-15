import * as THREE from "three";
import { createLandscape } from "./landscape";
import { createWeather } from "./weather";

const stations = [
  { eye: [1.45, 7.6, 24], focus: [0, 5.3, -40] },
  { eye: [2.9, 5.7, 13], focus: [-.6, 5.1, -43] },
  { eye: [-3.4, 4.7, 2], focus: [-5.8, 5.4, -37] },
  { eye: [1.9, 5.1, -5.7], focus: [3.5, 6.4, -40] },
  { eye: [-1, 6.9, -19], focus: [-14, 6.2, -46] },
  { eye: [7.9, 10.5, -27], focus: [-11, 13.5, -76] },
  { eye: [15.2, 12.4, -34.8], focus: [-18, 17.2, -89] },
];

export function mountWorld(environment: HTMLElement, canvas: HTMLCanvasElement, views: HTMLElement[]) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1d263e, .020);
  scene.add(new THREE.HemisphereLight(0xa7bbef, 0x555a72, 1.35));
  const softLight = new THREE.DirectionalLight(0xa7bcff, 1.1);
  softLight.position.set(-27, 35, 19);
  scene.add(softLight);
  const rimLight = new THREE.DirectionalLight(0x4e729d, .51);
  rimLight.position.set(37, 22, -54);
  scene.add(rimLight);

  const compact = innerWidth <= 780 || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
  let seed = 845332;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const landscape = createLandscape(scene, random, compact);
  const weather = createWeather(scene, random, landscape.lampPoints, compact);
  const camera = new THREE.PerspectiveCamera(50, 1, .11, 360);
  const positionPath = new THREE.CatmullRomCurve3(stations.map(shot => new THREE.Vector3(...shot.eye)));
  const focusPath = new THREE.CatmullRomCurve3(stations.map(shot => new THREE.Vector3(...shot.focus)));
  const cameraFocus = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const cursor = new THREE.Vector2();
  const ambientPointer = new THREE.Vector2();
  const ray = new THREE.Raycaster();

  const listeners = new AbortController();
  const { signal } = listeners;
  let ranges: number[] = [];
  let raf = 0;
  let elapsed = 0;
  let last = 0;
  let play = false;
  let lost = false;
  let disposed = false;
  let hasPointer = false;
  let progress = -1;
  let target = 0;
  let output = "";
  let scale = 1;
  let slowFrames = 0;

  function readScroll() {
    const y = window.scrollY;
    const index = ranges.findLastIndex(start => start <= y);
    const count = ranges.length - 1;
    if (index < 0 || count < 1) target = 0;
    else if (index >= count) target = 1;
    else target = (index + (y - ranges[index]) / Math.max(1, ranges[index + 1] - ranges[index])) / count;
  }

  function measureScroll() {
    const scrollEnd = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    ranges = views.map((view, i) => i === 0 ? 0 : Math.min(scrollEnd, view.getBoundingClientRect().top + scrollY));
    readScroll();
  }

  function resize() {
    const w = Math.max(1, innerWidth);
    const h = Math.max(1, innerHeight);
    const cap = compact ? 1 : 1.3;
    const pixelBudget = compact ? 700_000 : 1_480_000;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cap, Math.sqrt(pixelBudget / (w * h))) * scale);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 60 + (1 - camera.aspect) * 11 : 50;
    camera.updateProjectionMatrix();
    measureScroll();
  }

  function frame(now: number) {
    raf = 0;
    if (!play || lost || disposed) return;
    const minimumFrame = compact ? 1000 / 42 : 1000 / 62;
    const interval = last ? now - last : minimumFrame;
    if (interval >= minimumFrame - 1) {
      last = now;
      const dt = Math.min(interval / 1000, .065);
      elapsed += dt;
      const responsiveness = 1 - Math.exp(-dt * 4.25);
      progress = progress < 0 ? target : THREE.MathUtils.lerp(progress, target, responsiveness);
      ambientPointer.lerp(cursor, responsiveness);
      positionPath.getPoint(progress, camera.position);
      focusPath.getPoint(progress, cameraFocus);
      camera.position.x += ambientPointer.x * .82;
      camera.position.y += ambientPointer.y * .47;
      camera.lookAt(cameraFocus.x + ambientPointer.x * 1.4, cameraFocus.y + ambientPointer.y * .65, cameraFocus.z);
      camera.updateMatrixWorld();
      ray.setFromCamera(ambientPointer, camera);
      landscape.animate(elapsed);
      weather.animate(dt, elapsed, hasPointer ? ray.ray.at(14, hit) : null);
      renderer.render(scene, camera);
      const station = progress.toFixed(2);
      if (station !== output) {
        environment.dataset.camera = station;
        output = station;
      }
      if (environment.dataset.renderer !== "three") environment.dataset.renderer = "three";
      if (scale > .68 && elapsed > 1.5) {
        slowFrames = interval > (compact ? 50 : 32) ? slowFrames + 1 : Math.max(0, slowFrames - 2);
        if (slowFrames > 24) {
          slowFrames = 0;
          scale *= .81;
          resize();
        }
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  function resume() {
    if (play && !raf && !lost && !disposed) raf = requestAnimationFrame(frame);
  }

  function onPointer(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    cursor.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
    hasPointer = true;
  }

  function resetPointer() {
    cursor.set(0, 0);
    hasPointer = false;
  }

  function onClick(event: MouseEvent) {
    if (!play || lost || event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest("a, button, summary, header, footer, input, textarea, p, h1, h2, h3, pre, li") || getSelection()?.toString()) return;
    ray.setFromCamera(cursor.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), camera);
    weather.burst(ray.ray.at(14, hit));
    if (!hasPointer) resetPointer();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    pause();
    environment.dataset.renderer = "fallback";
  }

  function onContextRestored() {
    lost = false;
    resize();
    resume();
  }

  const documentSize = new ResizeObserver(measureScroll);
  const content = document.querySelector("main");
  if (content) documentSize.observe(content);
  resize();
  window.addEventListener("scroll", readScroll, { passive: true, signal });
  window.addEventListener("resize", resize, { signal });
  window.addEventListener("pointermove", onPointer, { passive: true, signal });
  document.documentElement.addEventListener("pointerleave", resetPointer, { signal });
  window.addEventListener("blur", resetPointer, { signal });
  window.addEventListener("click", onClick, { signal });
  canvas.addEventListener("webglcontextlost", onContextLost, { signal });
  canvas.addEventListener("webglcontextrestored", onContextRestored, { signal });

  return {
    setRunning(running: boolean) {
      play = running;
      if (running) resume();
      else pause();
    },
    dispose() {
      disposed = true;
      pause();
      listeners.abort();
      documentSize.disconnect();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.InstancedMesh) object.dispose();
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
          geometries.add(object.geometry);
        }
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          for (const material of [object.material].flat()) materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      landscape.dispose();
      renderer.dispose();
    },
  };
}
