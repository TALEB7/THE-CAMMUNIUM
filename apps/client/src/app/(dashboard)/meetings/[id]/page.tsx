'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Loader2,
  Users,
  Copy,
  Check,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface Participant {
  userId: string;
  displayName: string;
  socketId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  stream?: MediaStream;
}

export default function MeetingRoomPage() {
  const { id: meetingId } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  // State
  const [joined, setJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Fetch meeting details
  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => api.get(`/meetings/${meetingId}`).then((r) => r.data),
    enabled: !!meetingId,
  });

  // Create peer connection for a remote participant
  const createPeerConnection = useCallback(
    (remoteUserId: string, isInitiator: boolean) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        const videoEl = remoteVideosRef.current.get(remoteUserId);
        if (videoEl) {
          videoEl.srcObject = remoteStream;
        }
        peersRef.current.set(remoteUserId, {
          ...peersRef.current.get(remoteUserId)!,
          stream: remoteStream,
        });
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            meetingId,
            to: remoteUserId,
            from: userId,
            candidate: event.candidate,
          });
        }
      };

      peersRef.current.set(remoteUserId, { pc });

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socketRef.current?.emit('offer', {
              meetingId,
              to: remoteUserId,
              from: userId,
              offer: pc.localDescription,
            });
          });
      }

      return pc;
    },
    [meetingId, userId],
  );

  // Join the meeting
  const joinMeeting = useCallback(async () => {
    if (!userId || !meetingId) return;

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect socket
      const socket = io(`${API_URL}/meetings`, {
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-meeting', {
          meetingId,
          userId,
          displayName: userId, // Will be overridden with real name
        });
        setJoined(true);
      });

      // Existing participants → create peer connections
      socket.on('existing-participants', (existingParticipants: Participant[]) => {
        setParticipants(existingParticipants);
        existingParticipants.forEach((p) => {
          createPeerConnection(p.userId, true);
        });
      });

      // New participant joined → create peer connection (they will send offer)
      socket.on('participant-joined', (participant: Participant) => {
        setParticipants((prev) => [...prev.filter((p) => p.userId !== participant.userId), participant]);
        createPeerConnection(participant.userId, false);
      });

      // Participant left
      socket.on('participant-left', ({ userId: leftUserId }: { userId: string }) => {
        setParticipants((prev) => prev.filter((p) => p.userId !== leftUserId));
        const peer = peersRef.current.get(leftUserId);
        if (peer) {
          peer.pc.close();
          peersRef.current.delete(leftUserId);
        }
      });

      // WebRTC signaling
      socket.on('offer', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
        let peer = peersRef.current.get(from);
        if (!peer) {
          createPeerConnection(from, false);
          peer = peersRef.current.get(from);
        }
        if (peer) {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          socket.emit('answer', {
            meetingId,
            to: from,
            from: userId,
            answer: peer.pc.localDescription,
          });
        }
      });

      socket.on('answer', async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
        const peer = peersRef.current.get(from);
        if (peer) {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
        const peer = peersRef.current.get(from);
        if (peer) {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      // Media toggles from others
      socket.on('audio-toggled', ({ userId: uid, enabled }: { userId: string; enabled: boolean }) => {
        setParticipants((prev) => prev.map((p) => (p.userId === uid ? { ...p, audioEnabled: enabled } : p)));
      });

      socket.on('video-toggled', ({ userId: uid, enabled }: { userId: string; enabled: boolean }) => {
        setParticipants((prev) => prev.map((p) => (p.userId === uid ? { ...p, videoEnabled: enabled } : p)));
      });

      // Meeting ended
      socket.on('meeting-ended', () => {
        setMeetingEnded(true);
        cleanup();
      });
    } catch (err) {
      console.error('Failed to join meeting:', err);
    }
  }, [userId, meetingId, createPeerConnection]);

  // Cleanup
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    socketRef.current?.disconnect();
  }, []);

  // Leave
  const leaveMeeting = useCallback(() => {
    socketRef.current?.emit('leave-meeting', { meetingId, userId });
    cleanup();
    router.push('/groups');
  }, [meetingId, userId, cleanup, router]);

  // End meeting (host only)
  const endMeeting = useCallback(() => {
    socketRef.current?.emit('end-meeting', { meetingId, userId });
  }, [meetingId, userId]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !audioEnabled;
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = enabled));
      setAudioEnabled(enabled);
      socketRef.current?.emit('toggle-audio', { meetingId, userId, enabled });
    }
  }, [audioEnabled, meetingId, userId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !videoEnabled;
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = enabled));
      setVideoEnabled(enabled);
      socketRef.current?.emit('toggle-video', { meetingId, userId, enabled });
    }
  }, [videoEnabled, meetingId, userId]);

  // Screen share
  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      // Replace screen track with camera track
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        });
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            peersRef.current.forEach(({ pc }) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
              if (sender) sender.replaceTrack(camTrack);
            });
          }
          setScreenSharing(false);
        };
        setScreenSharing(true);
      } catch {
        // User cancelled screen share
      }
    }
  }, [screenSharing]);

  // Copy meeting link
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [meetingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const isHost = meeting?.hostId === userId;
  const totalParticipants = participants.length + 1; // +1 for self
  const gridCols =
    totalParticipants <= 1 ? 'grid-cols-1' :
    totalParticipants <= 4 ? 'grid-cols-2' :
    totalParticipants <= 9 ? 'grid-cols-3' :
    'grid-cols-4';

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#c9a730]" />
      </div>
    );
  }

  // ── MEETING ENDED ──
  if (meetingEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <PhoneOff className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#1a237e]">Réunion terminée</h2>
        <p className="text-sm text-gray-500">La réunion a été terminée.</p>
        <button
          onClick={() => router.push('/groups')}
          className="px-6 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] transition"
        >
          Retour aux groupes
        </button>
      </div>
    );
  }

  // ── PRE-JOIN LOBBY ──
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a237e] font-heading">
            📹 {meeting?.title || 'Réunion de groupe'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {meeting?.group?.name && `Groupe: ${meeting.group.name}`}
          </p>
          {meeting?.status === 'ENDED' && (
            <p className="text-sm text-red-500 mt-2 font-semibold">Cette réunion est terminée</p>
          )}
        </div>

        {meeting?.status !== 'ENDED' && (
          <>
            {/* Preview card */}
            <div className="w-96 h-64 rounded-2xl bg-gray-900 overflow-hidden relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={toggleAudio}
                  className={`p-2.5 rounded-full transition ${audioEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-full transition ${videoEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={joinMeeting}
              className="flex items-center gap-2 px-8 py-3 text-sm font-bold bg-[#c9a730] text-white rounded-xl hover:bg-[#b8962c] transition shadow-lg"
            >
              Rejoindre maintenant
            </button>
          </>
        )}
      </div>
    );
  }

  // ── MEETING ROOM ──
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 rounded-t-xl">
        <div className="flex items-center gap-3">
          <h2 className="text-white text-sm font-semibold">
            {meeting?.title || 'Réunion'}
          </h2>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="h-3 w-3" /> {totalParticipants}
          </span>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </button>
      </div>

      {/* Video grid */}
      <div className={`flex-1 bg-gray-950 p-3 grid ${gridCols} gap-3 auto-rows-fr`}>
        {/* Local video */}
        <div className="relative rounded-xl overflow-hidden bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`}
          />
          {!videoEnabled && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#1a237e] flex items-center justify-center text-white text-xl font-bold">
                Moi
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
              Vous {isHost && '(Hôte)'}
            </span>
            {!audioEnabled && (
              <span className="p-1 bg-red-500 rounded-full">
                <MicOff className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
        </div>

        {/* Remote videos */}
        {participants.map((p) => (
          <div key={p.userId} className="relative rounded-xl overflow-hidden bg-gray-800">
            <video
              ref={(el) => {
                if (el) {
                  remoteVideosRef.current.set(p.userId, el);
                  const peer = peersRef.current.get(p.userId);
                  if (peer?.stream) el.srcObject = peer.stream;
                }
              }}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!p.videoEnabled ? 'hidden' : ''}`}
            />
            {!p.videoEnabled && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#283593] flex items-center justify-center text-white text-xl font-bold">
                  {p.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
                {p.displayName}
              </span>
              {!p.audioEnabled && (
                <span className="p-1 bg-red-500 rounded-full">
                  <MicOff className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-gray-900 rounded-b-xl">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition ${audioEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          title={audioEnabled ? 'Couper le micro' : 'Activer le micro'}
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition ${videoEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          title={videoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
        >
          {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition ${screenSharing ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          title="Partager l'écran"
        >
          <Monitor className="h-5 w-5" />
        </button>

        <button
          onClick={leaveMeeting}
          className="px-5 py-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
          title="Quitter"
        >
          <PhoneOff className="h-5 w-5" />
        </button>

        {isHost && (
          <button
            onClick={endMeeting}
            className="px-4 py-3 rounded-full bg-red-700 text-white hover:bg-red-800 transition text-xs font-semibold"
            title="Terminer pour tous"
          >
            Terminer
          </button>
        )}
      </div>
    </div>
  );
}
