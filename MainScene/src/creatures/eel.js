import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Flow } from "three/examples/jsm/Addons.js";
import { gsap } from "gsap";

export default class Eel {
    // this.geometry
    // this.material
    // this.mesh

    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.DEBUG = false;
        this.ACTION_SELECT = 1;
        this.ACTION_NONE = 0;
        this.action = this.ACTION_NONE;
        this.mouse = new THREE.Vector2();
        this.OUTSIDE_POINTS = [
            {
                x: 1.3642871081175345,
                y: 0.7296739663659482,
                z: 2.790378667886468,
            },
            {
                x: -2.4356335900450077,
                y: 0.5601255410780355,
                z: 2.805797228197785,
            },
            {
                x: -5.084146810698787,
                y: 0.8671183252781771,
                z: 5.185331033722606,
            },
            {
                x: -7.8826385082386965,
                y: -1.3693889250569349,
                z: 4.646319231867761,
            },
            {
                x: -7.581611104496042,
                y: 0.06474759625658155,
                z: 0.6347391727338083,
            },
            {
                x: -4.0433369385276805,
                y: 1.7838720120588123,
                z: -0.6504305908655117,
            },
            {
                x: -4.664112065139149,
                y: -0.08173125406979143,
                z: -5.951616946115654,
            },
            {
                x: -3.7335527176355985,
                y: -1.6730346521643211,
                z: -8.314810689282524,
            },
            {
                x: -0.5264191740781254,
                y: -1.551803410770626,
                z: -8.011016009601441,
            },
            {
                x: 6.6264548903783504,
                y: -0.7438175793285993,
                z: -0.5373473612455965,
            },
            {
                x: 8.172003875298323,
                y: -0.1859793373999632,
                z: -4.481023369412399,
            },
            {
                x: 2.562209973741556,
                y: 0.33678013165752985,
                z: -3.361455893393178,
            },
            {
                x: -0.5470062689163102,
                y: 0.6589361591287655,
                z: -2.8069220691279138,
            },
        ];
        this.IDLE_POINTS = [
            {
                x: -6.8,
                y: 2.3,
                z: 3.2,
            },
            {
                x: -6,
                y: 2.6,
                z: 3.2,
            },
        ];

        this.control = new TransformControls(this.camera, this.renderer.domElement);

        this.createControlPoints(this.OUTSIDE_POINTS, 0);
        this.loadOBJ();
        this.loadOBJ_idle();
        if (this.DEBUG) this.addEventListeners();
    }

    loadOBJ_idle() {
        const loader = new OBJLoader();
        loader.load(
            "models/SAUSAGE_2_COILED.obj",
            (object) => {
                object.position.set(0, 0, 0);
                object.scale.set(1, 1, 1);
                object.rotation.set(0, -Math.PI / 2, 0);

                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.mesh_idle = object;

                // add emissive green material
                const material = new THREE.MeshStandardMaterial({
                    color: 0xe3fce6,
                    emissive: 0xe3fce6,
                    emissiveIntensity: 3,
                    metalness: 1,
                    roughness: 0.5,
                    opacity: 0.0,
                    transparent: true,
                });

                this.mesh_idle.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material = material; // Apply the material
                    }
                });

                this.scene.add(this.mesh_idle);
                this.idleAnim();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            },
            (error) => {
                console.error(`An error occurred while loading the FBX from path`, error);
            }
        );
    }

    loadOBJ() {
        const loader = new OBJLoader();
        loader.load(
            "models/SAUSAGE_2.obj",
            (object) => {
                object.position.set(0, 0, 0);
                object.scale.set(1, 1, 1);
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
                    color: 0xe3fce6,
                    emissive: 0xe3fce6,
                    emissiveIntensity: 3,
                    metalness: 1,
                    roughness: 0.5,
                    opacity: 0.0,
                    transparent: true,
                });

                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material = material; // Apply the material
                    }
                });

                // this.scene.add(this.mesh);
                // this.idleAnim();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            },
            (error) => {
                console.error(`An error occurred while loading the FBX from path`, error);
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
            true,
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
        this.control.addEventListener("dragging-changed", this.controlEvent.bind(this));
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
        if (this.anim) this.anim.kill();

        this.material = new THREE.MeshStandardMaterial({
            color: 0xe3fce6,
            emissive: 0xe3fce6,
            emissiveIntensity: 3,
            metalness: 1,
            roughness: 0.5,
            opacity: 0.0,
            transparent: true,
        });

        // enable shadows and cast
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = this.material;
            }
        });

        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.scale.set(1, 1, 1);

        if (!this.flow) {
            this.flow = new Flow(this.mesh);
        }
        this.flow.updateCurve(0, this.curve);

        this.flow.moveAlongCurve(0.5);

        this.scene.add(this.flow.object3D);

        gsap.to(this.mesh_idle.children[0].material, {
            opacity: 0.0,
            duration: 1,
            ease: "sine.inOut",
            onComplete: () => {
                this.mesh_idle.position.set(100,100,100);
                this.opacityAnim = gsap.to(this.flow.object3D.children[0].material, {
                    opacity: 0.4,
                    duration: 2,
                    ease: "sine.inOut",
                    onUpdate: () => {
                        console.log(this.material.opacity);
                    },
                });
            },
        });
    }

    idleAnim() {
        if (this.opacityAnim) {
            this.opacityAnim.kill();
            gsap.to(this.flow.object3D.children[0].material, {
                opacity: 0.0,
                duration: 1,
                ease: "sine.inOut",
                onComplete: () => {
                    gsap.to(this.mesh_idle.children[0].material, {
                        opacity: 0.4,
                        duration: 1,
                        ease: "sine.inOut",
                    });
                },
            });
        } else {
            gsap.to(this.mesh_idle.children[0].material, {
                opacity: 0.4,
                duration: 1,
                ease: "sine.inOut",
            });
        }

        // make opacity go from 0 to 0.4

        // just going up and down in between the IDLE_POINTS
        this.mesh_idle.position.set(this.IDLE_POINTS[0].x, this.IDLE_POINTS[0].y, this.IDLE_POINTS[0].z);
        this.anim = gsap.to(this.mesh_idle.position, {
            y: this.IDLE_POINTS[1].y,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
        });

        this.mesh_idle.scale.set(0.7, 0.7, 0.7);
    }

    updatePath() {
        // update the curve and add any potential new handles

        this.curve.points = this.curveHandles.map((handle) => handle.position);
        this.points = this.curve.getPoints(50);
        this.line.geometry.setFromPoints(this.points);
        this.flow.updateCurve(0, this.curve);
    }

    update() {
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

        if (this.flow) {
            this.flow.moveAlongCurve(0.001);
        }
    }
}
