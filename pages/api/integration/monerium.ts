import { Server } from 'Socket.IO';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Socket } from 'socket.io-client';

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  let io = res?.socket?.server?.io;
  console.log('-----------');
  console.log('-----------');
  console.log('-----------', req?.query?.code);
  console.log('-----------', req?.query?.code);
  console.log('-----------', req?.query?.code);
  if (io) {
    console.log('Socket is already running');
    if (req?.query?.code) {
      io.emit('code', req?.query?.code);
    }
  } else {
    console.log('Socket is initializing');
    io = new Server(res.socket.server);
    res.socket.server.io = io;
    // io.on('connection', (socket) => {
    //   socket.emit('code', req?.query?.code);
    //   socket.on('ping', (count) => {
    //     console.log(count);
    //   });
    // });
  }

  res.end();
  // res.redirect('/');
};

export default SocketHandler;
