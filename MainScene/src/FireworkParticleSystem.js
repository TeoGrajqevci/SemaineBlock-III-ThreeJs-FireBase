import * as THREE from "three";

export default class FireworkParticleSystem {
  constructor(params) {
    this.params = params;
    this.particlesPerExplosion = 200;
    this.explosions = [];
    this.maxExplosions = 3;
    this.boundingBox = {
      width: this.params.cubeSize * 0.8,
      height: this.params.cubeSize * 0.8,
      depth: this.params.cubeSize * 0.8,
    };

    // Create container for all explosions
    this.container = new THREE.Group();

    // Start with one explosion
    this.createNewExplosion();
  }

  createNewExplosion() {
    if (this.explosions.length >= this.maxExplosions) return;

    // Random position for explosion center
    const center = new THREE.Vector3(
      (Math.random() - 0.5) * this.boundingBox.width * 0.5,
      (Math.random() - 0.5) * this.boundingBox.height * 0.5,
      (Math.random() - 0.5) * this.boundingBox.depth * 0.5
    );

    // Create geometry for explosion particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particlesPerExplosion * 3);
    const colors = new Float32Array(this.particlesPerExplosion * 3);
    const velocities = [];

    // Random color for this explosion
    const explosionColor = new THREE.Color();
    explosionColor.setHSL(Math.random(), 1, 0.5);

    for (let i = 0; i < this.particlesPerExplosion; i++) {
      const i3 = i * 3;

      // Set initial position at explosion center
      positions[i3] = center.x;
      positions[i3 + 1] = center.y;
      positions[i3 + 2] = center.z;

      // Random velocity in sphere
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      velocities.push(velocity);

      // Set particle color with slight variation
      const hue = explosionColor.getHSL({}).h + (Math.random() - 0.5) * 0.1;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.velocities = velocities;
    points.userData.age = 0;
    points.userData.lifetime = 2 + Math.random(); // Random lifetime between 2-3 seconds
    points.userData.center = center;

    this.explosions.push(points);
    this.container.add(points);
  }

  update() {
    // Chance to create new explosion
    if (Math.random() < 0.02) {
      // 2% chance each frame
      this.createNewExplosion();
    }

    // Update each explosion
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      const positions = explosion.geometry.attributes.position.array;
      const velocities = explosion.userData.velocities;

      // Update age
      explosion.userData.age += 0.016; // Approximate for 60fps
      const ageRatio = explosion.userData.age / explosion.userData.lifetime;

      // Update each particle in the explosion
      for (let j = 0; j < this.particlesPerExplosion; j++) {
        const j3 = j * 3;

        // Apply velocity with gravity effect
        velocities[j].y -= 0.001; // Gravity
        positions[j3] += velocities[j].x;
        positions[j3 + 1] += velocities[j].y;
        positions[j3 + 2] += velocities[j].z;

        // Keep within bounds
        positions[j3] = THREE.MathUtils.clamp(
          positions[j3],
          -this.boundingBox.width / 2,
          this.boundingBox.width / 2
        );
        positions[j3 + 1] = THREE.MathUtils.clamp(
          positions[j3 + 1],
          -this.boundingBox.height / 2,
          this.boundingBox.height / 2
        );
        positions[j3 + 2] = THREE.MathUtils.clamp(
          positions[j3 + 2],
          -this.boundingBox.depth / 2,
          this.boundingBox.depth / 2
        );
      }

      // Fade out based on age
      explosion.material.opacity = 1 - ageRatio;

      // Remove if lifetime exceeded
      if (explosion.userData.age >= explosion.userData.lifetime) {
        this.container.remove(explosion);
        this.explosions.splice(i, 1);
        explosion.geometry.dispose();
        explosion.material.dispose();
      }

      explosion.geometry.attributes.position.needsUpdate = true;
    }
  }

  getParticleSystem() {
    return this.container;
  }

  dispose() {
    this.explosions.forEach((explosion) => {
      explosion.geometry.dispose();
      explosion.material.dispose();
    });
    this.explosions = [];
  }
}
