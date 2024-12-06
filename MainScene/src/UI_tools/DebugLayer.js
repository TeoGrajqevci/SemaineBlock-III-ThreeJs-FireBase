/**
 * Classe qui crée et gère une couche de débogage flottante
 * Affiche les messages Firebase en temps réel
 */
export default class DebugLayer {
  constructor() {
    this.messages = [];
    this.maxMessages = 10;
    this.isVisible = false;
    this.createDebugPanel();
    this.setupDraggable();
    this.hide();
  }

  /**
   * Crée le panneau de débogage
   */
  createDebugPanel() {
    // Création du conteneur principal
    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      position: "fixed",
      top: "20px",
      left: "20px",
      width: "300px",
      maxHeight: "400px",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "#fff",
      padding: "10px",
      borderRadius: "5px",
      fontFamily: "monospace",
      fontSize: "12px",
      cursor: "move",
      overflow: "auto",
      zIndex: "1000",
      userSelect: "none",
    });

    // Création de la barre de titre
    this.titleBar = document.createElement("div");
    Object.assign(this.titleBar.style, {
      padding: "5px",
      marginBottom: "10px",
      borderBottom: "1px solid #444",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    });

    // Create title and buttons container
    const titleSpan = document.createElement("span");
    titleSpan.textContent = "Firebase Debug";

    const buttonsContainer = document.createElement("div");
    Object.assign(buttonsContainer.style, {
      display: "flex",
      gap: "5px",
    });

    // Clear button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    Object.assign(clearButton.style, {
      backgroundColor: "#444",
      color: "#fff",
      border: "none",
      padding: "2px 8px",
      borderRadius: "3px",
      cursor: "pointer",
      fontSize: "11px",
    });
    clearButton.onclick = () => this.clearMessages();

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    Object.assign(closeButton.style, {
      backgroundColor: "#444",
      color: "#fff",
      border: "none",
      padding: "2px 8px",
      borderRadius: "3px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
    });
    closeButton.onclick = () => this.hide();

    // Add hover effect to buttons
    [clearButton, closeButton].forEach((button) => {
      button.onmouseover = () => {
        button.style.backgroundColor = "#555";
      };
      button.onmouseout = () => {
        button.style.backgroundColor = "#444";
      };
    });

    // Assemble the title bar
    buttonsContainer.appendChild(clearButton);
    buttonsContainer.appendChild(closeButton);
    this.titleBar.appendChild(titleSpan);
    this.titleBar.appendChild(buttonsContainer);

    // Create reopen button (initially hidden)
    this.reopenButton = document.createElement("button");
    Object.assign(this.reopenButton.style, {
      position: "fixed",
      top: "20px",
      left: "20px",
      padding: "5px 10px",
      backgroundColor: "#444",
      color: "#fff",
      border: "none",
      borderRadius: "3px",
      cursor: "pointer",
      zIndex: "1000",
      display: "none",
    });
    this.reopenButton.textContent = "Show Debug";
    this.reopenButton.onclick = () => this.show();
    // document.body.appendChild(this.reopenButton);

    // Conteneur pour les messages
    this.messagesContainer = document.createElement("div");

    // Assemblage des éléments
    this.container.appendChild(this.titleBar);
    this.container.appendChild(this.messagesContainer);
    document.body.appendChild(this.container);
  }

  /**
   * Configure la fonctionnalité de glisser-déposer
   */
  setupDraggable() {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    this.titleBar.onmousedown = (e) => {
      isDragging = true;
      initialX = e.clientX - this.container.offsetLeft;
      initialY = e.clientY - this.container.offsetTop;
    };

    document.onmousemove = (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Limites de la fenêtre
        const maxX = window.innerWidth - this.container.offsetWidth;
        const maxY = window.innerHeight - this.container.offsetHeight;

        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        this.container.style.left = `${currentX}px`;
        this.container.style.top = `${currentY}px`;
      }
    };

    document.onmouseup = () => {
      isDragging = false;
    };
  }

  /**
   * Ajoute un nouveau message
   * @param {Object} data - Données à afficher
   */
  addMessage(data) {
    if (!this.isVisible) return;

    const messageDiv = document.createElement("div");
    Object.assign(messageDiv.style, {
      padding: "5px",
      borderBottom: "1px solid #333",
      wordWrap: "break-word",
    });

    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
      <div style="color: #888;">${timestamp}</div>
      <pre style="margin: 5px 0; color: #4CAF50;">${JSON.stringify(
        data,
        null,
        2
      )}</pre>
    `;

    this.messagesContainer.insertBefore(
      messageDiv,
      this.messagesContainer.firstChild
    );
    this.messages.push(messageDiv);

    // Limite le nombre de messages
    if (this.messages.length > this.maxMessages) {
      const oldestMessage = this.messages.shift();
      this.messagesContainer.removeChild(oldestMessage);
    }
  }

  /**
   * Efface tous les messages
   */
  clearMessages() {
    this.messages = [];
    this.messagesContainer.innerHTML = "";
  }

  /**
   * Hide the debug panel and show the reopen button
   */
  hide() {
    this.isVisible = false;
    this.container.style.display = "none";
    this.reopenButton.style.display = "block";
  }

  /**
   * Show the debug panel and hide the reopen button
   */
  show() {
    this.isVisible = true;
    this.container.style.display = "block";
    this.reopenButton.style.display = "none";
  }
}
