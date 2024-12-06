import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { gsap } from "gsap";
import { set } from "firebase/database";

export default class Alien {
  // this.geometry
  // this.material
  // this.mesh

  constructor(scene, camera, renderer, idle) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.t = 0;
    this.idle = idle || false;
    this.DEBUG = false;
    this.ACTION_SELECT = 1;
    this.ACTION_NONE = 0;
    this.action = this.ACTION_NONE;
    this.mouse = new THREE.Vector2();
    this.OUTSIDE_POINTS = [
      {
        x: 7.179216131128689,
        y: 2.191742990349348,
        z: -0.9881236473620398,
      },
      {
        x: 1.3718345719879679,
        y: 4.111845156723977,
        z: 10.800491947705474,
      },
      {
        x: -9.487570242899405,
        y: 0.8671183252781771,
        z: 9.414937841139816,
      },
      {
        x: -12.589553644868895,
        y: -3.5548700525766597,
        z: 5.2109377545938536,
      },
      {
        x: -9.281663736211655,
        y: 2.5215185836423597,
        z: 1.8626118089448123,
      },
      {
        x: -2.3313048224541584,
        y: 8.84970977682173,
        z: 0.04813499333407889,
      },
      {
        x: -7.16832916030908,
        y: -1.8171444644364065,
        z: -9.524931947058363,
      },
      {
        x: -1.4963194235236192,
        y: 3.32280550838337,
        z: -10.116417715760003,
      },
      {
        x: 0.869288707924919,
        y: 9.740285792317971,
        z: -3.422642538039542,
      },
      {
        x: 0.4078940775186204,
        y: 7.708086715117983,
        z: 4.0519062391955165,
      },
      {
        x: 6.304407406046179,
        y: 7.178816117866072,
        z: 5.9233047544688695,
      },
      {
        x: 2.493595975713263,
        y: 2.4077958735327076,
        z: 0.9791814066710469,
      },
      {
        x: 7.059897539510713,
        y: 2.2018212020632926,
        z: -1.1013935420579695,
      },
    ];
    this.IDLE_POINTS = [
      {
        x: 6.452304242902254,
        y: 1.7,
        z: -3.2011683166854473,
      },
      {
        x: 6.452304242902254,
        y: 2,
        z: -3.2011683166854473,
      },
    ];
    // 3 STATES; IDLE, OUTSIDE, LOOP, INSIDE
    this.state = "IDLE";
    this.previousState = "IDLE";

    this.control = new TransformControls(this.camera, this.renderer.domElement);

    this.createControlPoints(this.IDLE_POINTS);
    this.loadOBJ();
    if (this.DEBUG) this.addEventListeners();
  }

  loadOBJ() {
    const loader = new OBJLoader();
    loader.load(
      "models/UFO_1.obj",
      (object) => {
        object.position.set(0, 0, 0);
        object.scale.set(0.1, 0.1, 0.1);
        object.rotation.set(0, -Math.PI / 2, 0);

        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.mesh = object;

        // add emissive green material
        const emissiveColor = new THREE.Color(0x00ffaa);
        const material = new THREE.MeshStandardMaterial({
          color: 0xffb8b3,
          emissive: emissiveColor,
          emissiveIntensity: 0,
          metalness: 0.0,
          roughness: 0.1,
        });

        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = material; // Apply the material
          }
        });

        this.scene.add(this.mesh);
        this.idleAnim();
        if (!this.idle) this.spawnAnim();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error(
          `An error occurred while loading the OBJ from path`,
          error
        );
      }
    );
  }

  createControlPoints(POINTS, randomAmount = 0) {
    const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const boxMaterial = new THREE.MeshBasicMaterial();

    // delete all curveHandles from scene
    if (this.curveHandles) {
      this.curveHandles.forEach((handle) => this.scene.remove(handle));
    }

    this.curveHandles = [];

    // offset the points by a random amount
    if (randomAmount) {
      POINTS = POINTS.map((point) => {
        return new THREE.Vector3(
          point.x + Math.random() * randomAmount,
          point.y + Math.random() * randomAmount,
          point.z + Math.random() * randomAmount
        );
      });
    }

    POINTS.forEach((point) => {
      const handle = new THREE.Mesh(boxGeometry, boxMaterial);
      handle.position.copy(point);
      handle.scale.set(4, 4, 4);
      this.curveHandles.push(handle);
    });

    if (this.DEBUG) {
      this.curveHandles.forEach((handle) => this.scene.add(handle));
    }

    this.curve = new THREE.CatmullRomCurve3(
      this.curveHandles.map((handle) => handle.position),
      false,
      "centripetal"
    );

    this.points = this.curve.getPoints(50);

    // remove the line if it exists
    if (this.line) this.scene.remove(this.line);

    this.line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(this.points),
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );

    if (this.DEBUG) this.scene.add(this.line);
  }

  addEventListeners() {
    window.addEventListener("click", this.onClickHandler.bind(this));
    this.control.addEventListener(
      "dragging-changed",
      this.controlEvent.bind(this)
    );
  }

  controlEvent(event) {
    if (!event.value) {
      this.updatePath();
    }
  }

  onClickHandler(ev) {
    this.action = this.ACTION_SELECT;
    this.mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  }

  spawnAnim() {
    // stop animation
    if (this.anim) this.anim.kill();

    this.createControlPoints(this.OUTSIDE_POINTS, 2);
    this.updatePath();

    let randomEase = ["power1.inOut", "power2.inOut", "expo.inOut"];
    let randomEaseIndex = Math.floor(Math.random() * randomEase.length);

    // reset the t value
    this.t = 0;
    // animate the movement
    this.anim = gsap.to(this, {
      t: 1,
      duration: 15,
      ease: randomEase[randomEaseIndex],
      onUpdate: () => {
        const points = this.curve.getPointAt(this.t);
        this.mesh.position.copy(points);
      },
      onStart: () => {
        setTimeout(() => {
          // scale the mesh down to 0
          gsap.to(this.mesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1,
            ease: "power2.in",
          });
        }, 12000);
      },
    });

    // rotate the mesh with gsap
    this.rotateAnim();
  }

  idleAnim() {
    // stop animation if it exists
    if (this.anim) this.anim.kill();

    this.createControlPoints(this.IDLE_POINTS);
    this.updatePath();

    this.t = 0;
    // animate the movement
    this.anim = gsap.to(this, {
      t: 1,
      duration: 2,
      ease: "sine.inOut",
      onUpdate: () => {
        const points = this.curve.getPointAt(this.t);
        this.mesh.position.copy(points);
      },
      yoyo: true,
      repeat: -1,
    });
  }

  rotateAnim() {
    // rotate the mesh
    gsap.to(this.mesh.rotation, {
      y: Math.PI * 2,
      z: -Math.PI * 2,
      duration: 4,
      ease: "linear",
      yoyo: true,
      repeat: -1,
    });
  }

  updatePath() {
    // update the curve and add any potential new handles

    this.curve.points = this.curveHandles.map((handle) => handle.position);
    this.points = this.curve.getPoints(50);
    this.line.geometry.setFromPoints(this.points);
  }

  update(delta) {
    if (this.state != this.previousState) {
      console.log("STATE CHANGED TO", this.state);
    }

    // update emissive with sin wave

    if (this.mesh) {
      // this.mesh.traverse((child) => {
      //     if (child.isMesh && child.material) {
      //         const material = child.material;
      //         material.emissiveIntensity = Math.sin(this.t * Math.PI * 2) * 2 + 2;
      //     }
      // });
    }

    // rotate the mesh
    // this.mesh.rotation.y += 0.01;
    // this.mesh.rotation.z += 0.01;

    if (this.action === this.ACTION_SELECT && this.DEBUG) {
      const raycaster = new THREE.Raycaster();

      raycaster.setFromCamera(this.mouse, this.camera);
      this.action = this.ACTION_NONE;
      const intersects = raycaster.intersectObjects(this.curveHandles, false);
      if (intersects.length) {
        const target = intersects[0].object;
        this.control.attach(target);
        this.scene.add(this.control.getHelper());
      }
    }

    // if (this.state === "IDLE") {
    //     console.log("IDLE");
    // }

    // if (this.state === "OUTSIDE") {
    //     console.log("OUTSIDE");
    // }

    // if (this.state === "LOOP") {
    //     console.log("LOOP");
    // }

    // if (this.state === "INSIDE") {
    //     console.log("INSIDE");
    // }

    this.previousState = this.state;
  }
}
