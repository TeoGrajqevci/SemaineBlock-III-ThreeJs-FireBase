import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { gsap } from "gsap";

export default class Fireworks {
  // this.geometry
  // this.material
  // this.mesh

  constructor(scene, camera, renderer, showAtStart) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.t = 0;
    this.showAtStart = showAtStart;
    this.idleState = false;
    this.tangentDebug = new THREE.Line();
    this.finishedLoading = false;
    this.DEBUG = false;
    this.ACTION_SELECT = 1;
    this.ACTION_NONE = 0;
    this.action = this.ACTION_NONE;
    this.keepSpawning = false;
    this.animationDone = true;
    this.particlesPerExplosion = 200;
    this.mouse = new THREE.Vector2();
    this.popTime = 0.5 + Math.random() * 0.5;
    this.OUTSIDE_POINTS = [
      {
        x: -2.355655837245828,
        y: 1.9353848546180035,
        z: -6.796103747685213,
      },
      {
        x: -1.5228302520826382,
        y: 4.001254284937704,
        z: -2.467848076079303,
      },
      {
        x: -3.6249053646307416,
        y: 7.014994380540073,
        z: 0.5270626660881748,
      },
      {
        x: -2.6003396040132363,
        y: 4.323697138337579,
        z: 2.390163786205681,
      },
      {
        x: -8.638541421319768,
        y: 0,
        z: 7.671814710969611,
      },
      {
        x: -10.045945011740676,
        y: -4.219760006623659,
        z: 1.8519100093990035,
      },
      {
        x: 1.300026015342706,
        y: -4.943162460544668,
        z: 1.3065430291108644,
      },
      {
        x: 10,
        y: -3.6728494664463103,
        z: 0,
      },
      {
        x: 10,
        y: 3.0940030087639903,
        z: 0,
      },
      {
        x: 0.9561430033507925,
        y: 1.6765192089142005,
        z: 0.0015726565230607115,
      },
    ];
    this.IDLE_POINTS = [
      {
        x: -2.3467020091270894,
        y: 1.5,
        z: -6.802083354326385,
      },
      {
        x: -2.3467020091270894,
        y: 1.8,
        z: -6.802083354326385,
      },
    ];
    // 3 STATES; IDLE, OUTSIDE, LOOP, INSIDE
    this.state = "IDLE";
    this.previousState = "IDLE";

    this.control = new TransformControls(this.camera, this.renderer.domElement);

    if (this.DEBUG) this.addEventListeners();
    this.createControlPoints(this.IDLE_POINTS, 0);
    this.loadOBJ();
  }

  loadOBJ() {
    const loader = new OBJLoader();
    loader.load(
      "models/FIREWORKS2.obj",
      (object) => {
        object.position.set(0, 0, 0);
        object.scale.set(0.3, 0.3, 0.3);
        object.rotation.set(0, -Math.PI / 2, 0);

        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const baseMesh = object;

        // add emissive green material
        const emissiveColor = new THREE.Color(0x2474ff);
        const material = new THREE.MeshStandardMaterial({
          color: 0xdbe8ff,
          emissive: emissiveColor,
          emissiveIntensity: 0.2,
          metalness: 0,
          roughness: 0.1,
        });

        baseMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = material; // Apply the material
          }
        });

        if (!this.explosions) this.explosions = [];

        this.mesh = new THREE.Group();

        // particles
        //------------------------------------------------------------------------
        //------------------------------------------------------------------------

        this.mesh.add(baseMesh);

        this.finishedLoading = true;

        this.scene.add(this.mesh);
        this.idleAnim();
        this.idleState = true;
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

  createNewExplosion() {
    this.boundingBox = {
      width: 4,
      height: 4,
      depth: 4,
    };

    const center = new THREE.Vector3(
      (Math.random() - 0.5) * this.boundingBox.width * 0.5,
      (Math.random() - 0.5) * this.boundingBox.height * 0.5,
      (Math.random() - 0.5) * this.boundingBox.depth * 0.5
    );
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(this.particlesPerExplosion * 3);
    const colors = new Float32Array(this.particlesPerExplosion * 3);
    const velocities = [];

    // Random color for this explosion
    const explosionColor = new THREE.Color();
    explosionColor.setHSL(Math.random(), 1, 0.5);

    for (let i = 0; i < this.particlesPerExplosion; i++) {
      const i3 = i * 3;

      // Set initial position at explosion center
      particlePositions[i3] = center.x;
      particlePositions[i3 + 1] = center.y;
      particlePositions[i3 + 2] = center.z;

      // Random velocity in sphere
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      velocities.push(velocity);

      // Set particle color with slight variation
      // const hue = explosionColor.getHSL({}).h + (Math.random() - 0.5) * 0.1;
      // const color = new THREE.Color().setHSL(hue, 1, 0.5);
      // set blue hues
      const hue = 0.6 + (Math.random() - 0.5) * 0.1;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 3,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(particleGeometry, particleMaterial);
    points.userData.velocities = velocities;
    points.userData.age = 0;
    points.userData.lifetime = 2 + Math.random(); // Random lifetime between 2-3 seconds
    points.userData.center = center;
    this.explosions.push(points);
    if (this.mesh) this.mesh.add(points);
  }

  createControlPoints(POINTS, randomAmount = 0) {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshBasicMaterial();

    // delete all curveHandles from scene
    if (this.curveHandles) {
      this.curveHandles.forEach((handle) => this.scene.remove(handle));
    }

    this.curveHandles = [];

    // offset the points by a random amount
    if (randomAmount) {
      POINTS = POINTS.map((point, index) => {
        if (index != 0) {
          return new THREE.Vector3(
            point.x + Math.random() * randomAmount,
            point.y + Math.random() * randomAmount,
            point.z + Math.random() * randomAmount
          );
        } else {
          return new THREE.Vector3(point.x, point.y, point.z);
        }
      });
    }

    console.log(POINTS);

    POINTS.forEach((point) => {
      const handle = new THREE.Mesh(boxGeometry, boxMaterial);
      handle.position.copy(point);
      handle.scale.set(0.2, 0.2, 0.2);
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
    this.idleState = false;
    // stop animation
    if (this.anim) this.anim.kill();

    this.createControlPoints(this.OUTSIDE_POINTS, 10);
    this.updatePath();

    this.animationDone = false;

    console.log(this);
    // reset the t value
    this.t = 0;
    // animate the movement
    this.anim = gsap.to(this, {
      t: 1,
      duration: 2,
      ease: "sine.in",
      onUpdate: () => {
        const points = this.curve.getPointAt(this.t);
        this.mesh.position.copy(points);
      },
      onComplete: () => {
        let interval = setInterval(() => {
          this.createNewExplosion();
          this.createNewExplosion();
          this.createNewExplosion();
          this.createNewExplosion();
          this.createNewExplosion();
          this.createNewExplosion();
        }, 50);

        // find .isMesh = true
        console.log(this.mesh.children);
        let fireworkMesh = this.mesh.children.find((child) => child.isGroup);
        console.log(fireworkMesh);
        // array of scales
        let scale_ = { scale: fireworkMesh.scale.x };
        // scale the mesh down to 0
        gsap.to(scale_, {
          scale: 0,
          duration: 1,
          ease: "expo.out",
          onUpdate: () => {
            fireworkMesh.scale.set(scale_.scale, scale_.scale, scale_.scale);
          },
          onComplete: () => {
            this.animationDone = true;
            clearInterval(interval);
          },
        });
      },
    });

    // rotate the mesh with gsap
    // this.rotateAnim();
  }

  idleAnim() {
    // stop animation if it exists
    if (this.anim) this.anim.kill();

    this.createControlPoints(this.IDLE_POINTS, 0);
    this.updatePath();

    if (!this.showAtStart) {
      console.log("HIDING");
      this.mesh.position.set(1000, 1000, 1000);
    }

    this.animationDone = false;

    this.t = 0;
    // animate the movement

    if (this.showAtStart) {
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

  update() {
    if (this.state != this.previousState) {
      console.log("STATE CHANGED TO", this.state);
    }

    if (this.finishedLoading) {
      // if the mesh is not loaded yet, return

      if (this.action === this.ACTION_SELECT && this.DEBUG) {
        console.log("SELECTING");
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

      // make sure the firework is pointing towards the path

      if (this.curve) {
        if (this.tangentDebug) this.scene.remove(this.tangentDebug);
        const tangent = this.curve.getTangentAt(this.t).normalize();
        const axis = new THREE.Vector3(0, 1, 0);
        const angle = Math.acos(tangent.dot(axis));
        const quaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3().crossVectors(axis, tangent).normalize(),
          angle
        );
        this.mesh.children
          .find((child) => child.isGroup)
          .quaternion.copy(quaternion);
      }

      this.updateParticles();
    }
  }

  updateParticles() {
    // Chance to create new explosion
    // if (Math.random() < 0.05) {
    //     // 2% chance each frame
    //     this.createNewExplosion();
    // }

    if (this.explosions.length == 0 && this.animationDone) {
      // // remove the mesh from the scene
      this.scene.remove(this.mesh);
      // // create a new mesh
      this.loadOBJ();
      // // play the idle animation
      this.idleAnim();
    }

    // Update each explosion
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      if (i == 1) {
        // console.log(this.explosions[i].userData);
      }
      const explosion = this.explosions[i];
      const positions = explosion.geometry.attributes.position.array;
      const velocities = explosion.userData.velocities;

      // Update age
      explosion.userData.age += 0.016; // Approximate for 60fps - TODO MAKE FPS INDEPENDANT
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
        // positions[j3] = THREE.MathUtils.clamp(
        //     positions[j3],
        //     -this.boundingBox.width / 2,
        //     this.boundingBox.width / 2
        // );
        // positions[j3 + 1] = THREE.MathUtils.clamp(
        //     positions[j3 + 1],
        //     -this.boundingBox.height / 2,
        //     this.boundingBox.height / 2
        // );
        // positions[j3 + 2] = THREE.MathUtils.clamp(
        //     positions[j3 + 2],
        //     -this.boundingBox.depth / 2,
        //     this.boundingBox.depth / 2
        // );
      }

      // Fade out based on age
      explosion.material.opacity = 1 - ageRatio;

      // Remove if lifetime exceeded
      if (explosion.userData.age >= explosion.userData.lifetime) {
        this.mesh.remove(explosion);
        this.explosions.splice(i, 1);
        explosion.geometry.dispose();
        explosion.material.dispose();
      }

      explosion.geometry.attributes.position.needsUpdate = true;
    }
  }
}
