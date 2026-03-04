import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MeetingsService } from './meetings.service';

interface RoomParticipant {
  socketId: string;
  userId: string;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/meetings',
})
export class MeetingsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // meetingId -> Map<userId, RoomParticipant>
  private rooms = new Map<string, Map<string, RoomParticipant>>();

  constructor(private readonly meetingsService: MeetingsService) {}

  handleDisconnect(client: Socket) {
    for (const [meetingId, participants] of this.rooms.entries()) {
      for (const [oderId, participant] of participants.entries()) {
        if (participant.socketId === client.id) {
          participants.delete(oderId);
          this.server.to(meetingId).emit('participant-left', { userId: oderId });
          // Clean up DB
          this.meetingsService.leaveMeeting(meetingId, oderId).catch(() => {});
          if (participants.size === 0) {
            this.rooms.delete(meetingId);
          }
          return;
        }
      }
    }
  }

  @SubscribeMessage('join-meeting')
  async handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; userId: string; displayName: string },
  ) {
    const { meetingId, userId, displayName } = data;

    if (!this.rooms.has(meetingId)) {
      this.rooms.set(meetingId, new Map());
    }

    const room = this.rooms.get(meetingId)!;
    const existingParticipants = Array.from(room.values());

    room.set(userId, {
      socketId: client.id,
      userId,
      displayName,
      audioEnabled: true,
      videoEnabled: true,
    });

    client.join(meetingId);

    // Send existing participants to the new joiner
    client.emit('existing-participants', existingParticipants);

    // Notify others
    client.to(meetingId).emit('participant-joined', {
      userId,
      displayName,
      socketId: client.id,
      audioEnabled: true,
      videoEnabled: true,
    });

    // Record in DB
    await this.meetingsService.joinMeeting(meetingId, userId).catch(() => {});
  }

  @SubscribeMessage('leave-meeting')
  async handleLeaveMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; userId: string },
  ) {
    const { meetingId, userId } = data;
    const room = this.rooms.get(meetingId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) this.rooms.delete(meetingId);
    }
    client.leave(meetingId);
    this.server.to(meetingId).emit('participant-left', { userId });
    await this.meetingsService.leaveMeeting(meetingId, userId).catch(() => {});
  }

  // ── WebRTC Signaling ──

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; to: string; from: string; offer: any },
  ) {
    // Find target socket
    const room = this.rooms.get(data.meetingId);
    const target = room?.get(data.to);
    if (target) {
      this.server.to(target.socketId).emit('offer', {
        from: data.from,
        offer: data.offer,
      });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; to: string; from: string; answer: any },
  ) {
    const room = this.rooms.get(data.meetingId);
    const target = room?.get(data.to);
    if (target) {
      this.server.to(target.socketId).emit('answer', {
        from: data.from,
        answer: data.answer,
      });
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; to: string; from: string; candidate: any },
  ) {
    const room = this.rooms.get(data.meetingId);
    const target = room?.get(data.to);
    if (target) {
      this.server.to(target.socketId).emit('ice-candidate', {
        from: data.from,
        candidate: data.candidate,
      });
    }
  }

  // ── MediaToggling ──

  @SubscribeMessage('toggle-audio')
  handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; userId: string; enabled: boolean },
  ) {
    const room = this.rooms.get(data.meetingId);
    const p = room?.get(data.userId);
    if (p) p.audioEnabled = data.enabled;
    client.to(data.meetingId).emit('audio-toggled', { userId: data.userId, enabled: data.enabled });
  }

  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; userId: string; enabled: boolean },
  ) {
    const room = this.rooms.get(data.meetingId);
    const p = room?.get(data.userId);
    if (p) p.videoEnabled = data.enabled;
    client.to(data.meetingId).emit('video-toggled', { userId: data.userId, enabled: data.enabled });
  }

  // ── End meeting (host) ──

  @SubscribeMessage('end-meeting')
  async handleEndMeeting(
    @MessageBody() data: { meetingId: string; userId: string },
  ) {
    this.server.to(data.meetingId).emit('meeting-ended', { endedBy: data.userId });
    this.rooms.delete(data.meetingId);
    await this.meetingsService.endMeeting(data.meetingId, data.userId).catch(() => {});
  }
}
