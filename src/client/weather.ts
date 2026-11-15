import * as THREE from "three";

export function createWeather(scene: THREE.Scene, random: () => number, lamps: THREE.Vector3[], compact: boolean) {
  const rainCount = compact ? 290 : 640;
  const rainPositions = new Float32Array(rainCount * 6);
  const drops = Array.from({ length: rainCount }, () => ({
    x: (random() - .5) * 89, y: random() * 35, z: 27 - random() * 101,
    length: .48 + random() * .51, speed: 10 + random() * 6,
  }));
  const rainGeometry = new THREE.BufferGeometry();
  const rainAttribute = new THREE.BufferAttribute(rainPositions, 3).setUsage(THREE.DynamicDrawUsage);
  rainGeometry.setAttribute("position", rainAttribute);
  const rain = new THREE.LineSegments(rainGeometry,
    new THREE.LineBasicMaterial({ color: 0x7d93be, opacity: .38, transparent: true, depthWrite: false }));
  rain.frustumCulled = false;
  scene.add(rain);

  const leafCount = compact ? 37 : 84;
  const leafGeometry = new THREE.BufferGeometry();
  leafGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -.63, 0, 0, -.1, -.22, .12, .57, .04, 0, -.18, .36, .1,
  ], 3));
  leafGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  const leaves = new THREE.InstancedMesh(leafGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: .54 }), leafCount);
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  leaves.frustumCulled = false;
  const leafStates = Array.from({ length: leafCount }, (_, i) => {
    leaves.setColorAt(i, new THREE.Color([0xa2503b, 0xe0954f, 0xb7a56d, 0x745450][i % 4]));
    return {
      x: (random() - .5) * 54, y: random() * 23, z: 20 - random() * 81,
      angle: random() * Math.PI * 2, speed: .78 + random() * .56, size: .12 + random() * .24,
    };
  });
  scene.add(leaves);

  const ambientCount = compact ? 77 : 156;
  const burstCount = compact ? 16 : 30;
  const glowCount = ambientCount + burstCount;
  const sparks = Array.from({ length: glowCount }, (_, i) => {
    const lamp = lamps[i % lamps.length];
    const firefly = i % 5 === 0;
    const origin = new THREE.Vector3(
      lamp.x + (random() - .5) * (firefly ? 17 : 2.5),
      lamp.y + random() * (firefly ? 3.2 : 1.8) - .7,
      lamp.z + (random() - .5) * (firefly ? 12 : 2.8),
    );
    return {
      origin, point: origin.clone(), velocity: new THREE.Vector3(), phase: random() * 6.28,
      life: 0, firefly, gain: .3 + random() * .7,
    };
  });
  const pointPositions = new Float32Array(glowCount * 3);
  const intensity = new Float32Array(glowCount);
  const colors = new Float32Array(glowCount * 3);
  const ambientWarm = new THREE.Color(0xffb55b);
  const fireflyTint = new THREE.Color(0xd5eaa8);
  sparks.forEach((spark, i) => (spark.firefly ? fireflyTint : ambientWarm).toArray(colors, i * 3));
  const glowGeometry = new THREE.BufferGeometry();
  const pointAttribute = new THREE.BufferAttribute(pointPositions, 3).setUsage(THREE.DynamicDrawUsage);
  const intensityAttribute = new THREE.BufferAttribute(intensity, 1).setUsage(THREE.DynamicDrawUsage);
  glowGeometry.setAttribute("position", pointAttribute);
  glowGeometry.setAttribute("intensity", intensityAttribute);
  glowGeometry.setAttribute("tint", new THREE.BufferAttribute(colors, 3));
  const glows = new THREE.Points(glowGeometry, new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float intensity;
      attribute vec3 tint;
      varying vec4 vGlow;
      void main() {
        vec4 eye = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * eye;
        gl_PointSize = clamp(125.0 / max(1.0, -eye.z), 1.5, 22.0);
        vGlow = vec4(tint, intensity * exp(-max(0.0, -eye.z - 10.0) * 0.021));
      }`,
    fragmentShader: `varying vec4 vGlow;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
        float glow = max(0.0, 1.0 - d);
        gl_FragColor = vec4(vGlow.rgb, glow * glow * vGlow.a);
        #include <colorspace_fragment>
      }`,
  }));
  glows.frustumCulled = false;
  scene.add(glows);

  const meteorGeometry = new THREE.BufferGeometry();
  const meteorPositions = new Float32Array(6);
  const meteorAttribute = new THREE.BufferAttribute(meteorPositions, 3).setUsage(THREE.DynamicDrawUsage);
  meteorGeometry.setAttribute("position", meteorAttribute);
  const meteorMaterial = new THREE.LineBasicMaterial({
    color: 0xe2d5cc, transparent: true, opacity: 0, fog: false, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const meteor = new THREE.Line(meteorGeometry, meteorMaterial);
  meteor.frustumCulled = false;
  scene.add(meteor);
  const meteorOrigin = new THREE.Vector3(8, 41, -106);
  const dummy = new THREE.Object3D();
  const repulsion = new THREE.Vector3();
  let nextMeteor = 6.2;
  let burstIndex = 0;

  return {
    animate(dt: number, time: number, pointer: THREE.Vector3 | null) {
      drops.forEach((drop, i) => {
        drop.y -= dt * drop.speed;
        drop.x += dt * 1.2;
        if (drop.y < -.3 || drop.x > 44.5) {
          drop.y += 34;
          drop.x = (random() - .5) * 89;
          drop.z = 27 - random() * 101;
        }
        const offset = i * 6;
        rainPositions[offset] = drop.x;
        rainPositions[offset + 1] = drop.y;
        rainPositions[offset + 2] = drop.z;
        rainPositions[offset + 3] = drop.x - drop.length * .20;
        rainPositions[offset + 4] = drop.y + drop.length;
        rainPositions[offset + 5] = drop.z + .1;
      });
      rainAttribute.needsUpdate = true;

      leafStates.forEach((leaf, i) => {
        leaf.y -= dt * leaf.speed;
        leaf.x += dt * (.61 + Math.cos(time + leaf.angle) * .33);
        if (leaf.y < -.1 || leaf.x > 28) {
          leaf.y = 18 + random() * 6;
          leaf.x = random() * 47 - 26;
        }
        dummy.position.set(leaf.x + Math.sin(time + leaf.angle) * .66, leaf.y, leaf.z);
        dummy.rotation.set(time * .9 + leaf.angle, time * .55 + leaf.angle, time * .62 - leaf.angle);
        dummy.scale.setScalar(leaf.size);
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      });
      leaves.instanceMatrix.needsUpdate = true;

      sparks.forEach((spark, i) => {
        let strength = 0;
        if (i < ambientCount) {
          const phase = time * (spark.firefly ? 1.3 : .61) + spark.phase;
          const drift = spark.firefly ? .89 : .29;
          spark.point.copy(spark.origin);
          spark.point.x += Math.sin(phase * .88) * drift;
          spark.point.y += Math.sin(phase + 1) * .45;
          spark.point.z += Math.cos(phase) * drift;
          strength = spark.gain * (.36 + .48 * Math.sin(phase * 1.7) ** 2);
          if (pointer) {
            const distance = spark.point.distanceTo(pointer);
            if (distance < 3.5) {
              repulsion.subVectors(spark.point, pointer);
              spark.point.addScaledVector(repulsion, (3.5 - distance) * .33);
              strength = Math.min(1, strength + .22);
            }
          }
        } else if (spark.life > 0) {
          spark.life -= dt * 1.23;
          spark.point.addScaledVector(spark.velocity, dt);
          spark.velocity.y -= dt * .63;
          strength = Math.max(0, spark.life);
        }
        spark.point.toArray(pointPositions, i * 3);
        intensity[i] = strength;
      });
      pointAttribute.needsUpdate = true;
      intensityAttribute.needsUpdate = true;

      const age = time - nextMeteor;
      meteor.visible = age > 0 && age < 1.06;
      if (meteor.visible) {
        meteorMaterial.opacity = Math.sin(Math.PI * age / 1.06) * .82;
        meteorPositions.set([
          meteorOrigin.x + age * 23, meteorOrigin.y - age * 9.5, meteorOrigin.z,
          meteorOrigin.x + age * 23 - 6.2, meteorOrigin.y - age * 9.5 + 2.55, meteorOrigin.z,
        ]);
        meteorAttribute.needsUpdate = true;
      } else if (age >= 1.06) {
        nextMeteor = time + 10 + random() * 9;
        meteorOrigin.set(random() * 76 - 44, 36 + random() * 18, -105);
      }
    },
    burst(at: THREE.Vector3) {
      for (let i = 0; i < burstCount / 2; i++) {
        const spark = sparks[ambientCount + burstIndex];
        burstIndex = (burstIndex + 1) % burstCount;
        spark.point.copy(at);
        spark.life = .66 + random() * .43;
        spark.velocity.set((random() - .5) * 5.8, random() * 2.6 - .65, (random() - .5) * 4);
      }
    },
  };
}
