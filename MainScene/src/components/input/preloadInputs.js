import { OBJLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

export function preloadInputs(path) {
  const buttons = [];
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader();

    // Define an array of materials with different properties
    const materials = [
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // orange
        metalness: 0.0,
        roughness: 0.1,
        reflectivity: 1.0,
        emissive: 0xfcba03,
        emissiveIntensity: 0.1,
        //specularColor: 0xfcba03,
        specularIntensity: 1.0,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // pink
        metalness: 0.0,
        roughness: 0.1,
        reflectivity: 1.0,
        emissive: 0xf27aff,
        emissiveIntensity: 0.1,
        //specularColor: 0xf27aff,
        specularIntensity: 1.0,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // blue
        metalness: 0.0,
        roughness: 0.1,
        reflectivity: 1.0,
        emissive: 0x7aabff,
        emissiveIntensity: 0.1,
        //specularColor: 0x7aabff,
        specularIntensity: 1.0,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // green
        metalness: 0.0,
        roughness: 0.1,
        reflectivity: 1.0,
        emissive: 0x7aff9b,
        emissiveIntensity: 0.1,
        // specularColor: 0x7aff9b,
        specularIntensity: 1.0,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // black
        metalness: 0.0,
        roughness: 0.1,
        reflectivity: 1.0,
        emissive: 0x00000,
        emissiveIntensity: 0.1,
        //specularColor: 0x00000,
        specularIntensity: 1.0,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xfaf7f8, // red
        metalness: 0.0,
        roughness: 0.1,
        reflectivity: 1.0,
        emissive: 0xff333a,
        emissiveIntensity: 0.1,
        // specularColor: 0xff7e7a,
        specularIntensity: 1.0,
      }),
    ];

    loader.load(path, (object) => {
      let materialIndex = 0; // Keep track of the material index

      object.traverse((child) => {
        if (child.isMesh) {
          if (/^button0[1-6]$/.test(child.name)) {
            // Assign a material from the array
            child.material = materials[materialIndex % materials.length];

            const button = {
              name: child.name,
              mesh: child,
              state: "up",
            };

            buttons.push(button);
            materialIndex++; // Increment the material index
          }
        }
      });

      resolve(buttons);
    });
  });
}
