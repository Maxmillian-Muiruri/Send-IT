import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface TrackingData {
  courierId: string;
  parcelId: string;
  latitude: number;
  longitude: number;
  status: string;
  timestamp: Date;
}

interface ClientInfo {
  userId: string;
  userRole: string;
  courierId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private connectedClients = new Map<string, ClientInfo>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const clientInfo: ClientInfo = {
        userId: payload.sub,
        userRole: payload.role,
        courierId: payload.role === 'COURIER' ? payload.sub : undefined,
      };

      this.connectedClients.set(client.id, clientInfo);

      // Join user-specific room
      client.join(`user_${clientInfo.userId}`);

      // If courier, join courier-specific room
      if (clientInfo.userRole === 'COURIER') {
        client.join(`courier_${clientInfo.courierId}`);
      }

      this.logger.log(
        `Client connected: ${client.id} (${clientInfo.userRole})`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @MessageBody() data: TrackingData,
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);

    if (!clientInfo || clientInfo.userRole !== 'COURIER') {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Broadcast location update to all clients tracking this parcel
    this.server.to(`parcel_${data.parcelId}`).emit('locationUpdated', {
      courierId: data.courierId,
      parcelId: data.parcelId,
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status,
      timestamp: data.timestamp,
    });

    this.logger.log(
      `Location updated for parcel ${data.parcelId} by courier ${data.courierId}`,
    );
  }

  @SubscribeMessage('trackParcel')
  async handleTrackParcel(
    @MessageBody() data: { parcelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);

    if (!clientInfo) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Join parcel tracking room
    client.join(`parcel_${data.parcelId}`);

    this.logger.log(
      `User ${clientInfo.userId} started tracking parcel ${data.parcelId}`,
    );
  }

  @SubscribeMessage('stopTracking')
  async handleStopTracking(
    @MessageBody() data: { parcelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Leave parcel tracking room
    client.leave(`parcel_${data.parcelId}`);

    this.logger.log(
      `Client ${client.id} stopped tracking parcel ${data.parcelId}`,
    );
  }

  // Method to broadcast status updates to all tracking clients
  broadcastStatusUpdate(parcelId: string, status: string, courierId?: string) {
    this.server.to(`parcel_${parcelId}`).emit('statusUpdated', {
      parcelId,
      status,
      courierId,
      timestamp: new Date(),
    });
  }

  // Method to broadcast location updates to all tracking clients
  broadcastLocationUpdate(
    parcelId: string,
    courierId: string,
    latitude: number,
    longitude: number,
  ) {
    this.server.to(`parcel_${parcelId}`).emit('locationUpdated', {
      courierId,
      parcelId,
      latitude,
      longitude,
      timestamp: new Date(),
    });
  }

  // Method to notify specific user
  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Method to notify all couriers
  notifyCouriers(event: string, data: any) {
    this.server.to('couriers').emit(event, data);
  }
}
