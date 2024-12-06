import FirebaseConfig from "../../FirebaseConfig";
import inputInteractionsManager from "./InputInteractionsManager";
import InputObject from "./InputObject";
import { preloadInputs } from "./preloadInputs";

export default class InputManager {
  constructor(props) {
    this.props = props;
    this.targetDescriptors = props.targetDescriptors;
    this.inputObjects = [];
    this.inputsClasses = [];
    this.preloadObjects();
  }

  preloadObjects() {
    preloadInputs("./models/buttons.obj").then((data) => {
      this.inputObjects = data;
      this.init();
    });
  }

  init() {
    this.defineIdOfObjects();
    this.createInputObjects();
    this.initListeners();
  }

  defineIdOfObjects() {
    this.inputObjects.forEach((button, i) => {
      const num = button.name.slice(-1);
      const id = this.targetDescriptors.OTHERS[num - 1].uid;
      this.inputObjects[i].id = id;
    });
  }

  initListeners() {
    inputInteractionsManager({
      targets: this.inputObjects,
      _callback: this.onClickHandler.bind(this),
      ...this.props,
    });
  }
  onClickHandler(idButton) {
    this.inputsClasses.forEach((input, index) => {
      if (input.id === idButton) {
        const state = this.inputObjects[index].state;
        this.inputObjects[index].state = state === "up" ? "down" : "up";
        input.onClickHandler(this.inputObjects[index].state);
        this.sendDatasToFirebase(idButton, this.inputObjects[index].state);
      }
    });
  }

  sendDatasToFirebase(id, state) {
    FirebaseConfig.sendData(
      FirebaseConfig.DEFAULT_PATH + "/" + FirebaseConfig.UID,
      {
        target: id,
        name: FirebaseConfig.NAME,
        date: Date.now(),
        position: state,
      }
    );
  }

  createInputObjects() {
    this.inputObjects.forEach((inputObject) => {
      this.inputsClasses.push(
        new InputObject({ ...this.props, target: inputObject })
      );
    });
  }

  loop(delta) {
    this.inputsClasses.forEach((input) => {
      input.loop(delta);
    });
  }
}
