const socket = io("http://localhost:3000");
let clientId = "";
let gameId = "";
let clientLength = 0;
let playerColor = "";

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const gameIdInput = document.getElementById("gameId");
const gameIdText = document.getElementById("gameIdText");
const messages = document.getElementById("gameIdText");
const divBoard = document.getElementById("divBoard");
const divPlayers = document.getElementById("divPlayers");
// const playerNames = document.getElementById("playerNames");

let seconds = 10,
  stop = 0,
  counterStarted = false,
  counter;
// function countdown() {
//   if (counterStarted === false) {
//     counterStarted = true;
//     counter = setInterval(function () {
//       if (seconds >= stop) {
//         document.getElementById('timer').innerHTML = seconds;
//         seconds--;
//       } else {
//         clearInterval(counter);
//         counterStarted = false;
//         seconds = 0;
//       }
//     }, 1000);
//   }
// }

btnJoin.addEventListener("click", () => {
  if (clientLength >= 3) {
    const failed = document.createElement("p");
    failed.innerText = "Game is full";
    messages.appendChild(failed);
    return;
  }

  if (!gameIdInput.value && !gameId) {
    const failed = document.createElement("p");

    failed.innerHTML = "Game does not exist";
    messages.appendChild(failed);
    setTimeout(() => {
      failed.remove();
    }, 1000);
  } else {
    gameId = gameIdInput.value.trim();
    const payload = {
      method: "join",
      gameId,
      clientId,
    };
    // countdown();
    socket.emit("message", JSON.stringify(payload));
  }
});

btnCreate.addEventListener("click", () => {
  console.log("btn clientId", clientId);
  //   gameIdText.innerText = gameId;

  const payload = {
    method: "create",
    clientId: clientId,
  };
  socket.emit("message", JSON.stringify(payload));
});
//  Server - client connection

socket.on("ServerToClient", (data) => {
  console.log(data);
});

socket.on("message", (data) => {
  const response = JSON.parse(data);

  if (response.method === "connect") {
    clientId = response.clientId;
    console.log("client id set successfully ", clientId);
  }
  if (response.method === "create") {
    gameId = response.game.id;
    gameIdText.innerText = "Game ID: " + gameId;
    console.log(
      "game is created game id :  ",
      response.game.id,
      "ball : ",
      response.game.balls
    );
  }

  if (response.method === "update") {
    //{1: "red", 1}
    if (!response.game.state) return;
    for (const b of Object.keys(response.game.state)) {
      // console.log("B", b);
      const color = response.game.state[b];
      const ballObject = document.getElementById("ball" + b);
      ballObject.style.backgroundColor = color;
      ballObject.style.borderRadius = "50%";
    }
  }

  if (response.method === "join") {
    const game = response.game;
    clientLength = game.clients.length;

    console.log(game.clients);
    if (game.clients.length > 3) {
      const failed = document.createElement("p");
      failed.innerText = "Game is full";
      messages.appendChild(failed);
      return;
    }

    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);
    game.clients.forEach((c) => {
      const d = document.createElement("div");
      d.style.width = "200px";
      d.style.background = c.color;
      d.textContent = c.clientId;
      d.style.margin = "10px";
      d.style.padding = "10px";
      d.style.borderRadius = "10px";
      d.style.fontSize = "20px";
      d.style.textAlign = "center";
      d.style.color = "white";


      divPlayers.appendChild(d);

      if (c.clientId === clientId) playerColor = c.color;
    });

    while (divBoard.firstChild) divBoard.removeChild(divBoard.firstChild);

    for (let i = 0; i < game.balls; i++) {
      const b = document.createElement("button");
      b.id = "ball" + (i + 1);
      b.tag = i + 1;
      b.textContent = i + 1;
      b.style.width = "150px";
      b.style.margin = "10px";
      b.style.borderRadius = "10px";
      b.style.backgroundColor = "white";
      b.style.border = "1px solid black";
      b.style.fontSize = "20px";
      b.style.fontWeight = "bold";
      b.style.color = "black";
      b.style.textAlign = "center";
      b.style.cursor = "pointer";
      b.style.height = "150px";
      b.addEventListener("click", (e) => {
        b.style.background = playerColor;
        const payload = {
          method: "play",
          clientId,
          gameId,
          ballId: b.tag,
          color: playerColor,
        };
        socket.emit("message", JSON.stringify(payload));
      });
      divBoard.appendChild(b);
    }

    console.log("join game id : ", game.id);
    const success = document.createElement("h4");
    success.innerText = "Successfully joined game, game id : " + game.id;
    messages.appendChild(success);
    console.log(response.clients);
  }
});

socket.emit("ClientToServer", "HelloClient");
