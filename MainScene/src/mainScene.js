import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import Post from "./post.js";

import FirebaseConfig from "./FirebaseConfig.js";
import FirebaseListener from "./FirebaseListener.js";

import Swim from "./creatures/swim.js";
import Teleporter from "./creatures/teleporter.js";
import Alien from "./creatures/alien.js";
import Molusk from "./creatures/molusk.js";
import Fireworks from "./creatures/fireworks.js";
import Eel from "./creatures/eel.js";

import InputManager from "./components/input/InputManager.js";
import EdgeGlowMaterial from "./holographicMat.js";

import Eggs from "./eggs.js";

export default class MainScene {
  constructor() {
    this.loadConfig().then((config) => {
      this.config = config;
      this.initRenderer();
      this.initScene();
      this.initCamera();
      this.initLights();
      this.loadModels();
      this.initPostProcessing();
      this.clock = new THREE.Clock();
      this.inManager = new InputManager({
        targetDescriptors: this.config,
        scene: this.scene,
        camera: this.camera,
      });
      this.initCreatures();
      this.animate();
      this.addEventListeners();
      this.FirebaseListener = new FirebaseListener(
        this.buttons,
        this.onFirebaseData.bind(this)
      );

      this.blueDown = false;

      this.eggsNames = [];

      this.cameraSize = 8;

      // orbit controls
      // const controls = new OrbitControls(this.camera, this.renderer.domElement);
      // controls.target.set(0, 0, 0);
    });
  }

  onFirebaseData(key, entry) {
    console.log(key, entry);

    // Initialize state trackers and cooldowns if not already present
    if (!this.state) {
      this.state = { pink: null, blue: null, black: null, orange: null };
    }
    if (!this.cooldowns) {
      this.cooldowns = { pink: 0, blue: 0, black: 0, orange: 0 };
    }

    const currentTime = Date.now(); // Get current timestamp

    // Check cooldown before processing "blue"
    if (key === "black" && currentTime >= this.cooldowns.black) {
      if (entry.position === "down" && this.state.black !== "down") {
        this.teleporter.stopIdle();
        this.teleporter.createFirstPortal();
        this.teleporter.startTeleporting();
        this.teleporter.continue = true;
        this.state.black = "down";
        this.cooldowns.blue = currentTime + 550; // Set 1-second cooldown
      }
      if (entry.position === "up" && this.state.black !== "up") {
        // this.teleporter.startIdle();
        this.teleporter.continue = false;
        this.state.black = "up";
        this.cooldowns.black = currentTime + 550; // Set 1-second cooldown
      }
    }

    // Other key handling
    if (key === "pink" && entry.position === "down") {
      this.eggs.triggerAnimationForEggIn("orange_egg");
      this.swim.playFBXAnim();
      this.swim.continue = true;
      this.swim.stopIdle();
      this.swim.startSwiming();
    }
    if (key === "pink" && entry.position === "up") {
      this.swim.continue = false;
      setTimeout(() => {
        this.eggs.triggerAnimationForEggOut("orange_egg");
      }, 4000);
    }

    if (key == "red" && entry.position == "down") {
      // spawn a new one every 500ms
      this.alienIntervalSpawn = setInterval(() => {
        this.alien = new Alien(this.scene, this.camera, this.renderer, false);
      }, 800);
    } else if (key == "red" && entry.position == "up") {
      if (this.alienIntervalSpawn) {
        clearInterval(this.alienIntervalSpawn);
      }
    }
    // --------------------------------------------------------------
    if (key == "orange" && entry.position == "down") {
      this.molusk.spawnAnim();
    }
    // --------------------------------------------------------------
    if (key == "blue" && entry.position == "down") {
      // if for each of the fireworks .explosions.length == 0 and .idleState == true
      // then spawnAnim on all three fireworks
      // this.fireworks.spawnAnim();

      // for multiple fireworks
      let allIdle = true;
      this.fireworks.forEach((firework) => {
        if (firework.explosions.length != 0 && firework.idleState == false) {
          allIdle = false;
        }
      });
      if (allIdle) {
        this.fireworks.forEach((firework) => {
          firework.spawnAnim();
        });
      }
    }
    // --------------------------------------------------------------
    if (key == "green" && entry.position == "down") {
      this.eel.spawnAnim();
    } else if (key == "green" && entry.position == "up") {
      this.eel.idleAnim();
    }
  }

  // Initialize the renderer
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    document.body.appendChild(this.renderer.domElement);
  }

  // Initialize the scene
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
  }

  initCreatures() {
    // this.swim = new Swim(this.scene);
    // this.swim.loadSwimFBX().then(() => {
    //   this.swim.startIdle();
    // });
    this.swim = new Swim(this.scene);
    this.teleporter = new Teleporter(this.scene);
    this.teleporter.startIdle();

    this.molusk = new Molusk(this.scene, this.camera, this.renderer);
    this.alien = new Alien(this.scene, this.camera, this.renderer, true);
    this.fireworks = [
      new Fireworks(this.scene, this.camera, this.renderer, true),
      new Fireworks(this.scene, this.camera, this.renderer, false),
      new Fireworks(this.scene, this.camera, this.renderer, false),
    ];
    this.eel = new Eel(this.scene, this.camera, this.renderer);
  }

  // Initialize the camera
  initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const size = 8;
    this.camera = new THREE.OrthographicCamera(
      -size * aspect,
      size * aspect,
      size,
      -size
    );
    // this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  // Initialize the lights
  // Initialize the lights
  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // SpotLight with soft shadows
    const spotLight = new THREE.SpotLight(0xffffff, 400);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.3;
    spotLight.position.set(15, 10, 5);
    spotLight.castShadow = true;
    spotLight.lookAt(0, 0, 0);
    spotLight.shadow.camera.near = 8;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.bias = -0.002;
    spotLight.shadow.radius = 4;
    spotLight.shadow.blurSamples = 8;
    this.scene.add(spotLight);

    // Add helper for SpotLight
    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // this.scene.add(spotLightHelper);

    // Directional Light with soft shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(-10, 7, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.01;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.camera.right = 17;
    dirLight.shadow.camera.left = -17;
    dirLight.shadow.camera.top = 17;
    dirLight.shadow.camera.bottom = -17;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.radius = 9;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.blurSamples = 8;

    // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
    // this.scene.add(dirLightHelper);

    const dirGroup = new THREE.Group();
    dirGroup.add(dirLight);
    this.scene.add(dirGroup);
  }

  // Load multiple models
  loadModels() {
    this.loadModel("./models/hub-mesh.obj");
    // this.loadModel("./models/eggs1.obj");
    this.eggs = new Eggs(this.scene);
    // this.eggs = new Eggs(this.scene, new OBJLoader());
  }

  // Generalized model loading function
  loadModel(modelPath) {
    const loader = new OBJLoader();
    loader.load(
      modelPath,
      (object) => {
        object.position.set(0, 0, 0);
        object.rotation.set(0, -Math.PI / 2, 0);

        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              metalness: 0.1,
              roughness: 0.2,
              reflectivity: 1.0,
            });
          }
        });

        // Check if the model is eggs.obj and add it to the scene and animation targets
        if (modelPath.includes("eggs1.obj")) {
          this.eggs = object; // Store reference for animation

          this.holoMat = new EdgeGlowMaterial();

          this.eggsNames = this.eggs.children.map((child) => child.name);

          console.log(this.eggsNames);
          // this.holoMat.uniforms.edgeIntensity = new THREE.Uniform(10.0);
          // this.holoMat.uniforms.insideTransparency = new THREE.Uniform(0.4);

          object.traverse((child) => {
            if (child.isMesh) {
              child.material = this.holoMat;
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });
        }

        this.scene.add(object);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error(
          `An error occurred while loading the OBJ from ${modelPath}`,
          error
        );
      }
    );
  }

  // Initialize post-processing
  initPostProcessing() {
    this.post = new Post(this.renderer, this.scene, this.camera);
  }

  // Add event listeners
  addEventListeners() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  // Animation loop
  animate() {
    const delta = this.clock.getDelta();
    requestAnimationFrame(this.animate.bind(this));

    // if (this.eggs) {
    //   const time = Date.now() * 0.002; // Time-based oscillation
    //   this.eggs.position.y = Math.sin(time) * 0.1; // Oscillation amplitude of 0.5
    // }

    this.eggs.update();
    this.inManager.loop(delta);
    this.post.update();
    this.post.render();
    this.swim.loop(delta);
    this.teleporter.rotateTeleporter(delta);

    if (this.alien) this.alien.update();
    if (this.molusk) this.molusk.update(delta);
    if (this.fireworks) {
      this.fireworks.forEach((firework) => firework.update(delta));
    }
    if (this.eel) this.eel.update(delta);
  }

  // Handle window resize
  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const size = 8;
    this.camera.left = -size * aspect;
    this.camera.right = size * aspect;
    this.camera.top = size;
    this.camera.bottom = -size;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.post.onWindowResize();
  }

  loadConfig() {
    return new Promise(async (resolve) => {
      let config = {};
      try {
        const response = await fetch("json/Config.json");
        config = await response.json();

        const urlParams = new URLSearchParams(window.location.search);
        const uid = urlParams.get("uid");

        FirebaseConfig.UID = uid || config.UID;
        FirebaseConfig.NAME = config.NAME;
        FirebaseConfig.erase();

        this.otherUIDs = config.OTHERS.map((other) => ({
          name: other.name,
          uid: other.uid,
          title: other.title,
        }));
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration:", error);
      }
      resolve(config);
    });
  }
}
