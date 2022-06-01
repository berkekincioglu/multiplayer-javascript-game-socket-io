import express from 'express';
import http, { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
app.use(cors());
app.use(express.static(path.join(__dirname, '../client/')));
console.log(__dirname);



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(9000, () => {
  console.log('Server is running on port 9000');
});


app.use(cors());

const clients = {};
const games = {};
let players = {};

const io = new Server(httpServer, {
  cors: {
    // origin: 'http://127.0.0.1:5500',
    origin: 'http://localhost:9000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.emit('ServerToClient', 'HelloServer');
  socket.on('ClientToServer', (data) => {
    console.log(data);
  });
  socket.on('message', (data) => {
    // recevie message from client
    let error = '';
    const result = JSON.parse(data);

    if (result.method === 'create') {
      const clientId = result.clientId;
      console.log(result);
      const gameId = uuidv4();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };
      const payload = {
        method: 'create',
        game: games[gameId],
        clientId: clientId,
      };
      const connection = clients[clientId].connection;
      connection.emit('message', JSON.stringify(payload));
    }
    if (result.method === 'join') {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      // if (!game) return;
      // if (game.clients.length >= 3) {
      //   console.log('max player limit reached');
      //   return;
      // }

      let color;
      if (game.clients.length === null) {
        console.log('game is empty');
      }

      switch (game.clients.length) {
        case 0:
          color = 'red';
          break;
        case 1:
          color = 'blue';
          break;
        case 2:
          color = 'green';
          break;
        default:
          break;
      }
      game.clients.push({
        clientId,
        color,
      });

      if (game.clients.length === 3) updateGameState();

      const payload = {
        method: 'join',
        game,
        clients: game.clients,
      };
      game.clients.forEach((client) => {
        const connection = clients[client.clientId].connection;
        connection.emit('message', JSON.stringify(payload));
      });
      console.log('Successfully joined game', gameId);
      console.log(game.clients);
    }

    if (result.method === 'play') {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      let state = games[gameId].state;
      if (!state) state = {};

      state[ballId] = color;
      games[gameId].state = state;
    }
  });

  // generate a new client id
  const clientId = uuidv4();

  clients[clientId] = {
    connection: socket,
  };

  const payload = {
    method: 'connect',
    clientId: clientId,
  };
  //   send back client connect
  socket.emit('message', JSON.stringify(payload));
});

function updateGameState() {
  //{"gameid", uuid }
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payload = {
      method: 'update',
      game
    };

    game.clients.forEach((client) => {
      clients[client.clientId].connection.send(JSON.stringify(payload));
    });
  }

  setTimeout(updateGameState, 500);
}

httpServer.listen(3000);
