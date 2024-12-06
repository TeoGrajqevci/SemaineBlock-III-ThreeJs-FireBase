import { gsap } from "gsap";

export default class InputObject {
  constructor(props) {
    this.scene = props.scene;
    this.target = props.target;
    this.mesh = this.target.mesh;
    this.state = this.target.state;
    this.id = this.target.id;
    this.delta = { x: 0, y: 0.2 };
    this.mesh.defaultPositionY = this.mesh.position.y;
    this.init();
  }

  init() {
    this.scene.add(this.mesh);
    this.mesh.rotation.set(0, -Math.PI / 2, 0);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
  }

  onClickHandler(state) {
    this.state = state;
    this.updatePosition();
  }

  updatePosition() {
    const targetY =
      this.state === "down"
        ? this.mesh.defaultPositionY - this.delta.y
        : this.mesh.defaultPositionY;

    gsap.to(this.mesh.position, {
      y: targetY,
      duration: 0.2,
    });
  }

  initProps() {}

  loop(delta) {}
}
