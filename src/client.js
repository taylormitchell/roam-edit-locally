if (window.socket) {
  window.socket.close();
}
var socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("open", () => {
  console.log("Connection to server established!");
  socket.send("Hello server");
});

socket.addEventListener("close", () => {
  console.log("Connection to server closed");
});

// Acknowledge messages from the server
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.log("Received message from server: ", data);
});

// Evaluate code blocks
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  data.files?.forEach((file) => {
    if (file.type === "code") {
      console.log("Evaluating code block: ", file);
      eval(file.content);
    }
  });
});
