import * as THREE from "three";

type XYZ = [number, number, number];

export function createLandscape(scene: THREE.Scene, random: () => number, compact: boolean) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x242d3f, roughness: .9 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x343a4b, roughness: .96 });
  const timber = new THREE.MeshStandardMaterial({ color: 0x382724, roughness: .87 });
  const redwood = new THREE.MeshStandardMaterial({ color: 0x683627, roughness: .84 });
  const tile = new THREE.MeshStandardMaterial({ color: 0x19243b, roughness: .58, flatShading: true });
  const foliage = new THREE.MeshStandardMaterial({ color: 0x192d32, roughness: 1, flatShading: true });
  const paper = new THREE.MeshBasicMaterial({ color: 0xfac987 });
  const boxGeometry = new THREE.BoxGeometry();
  const pineGeometry = new THREE.ConeGeometry(1, 1, 5);
  const rockGeometry = new THREE.DodecahedronGeometry(1);
  const batches = new Map<THREE.Material, Map<THREE.BufferGeometry, THREE.Matrix4[]>>();
  const transform = new THREE.Object3D();

  function stamp(geometry: THREE.BufferGeometry, material: THREE.Material, at: XYZ, size: XYZ, turn = 0) {
    let shapes = batches.get(material);
    if (!shapes) {
      shapes = new Map();
      batches.set(material, shapes);
    }
    let transforms = shapes.get(geometry);
    if (!transforms) {
      transforms = [];
      shapes.set(geometry, transforms);
    }
    transform.position.set(...at);
    transform.rotation.set(0, turn, 0);
    transform.scale.set(...size);
    transform.updateMatrix();
    transforms.push(transform.matrix.clone());
  }

  function box(material: THREE.Material, at: XYZ, size: XYZ, turn = 0) {
    stamp(boxGeometry, material, at, size, turn);
  }

  function roof(at: XYZ, width: number, depth: number, rise: number) {
    // Three tapering courses make a flared eave and a narrow, raised ridge.
    const points: number[] = [];
    const indices: number[] = [];
    const courses = [
      [width * .5, depth * .5, 0],
      [width * .43, depth * .37, rise * .19],
      [width * .30, depth * .19, rise * .57],
      [width * .20, depth * .04, rise],
    ];
    for (const [x, z, y] of courses) points.push(-x, y, z, x, y, z, x, y, -z, -x, y, -z);
    for (let ring = 0; ring < courses.length - 1; ring++) {
      for (let side = 0; side < 4; side++) {
        const a = ring * 4 + side;
        const b = ring * 4 + (side + 1) % 4;
        indices.push(a, b, a + 4, b, b + 4, a + 4);
      }
    }
    indices.push(12, 13, 14, 12, 14, 15);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, tile);
    mesh.position.set(...at);
    scene.add(mesh);
    box(edge, at, [width * .99, .11, depth * .98]);
    box(tile, [at[0], at[1] + rise, at[2]], [width * .49, .14, Math.max(depth * .11, .18)]);
  }

  const sky = new THREE.Mesh(new THREE.SphereGeometry(220, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color(0x090d1a) },
        horizon: { value: new THREE.Color(0x1c293f) },
        glow: { value: new THREE.Color(0x155052) },
      },
      vertexShader: `varying vec3 vDirection;
        void main() {
          vDirection = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `varying vec3 vDirection;
        uniform vec3 zenith;
        uniform vec3 horizon;
        uniform vec3 glow;
        void main() {
          vec3 axis = normalize(vDirection);
          float band = exp(-abs(axis.y - 0.06) * 5.1);
          float aurora = pow(max(dot(axis, normalize(vec3(0.48, 0.32, -1.0))), 0.0), 18.0);
          vec3 c = mix(zenith, horizon, band * 0.98) + glow * aurora * 0.51;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
  sky.renderOrder = -10;
  scene.add(sky);

  const halo = new THREE.DataTexture(makeHalo(), 48, 48, THREE.RGBAFormat);
  halo.needsUpdate = true;
  const moonGeometry = new THREE.SphereGeometry(5.3, 32, 20);
  const moonVertices = moonGeometry.getAttribute("position");
  const moonColors = new Float32Array(moonVertices.count * 3);
  const lightFace = new THREE.Color(0xe9713e);
  const darkFace = new THREE.Color(0xbb3c27);
  const moonTint = new THREE.Color();
  for (let i = 0; i < moonVertices.count; i++) {
    const phase = THREE.MathUtils.smoothstep(moonVertices.getX(i) + .23 * moonVertices.getY(i), -2.4, 2.1);
    moonTint.copy(lightFace).lerp(darkFace, phase).toArray(moonColors, i * 3);
  }
  moonGeometry.setAttribute("color", new THREE.BufferAttribute(moonColors, 3));
  const moon = new THREE.Mesh(moonGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  moon.position.set(-20, 26, -118);
  scene.add(moon);
  const moonShade = new THREE.Sprite(new THREE.SpriteMaterial({
    map: halo, color: 0xbb4e34, opacity: .33, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  moonShade.position.copy(moon.position);
  moonShade.position.z -= 5.7;
  moonShade.scale.set(34, 34, 1);
  scene.add(moonShade);

  const stars: number[] = [];
  for (let i = 0; i < 220; i++) {
    stars.push((random() - .5) * 250, 7 + random() * 75, -157 - random() * 20);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xabb4da, size: .24, transparent: true, opacity: .55, fog: false })));

  const ridges = [
    { z: -139, level: 9.5, relief: 8.3, color: 0x192238 },
    { z: -103, level: 8, relief: 6, color: 0x1b2940 },
    { z: -74, level: 3.5, relief: 7, color: 0x19253b },
    { z: -59, level: -.5, relief: 5, color: 0x172239 },
  ];
  ridges.forEach(({ z, level, relief, color }, layer) => {
    const positions: number[] = [];
    const ridgeIndices: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -136 + i * 6.8;
      const peak = level + relief * (Math.sin(i * .54 + layer * 1.5) * .34
        + Math.sin(i * .19 - layer) * .51 + random() * .17);
      positions.push(x, -18, z, x, peak, z - random() * 4);
      if (i < 40) ridgeIndices.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 2, i * 2 + 3, i * 2 + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(ridgeIndices);
    scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, fog: false })));
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 155), new THREE.MeshStandardMaterial({
    color: 0x202a3b, roughness: .77, metalness: .09,
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -.24, -39);
  scene.add(ground);
  box(stone, [4, 1.38, -42], [39, 3.2, 31]);
  box(edge, [4, 2.98, -42.5], [39.5, .24, 31.3]);

  for (let i = 0; i < 18; i++) {
    const elevation = .14 + i * .167;
    const z = -14.0 - i * .78;
    box(stone, [2.5, elevation / 2 - .22, z], [5.9, elevation + .08, .85]);
    box(edge, [2.5, elevation - .18, z + .32], [6, .12, .28]);
    for (const side of [-1, 1]) box(stone, [2.5 + side * 3.21, elevation / 2 + .05, z], [.51, elevation + .5, .84]);
  }
  for (let i = 0; i < 19; i++) {
    const z = 22 - i * 1.86;
    const x = 1.45 + Math.sin(i / 4) * .34;
    for (let p = 0; p < 3; p++) {
      box(i % 4 === 0 ? edge : stone, [x + (p - 1) * 1.46, -.16, z + random() * .13], [1.39, .14, 1.79], (random() - .5) * .04);
    }
  }
  for (let i = 0; i < 13; i++) {
    box(stone, [2.5, 3.08, -29 - i * .51], [6.4, .12, .48]);
  }

  // The entry is timber over stone. The main hall and side pavilion remain visible from the same court.
  for (const x of [-7.3, -.1]) {
    box(stone, [x, .28, -10], [1.03, 1.04, 1.12]);
    box(redwood, [x, 2.69, -10], [.62, 5.08, .67]);
    box(timber, [x, 4.49, -10], [.91, .47, 1.16]);
  }
  box(redwood, [-3.7, 4.22, -10], [8.67, .34, .69]);
  box(timber, [-3.7, 5.05, -10], [9.02, .55, .73]);
  roof([-3.7, 5.4, -10], 10.3, 2.25, .75);

  const lanterns: THREE.Sprite[] = [];
  function warmLight(x: number, y: number, z: number, size: number, alpha: number) {
    const light = new THREE.Sprite(new THREE.SpriteMaterial({
      map: halo, color: 0xffb951, opacity: alpha, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    light.scale.set(size, size, 1);
    light.position.set(x, y, z);
    scene.add(light);
    return light;
  }

  function hall(x: number, z: number, w: number, d: number, scale: number) {
    const front = z + d / 2;
    box(stone, [x, 3.3, z], [w + 2.3, .49, d + 2.4]);
    box(timber, [x, 3.7, z], [w + 1, .25, d + 1]);
    box(timber, [x, 4.75 + scale, z - .3], [w, 2 + 2 * scale, d - .5]);
    for (let i = -3; i <= 3; i++) {
      const bay = w / 7;
      const panel = x + i * bay;
      box(paper, [panel, 4.1 + scale, front + .01], [bay * .80, scale * 1.34, .08]);
      for (const offset of [-.24, 0, .24]) {
        box(timber, [panel + bay * offset, 4.1 + scale, front + .08], [.075, scale * 1.38, .1]);
      }
      box(timber, [panel, 4.12 + scale, front + .08], [bay * .81, .09, .11]);
      box(redwood, [panel + bay * .47, 4.7 + scale, front + .18], [.2, 2 + 2 * scale, .27]);
    }
    const eaveY = 5.77 + 2 * scale;
    box(redwood, [x, eaveY - .15, front], [w + .45, .35, .46]);
    roof([x, eaveY, z], w + 3.8, d + 3.25, 1.9 * scale);
    box(timber, [x, eaveY + 1.37 * scale, z - .35], [w * .61, 1.1, d * .66]);
    roof([x, eaveY + 1.7 * scale, z - .35], w * .76 + 1.8, d * .71 + 1.2, 1.5 * scale);
    warmLight(x, 4.7 + scale, front + .5, w * .83, .11);
  }
  hall(4.2, -39, 16.5, 9.5, 1.5);
  hall(-12.5, -42.5, 7.7, 6.3, .85);

  const lampPoints: THREE.Vector3[] = [];
  const lanternSites: XYZ[] = [
    [-2.25, 0, 9], [5.01, 0, 7], [-2.51, 0, 2], [5.02, 0, 0],
    [-2.05, 0, -6.5], [5.25, 0, -9], [-1.27, .9, -17.8], [6.12, .9, -17.8],
    [-1.4, 2.18, -24], [6.33, 2.18, -24], [-2.95, 3.1, -33], [8.30, 3.1, -33],
    [-8.4, 3.1, -38], [13.2, 3.1, -37.5], [16, 3.1, -46], [-11, 3.1, -47],
  ];
  const lanternCap = new THREE.ConeGeometry(1, 1, 4);
  for (const [x, y, z] of lanternSites) {
    box(stone, [x, y + .01, z], [.75, .27, .75]);
    box(edge, [x, y + .60, z], [.31, 1.15, .31]);
    box(stone, [x, y + 1.19, z], [.57, .18, .57]);
    box(paper, [x, y + 1.48, z], [.35, .42, .35]);
    for (const dx of [-.21, .21]) {
      for (const dz of [-.21, .21]) box(timber, [x + dx, y + 1.46, z + dz], [.075, .55, .075]);
    }
    stamp(lanternCap, tile, [x, y + 1.81, z], [.52, .43, .52], Math.PI / 4);
    const glow = warmLight(x, y + 1.47, z + .32, 3.35, .37);
    lanterns.push(glow);
    lampPoints.push(glow.position.clone());
  }
  for (const [x, y, z] of [lanternSites[0], lanternSites[1], lanternSites[10]]) {
    const light = new THREE.PointLight(0xf9a248, 17, 6, 2);
    light.position.set(x, y + 1.48, z);
    scene.add(light);
  }

  const trees = compact ? 82 : 131;
  for (let i = 0; i < trees; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 17 - random() * 84;
    const margin = z < -25 && z > -54 ? 22 : 8;
    const x = side * (margin + random() * 33);
    const h = 2.5 + random() * 4.9;
    const turn = random() * Math.PI;
    box(timber, [x, h * .21, z], [h * .078, h * .63, h * .085], turn);
    for (let crown = 0; crown < 3; crown++) {
      const radius = h * (.36 - crown * .071);
      stamp(pineGeometry, foliage, [x, h * (.54 + crown * .17), z], [radius, h * .60, radius], turn + crown * .29);
    }
  }
  for (let i = 0; i < 42; i++) {
    const z = 19 - random() * 70;
    const x = (i % 2 ? -1 : 1) * (6.8 + random() * 17);
    const s = .18 + random() * .54;
    stamp(rockGeometry, stone, [x, s * .22, z], [s * 1.95, s, s * 1.3], random() * 4);
  }

  const mist = Array.from({ length: 5 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: halo, color: 0x7084b0, opacity: .093, transparent: true, depthWrite: false,
    }));
    sprite.position.set(-34 + i * 17, 1.5 + (i % 2), -32 - i * 6);
    sprite.scale.set(51, 4.5 + i * .5, 1);
    scene.add(sprite);
    return sprite;
  });
  for (const [material, shapes] of batches) {
    for (const [geometry, matrices] of shapes) {
      const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
      scene.add(mesh);
    }
  }

  return {
    lampPoints,
    animate(time: number) {
      lanterns.forEach((lantern, i) => {
        lantern.material.opacity = .32 + .07 * Math.sin(time * 4.1 + i * 1.6) * Math.sin(time * 7.8 - i);
      });
      mist.forEach((sprite, i) => {
        sprite.position.x = -34 + i * 17 + 3.5 * Math.sin(time * .073 + i * 2);
      });
    },
    dispose: () => halo.dispose(),
  };
}

function makeHalo() {
  const size = 48;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const x = (i % size + .5) / size * 2 - 1;
    const y = (Math.floor(i / size) + .5) / size * 2 - 1;
    const distance = Math.hypot(x, y);
    data.set([255, 255, 255, Math.round(255 * Math.max(0, 1 - distance) ** 2.9)], i * 4);
  }
  return data;
}
