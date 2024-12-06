import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import EdgeGlowMaterial from "./holographicMat.js";

export default class Eggs {
  constructor(scene) {
    this.scene = scene;
    this.eggs = [];
    this.materials = {}; // Store materials mapped to egg names
    this.loader = new OBJLoader();
    this.eggsFolder = "./models/eggs/";
    this.eggFiles = [
      "black_egg.obj",
      "blue_egg.obj",
      "green_egg.obj",
      "orange_egg.obj",
      "pink_egg.obj",
      "red_egg.obj",
    ];

    // Define manual positions for each egg
    this.positions = {
      black_egg: { x: 0.5, y: 0, z: 0.8 },
      blue_egg: { x: 8.8, y: 0, z: -9.9 },
      green_egg: { x: -0.2, y: 0, z: 0.8 },
      orange_egg: { x: -6.1, y: 0, z: 0.15 },
      pink_egg: { x: -3.3, y: 0, z: -9.4 },
      red_egg: { x: 0.95, y: 0, z: -0.25 },
    };

    this.startTimes = {}; // Store start times for each egg's oscillation

    this.loadEggs();
  }

  loadEggs() {
    this.eggFiles.forEach((file) => {
      const eggName = file.replace(".obj", ""); // Extract egg name
      const eggPath = `${this.eggsFolder}${file}`;

      this.loader.load(
        eggPath,
        (obj) => {
          obj.name = eggName; // Assign name to the egg object

          // Assign EdgeGlowMaterial to all child meshes
          obj.traverse((child) => {
            if (child.isMesh) {
              const edgeGlowMaterial = new EdgeGlowMaterial();
              child.material = edgeGlowMaterial;
              this.materials[eggName] = edgeGlowMaterial; // Save material with egg name
            }
          });

          // Set manual position based on the positions mapping
          if (this.positions[eggName]) {
            obj.position.set(
              this.positions[eggName].x,
              this.positions[eggName].y,
              this.positions[eggName].z
            );
          } else {
            console.warn(`No position defined for ${eggName}`);
          }

          this.startTimes[eggName] = performance.now(); // Store start time for oscillation

          this.eggs.push(obj);
          this.scene.add(obj);
        },
        undefined,
        (error) => {
          console.error(`Error loading ${file}:`, error);
        }
      );
    });
  }

  animateMaterialProperty(material, propertyName, targetValue, duration = 1) {
    if (!material || !material.uniforms[propertyName]) {
      console.error(`No uniform found for property: ${propertyName}`);
      return;
    }

    const startValue = material.uniforms[propertyName].value;
    const delta = targetValue - startValue;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);
      material.uniforms[propertyName].value = startValue + delta * t;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  animateInsideTransparencyForEgg(
    eggName,
    targetTransparency,
    targetEdgeIntensity,
    duration = 1
  ) {
    const material = this.materials[eggName];
    if (!material) {
      console.error(`No material found for egg: ${eggName}`);
      return;
    }

    // Animate `insideTransparency`
    this.animateMaterialProperty(
      material,
      "insideTransparency",
      targetTransparency,
      duration
    );

    // Animate `edgeIntensity`
    this.animateMaterialProperty(
      material,
      "edgeIntensity",
      targetEdgeIntensity,
      duration
    );
  }

  triggerAnimationForEggIn(eggName) {
    this.animateInsideTransparencyForEgg(eggName, 0, 0.5, 1); // Animate insideTransparency to 0 and edgeIntensity to 0.5 in 1 second
  }

  triggerAnimationForEggOut(eggName) {
    this.animateInsideTransparencyForEgg(eggName, 10, 1.5, 1); // Animate insideTransparency to 10 and edgeIntensity to 1.5 in 1 second
  }

  update() {
    const time = performance.now() / 1000; // Time in seconds
    this.eggs.forEach((egg) => {
      const startTime = this.startTimes[egg.name] || 0;
      const offset = Math.sin((time - startTime) * 2) * 0.1; // Adjust speed and range
      egg.position.y = (this.positions[egg.name]?.y || 0) + offset;
    });
  }
}
