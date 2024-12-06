import * as THREE from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export default class Post {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // === Configuration du post-processing ===
    this.composer = new EffectComposer(this.renderer);

    // Ajout du RenderPass pour rendre la scène
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Paramètres du bloom
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5, // intensité du bloom
      1.4, // rayon
      0.3 // seuil
    );
    this.composer.addPass(bloomPass);

    // === Shader pour l'effet de grain ===
    const GrainShader = {
      uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.06 },
        time: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform float time;
        varying vec2 vUv;

        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float noise = rand(vUv * time) * amount;
          color.rgb *= noise / 1.5 + 0.23;
          
          gl_FragColor = color;
        }
      `,
    };

    const grainPass = new ShaderPass(GrainShader);
    this.composer.addPass(grainPass);

    // === Ajouter un ShaderPass FXAA ===
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms["resolution"].value.set(
      1 / (window.innerWidth * pixelRatio),
      1 / (window.innerHeight * pixelRatio)
    );
    this.composer.addPass(fxaaPass);

    // === Stockage des passes pour mise à jour des uniforms ===
    this.passes = this.composer.passes;

    // Horloge pour le temps dans les shaders
    this.clock = new THREE.Clock();

    // Écouteur pour le redimensionnement
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  // Méthode pour rendre la scène avec post-processing
  render() {
    this.composer.render();
  }

  // Mise à jour des uniforms nécessitant le temps
  update() {
    const elapsedTime = this.clock.getElapsedTime();
    this.passes.forEach((pass) => {
      if (pass.uniforms && pass.uniforms.time) {
        pass.uniforms.time.value = elapsedTime;
      }
    });
  }

  // Gestion du redimensionnement
  onWindowResize() {
    const pixelRatio = this.renderer.getPixelRatio();
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.passes.forEach((pass) => {
      if (pass.uniforms && pass.uniforms.iResolution) {
        pass.uniforms.iResolution.value.set(
          window.innerWidth,
          window.innerHeight
        );
      } else if (pass.material && pass.material.uniforms["resolution"]) {
        pass.material.uniforms["resolution"].value.set(
          1 / (window.innerWidth * pixelRatio),
          1 / (window.innerHeight * pixelRatio)
        );
      }
    });
  }
}
