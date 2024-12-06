import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

/**
 * Classe gérant la configuration et les interactions Firebase
 * Permet d'initialiser Firebase et de gérer les événements de la base de données en temps réel
 */
class FirebaseConfig {
  constructor() {
    // Configuration Firebase
    console.log("init firebase");
    this.config = {
      apiKey: "AIzaSyCaUeYpOERJAnWfMgUXwqO6bL3-hVqc4e8",
      authDomain: "chain-reaction-50d52.firebaseapp.com",
      databaseURL:
        "https://chain-reaction-50d52-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "chain-reaction-50d52",
      storageBucket: "chain-reaction-50d52.firebasestorage.app",
      messagingSenderId: "1096997571222",
      appId: "1:1096997571222:web:c38d34d1fb5f10d003d0b7",
    };

    // Initialisation de Firebase
    this.app = initializeApp(this.config);
    this.database = getDatabase(this.app);

    this.DEFAULT_PATH = "connections_black";
  }

  /**
   * Envoie des données à Firebase
   * @param {string} path - Chemin dans la base de données
   * @param {any} data - Données à envoyer
   */
  sendData(path, data) {
    const reference = ref(this.database, path);
    set(reference, data);
  }

  /**
   * Écoute les changements de données à un chemin spécifique
   * @param {string} path - Chemin dans la base de données
   * @param {Function} callback - Fonction appelée lors des changements
   */
  listenToData(path, callback) {
    const reference = ref(this.database, path);
    onValue(reference, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
  }

  set sourceUID(UID) {
    this.UID = UID;
  }

  reset() {
    this.sendData(this.DEFAULT_PATH + this.UID, null);
  }

  erase() {
    this.sendData(this.DEFAULT_PATH, null);
  }
}
export default new FirebaseConfig();
