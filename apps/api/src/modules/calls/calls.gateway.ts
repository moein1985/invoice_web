import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface CallStartPayload {
  callId: string;
  customerId: string;
  customerName: string;
  phoneNumber: string;
  direction: 'incoming' | 'outgoing';
}

interface CallEndPayload {
  callId: string;
  duration: string;
  status: 'answered' | 'missed' | 'busy' | 'failed';
}

interface CallStatusPayload {
  callId: string;
  status: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CallsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('call:start')
  handleCallStart(
    @MessageBody() data: CallStartPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to all connected clients except sender
    client.broadcast.emit('call:started', data);
    return { success: true, message: 'Call started' };
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @MessageBody() data: CallEndPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to all connected clients except sender
    client.broadcast.emit('call:ended', data);
    return { success: true, message: 'Call ended' };
  }

  @SubscribeMessage('call:status')
  handleCallStatus(
    @MessageBody() data: CallStatusPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to all connected clients except sender
    client.broadcast.emit('call:status-changed', data);
    return { success: true, message: 'Status updated' };
  }

  // Method to emit events from service
  emitCallStart(data: CallStartPayload) {
    this.server.emit('call:started', data);
  }

  emitCallEnd(data: CallEndPayload) {
    this.server.emit('call:ended', data);
  }

  emitCallStatus(data: CallStatusPayload) {
    this.server.emit('call:status-changed', data);
  }
}
