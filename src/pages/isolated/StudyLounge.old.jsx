import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { selectCurrentUserProfile, setCredentials } from '../redux/authSlice';
import { studyLanguageService } from '../services/studyLanguageService';
import { userService } from '../services/userService';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

// React helper component to bind MediaStream natively to HTML5 video tag
function VideoStream({ stream, isMuted = false, style, className }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={isMuted}
      style={style}
      className={className}
    />
  );
}

export default function StudyLounge() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Language room list states
  const [languages, setLanguages] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState(null);
  const [saveAsDefaultId, setSaveAsDefaultId] = useState(null);

  // Chat message & roster states
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [broadcastAlert, setBroadcastAlert] = useState(null);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [socket, setSocket] = useState(null);

  // Live Video Course States
  const [activeVideoSession, setActiveVideoSession] = useState(null); // { videoUrl, courseTitle, sender }
  const [isPlayingSession, setIsPlayingSession] = useState(false); // Whether student joined live stream panel
  const [showStartModal, setShowStartModal] = useState(false); // Modal visibility for teachers
  const [courseTitleInput, setCourseTitleInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState(''); // Starts empty for custom URL pasting

  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const isSyncingRef = useRef(false); // Flag to avoid feedback loops

  // WebRTC Video Chat States
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]); // [{ socketId, userId, username, avatar, stream }]
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [isConnectingCall, setIsConnectingCall] = useState(false);
  const [isCallHost, setIsCallHost] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeScreenShareUser, setActiveScreenShareUser] = useState(null); // 'local' or socketId
  const [showExitModal, setShowExitModal] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const leaveVideoCallRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // WebRTC creation helper
  const createPeerConnection = (targetSocketId, targetUser, socketConn) => {
    if (peersRef.current[targetSocketId]) {
      return peersRef.current[targetSocketId];
    }

    console.log(`📹 Creating RTCPeerConnection for peer: ${targetUser.username} (${targetSocketId})`);
    const pc = new RTCPeerConnection(iceServers);
    peersRef.current[targetSocketId] = pc;

    // Attach local stream tracks to this peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketConn) {
        socketConn.emit('webrtc_signal', {
          targetSocketId,
          signalData: event.candidate
        });
      }
    };

    // Receive Remote Streams
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log(`📹 Received remote video track from: ${targetUser.username}`);
      setRemotePeers(prev => {
        const filtered = prev.filter(p => p.socketId !== targetSocketId);
        return [...filtered, {
          socketId: targetSocketId,
          userId: targetUser.userId,
          username: targetUser.username,
          avatar: targetUser.avatar,
          stream: remoteStream
        }];
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`📹 WebRTC connection state with ${targetUser.username}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeerConnection(targetSocketId);
      }
    };

    return pc;
  };

  // WebRTC close helper
  const closePeerConnection = (targetSocketId) => {
    const pc = peersRef.current[targetSocketId];
    if (pc) {
      pc.close();
      delete peersRef.current[targetSocketId];
    }
    setRemotePeers(prev => prev.filter(p => p.socketId !== targetSocketId));
  };

  // Join video conference call
  const joinVideoCall = async () => {
    if (!socket || !activeLanguage) return;
    setIsConnectingCall(true);

    try {
      console.log('📹 Capturing user webcam and mic...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsInVideoCall(true);

      // Determine if we are the first to join (and thus the host of the video call session)
      if (remotePeers.length === 0) {
        setIsCallHost(true);
      } else {
        setIsCallHost(false);
      }

      // Emit announcement to room
      socket.emit('join_video_call', {
        roomId: `room:${activeLanguage._id}`,
        userId: user._id,
        username: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        avatar: user.avatar || ''
      });

      toast.success('Vous avez rejoint la session de chat vidéo !');
    } catch (err) {
      console.error('Failed to get media devices:', err);
      toast.error('Impossible d’accéder à votre caméra ou microphone.');
    } finally {
      setIsConnectingCall(false);
    }
  };

  // Leave video conference call
  const leaveVideoCall = () => {
    console.log('📹 Leaving video call and cleaning up...');
    
    // Stop screen share tracks if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    localStreamRef.current = null;

    Object.keys(peersRef.current).forEach(socketId => {
      closePeerConnection(socketId);
    });

    if (socket && activeLanguage) {
      socket.emit('leave_video_call', { roomId: `room:${activeLanguage._id}` });
    }

    setIsInVideoCall(false);
    setIsMicMuted(false);
    setIsCamOff(false);
    setIsScreenSharing(false);
    setActiveScreenShareUser(null);
    setIsCallHost(false);
    toast.info('Session de chat vidéo quittée.');
  };

  useEffect(() => {
    leaveVideoCallRef.current = leaveVideoCall;
  }, [leaveVideoCall]);

  // Host terminates the call session completely for all peers
  const terminateVideoCallForAll = () => {
    if (socket && activeLanguage) {
      socket.emit('terminate_video_call', { roomId: `room:${activeLanguage._id}` });
    }
    leaveVideoCall();
    setShowExitModal(false);
  };

  // Handles clicking the Exit button (shows choices modal if caller is the host)
  const handleExitClick = () => {
    if (isCallHost) {
      setShowExitModal(true);
    } else {
      leaveVideoCall();
    }
  };

  // Screen Share Toggle
  const startScreenShare = async () => {
    try {
      console.log('🖥️ Capturing display/app screen stream...');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      
      const screenTrack = stream.getVideoTracks()[0];
      
      // Auto-restore webcam if the user stops sharing via browser bar
      screenTrack.onended = () => {
        stopScreenShare();
      };
      
      // Dynamic WebRTC track replacement across all active RTCPeerConnections
      Object.keys(peersRef.current).forEach(socketId => {
        const pc = peersRef.current[socketId];
        const senders = pc.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });
      
      // Synthesize new local MediaStream retaining the current microphone audio track
      const originalTracks = localStreamRef.current ? localStreamRef.current.getTracks() : [];
      const currentAudioTrack = originalTracks.find(t => t.kind === 'audio');
      
      const newStream = new MediaStream([screenTrack]);
      if (currentAudioTrack) {
        newStream.addTrack(currentAudioTrack);
      }
      
      setLocalStream(newStream);
      setIsScreenSharing(true);
      setActiveScreenShareUser('local');
      if (socket && activeLanguage) {
        socket.emit('screen_share_started', { roomId: `room:${activeLanguage._id}` });
      }
      toast.success('Partage d’écran activé !');
    } catch (err) {
      console.error('Failed to initiate screen share:', err);
      toast.error('Impossible de démarrer le partage d’écran.');
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    try {
      console.log('📹 Re-capturing webcam feed...');
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const newVideoTrack = cameraStream.getVideoTracks()[0];
      
      // Preserve camera mute states
      newVideoTrack.enabled = !isCamOff;
      
      // Restore camera video track in all active mesh peer senders
      Object.keys(peersRef.current).forEach(socketId => {
        const pc = peersRef.current[socketId];
        const senders = pc.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }
      });
      
      const originalTracks = localStreamRef.current ? localStreamRef.current.getTracks() : [];
      const currentAudioTrack = originalTracks.find(t => t.kind === 'audio');
      
      const restoredStream = new MediaStream([newVideoTrack]);
      if (currentAudioTrack) {
        restoredStream.addTrack(currentAudioTrack);
      }
      
      setLocalStream(restoredStream);
      localStreamRef.current = restoredStream;
      setIsScreenSharing(false);
      setActiveScreenShareUser(prev => prev === 'local' ? null : prev);
      if (socket && activeLanguage) {
        socket.emit('screen_share_stopped', { roomId: `room:${activeLanguage._id}` });
      }
      toast.info('Partage d’écran arrêté.');
    } catch (err) {
      console.error('Failed to restore camera after screen share:', err);
    }
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  // Parse shared room link query params for guest entry support
  const queryParams = new URLSearchParams(window.location.search);
  const sharedRoomId = queryParams.get('roomId');
  
  // Keep persistent guest references for unauthenticated link-sharing guest entries
  const guestIdRef = useRef(null);
  const guestNameRef = useRef(null);
  if (!guestIdRef.current) {
    guestIdRef.current = `guest_${Math.random().toString(36).substring(2, 11)}`;
    // Name guests in a simple sequential or distinct guest representation (e.g. user1, user2...)
    guestNameRef.current = `user${Math.floor(Math.random() * 1000) + 1}`;
  }

  // Retrieve current user dynamically from Redux
  const reduxUserProfile = useSelector(selectCurrentUserProfile);
  const loggedInUser = reduxUserProfile || JSON.parse(sessionStorage.getItem('userProfile') || 'null');
  
  // Resolve user: use logged-in account, or fall back to guest model if roomId is present in the invitation URL
  const user = loggedInUser || (sharedRoomId ? {
    _id: guestIdRef.current,
    firstName: guestNameRef.current,
    lastName: '',
    email: 'guest@einstein.com',
    role: 'student',
    avatar: '',
    isGuest: true
  } : null);

  const userRole = user?.role || 'student';
  const isPrivileged = ['superadmin', 'admin', 'teacher'].includes(userRole);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Verify authentication: bypass redirection if a roomId invitation is present
  useEffect(() => {
    if (!loggedInUser && !sharedRoomId) {
      navigate('/login');
    }
  }, [loggedInUser, sharedRoomId, navigate]);

  // Fetch active study languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoadingLanguages(true);
        const data = await studyLanguageService.getLanguages(true);
        setLanguages(data);

        // Auto-select language room if invite roomId is present or user already has a default study language
        const defaultLangId = sharedRoomId || user?.studyLanguage?._id || user?.studyLanguage;
        if (defaultLangId && data.length > 0) {
          const matched = data.find(lang => lang._id === defaultLangId);
          if (matched) {
            setActiveLanguage(matched);
          }
        }
      } catch (err) {
        console.error('Error fetching study languages:', err);
        toast.error('Erreur de chargement des salons d’étude.');
      } finally {
        setLoadingLanguages(false);
      }
    };

    if (user) {
      fetchLanguages();
    }
  }, [user?.studyLanguage, sharedRoomId]);

  // Handle joining a room & optionally saving it as default in DB
  const handleJoinLanguage = async (lang) => {
    try {
      if (saveAsDefaultId === lang._id) {
        const submissionData = new FormData();
        submissionData.append('firstName', user?.firstName || '');
        submissionData.append('lastName', user?.lastName || '');
        submissionData.append('email', user?.email || '');
        submissionData.append('phone', user?.phone || '');
        submissionData.append('language', user?.language || 'fr');
        submissionData.append('studyLanguage', lang._id);

        const updatedUser = await userService.updateProfile(submissionData);

        // Sync Redux
        dispatch(setCredentials({
          token: sessionStorage.getItem('token'),
          userId: updatedUser._id,
          userRoles: [updatedUser.role],
          userName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          profile: updatedUser
        }));

        toast.success(`Salon ${lang.name} configuré comme salon par défaut !`);
      } else {
        toast.info(`Connexion au salon : ${lang.name}`);
      }

      setActiveLanguage(lang);
    } catch (err) {
      console.error('Error saving study language selection:', err);
      toast.error('Erreur lors de l’enregistrement de votre préférence.');
      // Proceed to room regardless
      setActiveLanguage(lang);
    }
  };

  // Socket Connection and Room Switcher Management
  useEffect(() => {
    if (!user || !activeLanguage) return;

    const roomId = `room:${activeLanguage._id}`;

    // Establish WebSocket Connection
    const socketConn = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketConn.on('connect', () => {
      console.log('🔌 Socket connected. Room ID:', roomId);

      // Join corresponding language room
      socketConn.emit('join_room', {
        roomId,
        userId: user._id,
        username: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        avatar: user.avatar || ''
      });
    });

    // Listen for roster updates
    socketConn.on('room_users', (users) => {
      setOnlineUsers(users);
    });

    // Listen for incoming messages
    socketConn.on('receive_msg', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Listen for high-priority broadcasts
    socketConn.on('receive_broadcast', (broadcast) => {
      setBroadcastAlert(broadcast);
      // Auto-hide alert banner after 10 seconds
      const timer = setTimeout(() => {
        setBroadcastAlert(null);
      }, 10000);
      return () => clearTimeout(timer);
    });

    // Listen for live video course starting
    socketConn.on('video_course_started', ({ videoUrl, courseTitle, sender }) => {
      setActiveVideoSession({ videoUrl, courseTitle, sender });
      toast.info(`🔴 Cours vidéo en direct lancé par ${sender} !`, {
        position: "top-center",
        autoClose: 6000,
        theme: "dark"
      });
    });

    // Listen for play state synchronization from teacher
    socketConn.on('video_state_synced', ({ action, time }) => {
      if (!videoRef.current) return;
      isSyncingRef.current = true;
      
      console.log('🎬 Synced video state:', action, time);
      if (Math.abs(videoRef.current.currentTime - time) > 1.5) {
        videoRef.current.currentTime = time;
      }
      
      if (action === 'play') {
        videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      } else if (action === 'pause') {
        videoRef.current.pause();
      }
      
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 300);
    });

    // Listen for video course ending
    socketConn.on('video_course_ended', () => {
      setActiveVideoSession(null);
      setIsPlayingSession(false);
      toast.warn('🔴 Le cours vidéo en direct s’est terminé.', {
        position: "top-center",
        theme: "dark"
      });
    });
    // WebRTC signaling event: new user joins the video group call
    socketConn.on('user_joined_video_call', async ({ socketId, userId, username, avatar }) => {
      console.log(`📹 Peer joined video call. Initializing negotiation with socket: ${socketId}`);
      
      const pc = createPeerConnection(socketId, { userId, username, avatar }, socketConn);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketConn.emit('webrtc_signal', {
          targetSocketId: socketId,
          signalData: {
            type: offer.type,
            sdp: offer.sdp,
            senderInfo: {
              userId: user._id,
              username: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              avatar: user.avatar || ''
            }
          }
        });
      } catch (err) {
        console.error('Failed to create and send WebRTC offer:', err);
      }
    });

    // WebRTC signaling event: SDP offers/answers and ICE candidate relay
    socketConn.on('webrtc_signal', async ({ senderSocketId, signalData }) => {
      let pc = peersRef.current[senderSocketId];
      
      try {
        if (signalData.type === 'offer') {
          console.log(`📹 Received WebRTC offer from socket: ${senderSocketId}`);
          
          // Obtain peer user representation
          const peerUser = signalData.senderInfo || {
            userId: '',
            username: 'Étudiant',
            avatar: ''
          };
          
          pc = createPeerConnection(senderSocketId, peerUser, socketConn);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: signalData.type, sdp: signalData.sdp }));
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          socketConn.emit('webrtc_signal', {
            targetSocketId: senderSocketId,
            signalData: answer
          });
        } else if (signalData.type === 'answer') {
          console.log(`📹 Received WebRTC answer from socket: ${senderSocketId}`);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          }
        } else if (signalData.candidate) {
          console.log(`📹 Received ICE candidate from socket: ${senderSocketId}`);
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signaling data:', err);
      }
    });

    // WebRTC signaling event: user left video group call
    socketConn.on('user_left_video_call', ({ socketId }) => {
      console.log(`📹 Peer left video call. Tearing down connection with socket: ${socketId}`);
      closePeerConnection(socketId);
      setActiveScreenShareUser(prev => prev === socketId ? null : prev);
    });

    // Listen for call terminated by host
    socketConn.on('video_call_terminated_by_host', () => {
      console.log('📹 Video call was terminated by the host.');
      toast.warn("L'organisateur a mis fin à la session de chat vidéo.");
      if (leaveVideoCallRef.current) {
        leaveVideoCallRef.current();
      }
    });

    // Listen for screen share start from peer
    socketConn.on('peer_screen_share_started', ({ socketId }) => {
      console.log(`🖥️ Peer started screen sharing: ${socketId}`);
      setActiveScreenShareUser(socketId);
    });

    // Listen for screen share stop from peer
    socketConn.on('peer_screen_share_stopped', ({ socketId }) => {
      console.log(`📹 Peer stopped screen sharing: ${socketId}`);
      setActiveScreenShareUser(prev => prev === socketId ? null : prev);
    });

    setSocket(socketConn);

    // Clean up socket and WebRTC on room change/unmount
    return () => {
      console.log('🔌 Disconnecting socket from room:', roomId);
      socketConn.disconnect();
      setMessages([]);
      setOnlineUsers([]);
      setBroadcastAlert(null);
      setActiveVideoSession(null);
      setIsPlayingSession(false);
      
      // Stop and clean up any ongoing WebRTC video streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      Object.keys(peersRef.current).forEach(sid => {
        const pc = peersRef.current[sid];
        if (pc) pc.close();
      });
      peersRef.current = {};
      setLocalStream(null);
      setRemotePeers([]);
      setIsInVideoCall(false);
    };
  }, [activeLanguage, user?._id]);

  // Scroll chat window to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !activeLanguage) return;

    const roomId = `room:${activeLanguage._id}`;
    const senderData = {
      id: user._id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      avatar: user.avatar || '',
      role: user.role
    };

    // Emit message to room
    socket.emit('send_msg', {
      roomId,
      sender: senderData,
      text: inputText.trim()
    });

    // Append locally
    setMessages(prev => [...prev, {
      sender: senderData,
      text: inputText.trim(),
      timestamp: new Date()
    }]);

    setInputText('');
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastInput.trim() || !socket || !activeLanguage) return;

    const roomId = `room:${activeLanguage._id}`;
    const senderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    // Emit broadcast alert
    socket.emit('broadcast_alert', {
      roomId,
      alertText: broadcastInput.trim(),
      sender: senderName
    });

    setBroadcastInput('');
  };

  // Teacher synchronization emit triggers
  const handleTeacherPlay = () => {
    if (!isPrivileged || isSyncingRef.current || !socket || !activeLanguage) return;
    socket.emit('sync_video_state', {
      roomId: `room:${activeLanguage._id}`,
      action: 'play',
      time: videoRef.current ? videoRef.current.currentTime : 0
    });
  };

  const handleTeacherPause = () => {
    if (!isPrivileged || isSyncingRef.current || !socket || !activeLanguage) return;
    socket.emit('sync_video_state', {
      roomId: `room:${activeLanguage._id}`,
      action: 'pause',
      time: videoRef.current ? videoRef.current.currentTime : 0
    });
  };

  const handleTeacherSeek = () => {
    if (!isPrivileged || isSyncingRef.current || !socket || !activeLanguage) return;
    socket.emit('sync_video_state', {
      roomId: `room:${activeLanguage._id}`,
      action: 'seek',
      time: videoRef.current ? videoRef.current.currentTime : 0
    });
  };

  const handleStartVideoSessionSubmit = (e) => {
    e.preventDefault();
    if (!courseTitleInput.trim() || !videoUrlInput.trim() || !socket || !activeLanguage) return;

    const roomId = `room:${activeLanguage._id}`;
    const teacherName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    socket.emit('start_video_course', {
      roomId,
      videoUrl: videoUrlInput.trim(),
      courseTitle: courseTitleInput.trim(),
      sender: teacherName
    });

    setActiveVideoSession({
      videoUrl: videoUrlInput.trim(),
      courseTitle: courseTitleInput.trim(),
      sender: teacherName
    });
    setIsPlayingSession(true);
    setShowStartModal(false);
    
    toast.success("Cours vidéo en direct lancé !");
  };

  const handleStopVideoSession = () => {
    if (!socket || !activeLanguage) return;
    socket.emit('end_video_course', {
      roomId: `room:${activeLanguage._id}`
    });
  };

  // Helper to safely resolve absolute user uploads vs external avatars
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${API_URL}${avatarPath}`;
  };

  // Helper to show custom flag icons
  const getFlag = (code) => {
    switch (code?.toLowerCase()) {
      case 'en': return '🇬🇧';
      case 'fr': return '🇫🇷';
      case 'de': return '🇩🇪';
      case 'es': return '🇪🇸';
      case 'it': return '🇮🇹';
      default: return '🌐';
    }
  };

  if (!user) return null;

  // Onboarding Room Selection Layout
  if (loadingLanguages) {
    return (
      <div style={{ background: '#06091a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '100px' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>Chargement des salons d'étude...</p>
        </div>
        <Footer />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!activeLanguage) {
    return (
      <div style={{ background: '#06091a', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <div style={{ flex: 1, paddingTop: '120px', paddingBottom: '60px', maxWidth: 1200, width: '90%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
          
          <div style={{ textAlign: 'center', maxWidth: 700 }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem', filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.4))' }}>✨</span>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, background: 'linear-gradient(to right, #3b82f6, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Bienvenue dans le Salon d'Étude Einstein
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1.25rem', lineHeight: 1.6 }}>
              Veuillez sélectionner un salon de langue d'étude active pour commencer à échanger en temps réel. Discutez avec d’autres apprenants, partagez des ressources et progressez ensemble !
            </p>
          </div>

          {/* Glowing Languages Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%' }}>
            {languages.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, backdropFilter: 'blur(10px)' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Aucun salon de langue d'étude n'est actuellement actif.</p>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>Veuillez repasser plus tard ou contacter l'administration de l'institut.</p>
              </div>
            ) : (
              languages.map((lang) => (
                <div
                  key={lang._id}
                  onClick={() => handleJoinLanguage(lang)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 24,
                    padding: '2.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.4)';
                  }}
                >
                  {/* Neon visual overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.02) 0%, transparent 60%)',
                    pointerEvents: 'none'
                  }} />

                  <span style={{ fontSize: '3.5rem', marginBottom: '1.25rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}>
                    {getFlag(lang.code)}
                  </span>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                    Salon {lang.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 2rem 0', textAlign: 'center', lineHeight: 1.45 }}>
                    Communiquez instantanément avec l’ensemble des apprenants du cours de {lang.name}.
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                    <button
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: 14,
                        padding: '0.85rem 1.5rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)';
                      }}
                    >
                      Rejoindre le Salon
                    </button>

                    <label
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', marginTop: '0.25rem', userSelect: 'none' }}
                    >
                      <input
                        type="checkbox"
                        checked={saveAsDefaultId === lang._id}
                        onChange={(e) => setSaveAsDefaultId(e.target.checked ? lang._id : null)}
                        style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                      />
                      Définir comme langue par défaut
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Split-Screen Interactive Live Video Session Layout
  const renderVideoCoursePlayer = () => {
    if (!activeVideoSession) return null;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flex: 1, minHeight: 600, animation: 'fadeInUp 0.5s ease-out' }}>
        
        {/* Majestic Video Stream Player */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backdropFilter: 'blur(16px)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          
          {/* Header of Video Session */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: 20, fontWeight: 700, marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s infinite' }} />
                COURS EN DIRECT
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.4rem 0 0 0', color: 'white' }}>
                {activeVideoSession.courseTitle}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                Enseignant : <strong style={{ color: '#f1f5f9' }}>{activeVideoSession.sender}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {isPrivileged ? (
                <button
                  onClick={handleStopVideoSession}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, padding: '0.65rem 1.4rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                >
                  🛑 Arrêter le cours
                </button>
              ) : (
                <button
                  onClick={() => setIsPlayingSession(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: 12, padding: '0.65rem 1.4rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  🚪 Retour discussion
                </button>
              )}
            </div>
          </div>

          {/* Actual Video Frame Container */}
          <div style={{ position: 'relative', flex: 1, background: '#030712', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', minHeight: '380px' }}>
            <video
              ref={videoRef}
              src={activeVideoSession.videoUrl}
              controls={isPrivileged} // Only teacher controls, read-only sync for students
              autoPlay
              playsInline
              onPlay={handleTeacherPlay}
              onPause={handleTeacherPause}
              onSeeked={handleTeacherSeek}
              style={{ width: '100%', height: '100%', maxHeight: '480px', objectFit: 'contain' }}
            />

            {/* Glowing synched overlay indicator for students */}
            {!isPrivileged && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(16,185,129,0.85)', color: 'white', fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: 20, fontWeight: 700, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
                SYNCHRONISÉ AVEC LE PROFESSEUR
              </div>
            )}
          </div>
        </div>

        {/* Live Course Chat Panel (Split Screen Mode) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(16px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'white' }}>💬 Discussion du cours</h3>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>Posez vos questions ou discutez du cours</p>
          </div>

          {/* Interactive thread */}
          <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-scrollbar">
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '2rem' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</span>
                <p style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>Début du cours</p>
                <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', textAlign: 'center' }}>Aucune question posée. Envoyez un message !</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isSelf = m.sender.id === user._id;
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isSelf ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                    animation: 'fadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.15rem', marginLeft: isSelf ? 0 : '0.25rem', marginRight: isSelf ? '0.25rem' : 0 }}>
                      {m.sender.name}
                      {['admin', 'superadmin', 'teacher'].includes(m.sender.role) && (
                        <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.6rem', padding: '0.05rem 0.25rem', borderRadius: 4, marginLeft: '0.25rem' }}>PRO</span>
                      )}
                    </span>
                    <div style={{
                      background: isSelf ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.04)',
                      padding: '0.6rem 0.9rem',
                      borderRadius: 12,
                      fontSize: '0.85rem',
                      color: 'white',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      boxShadow: isSelf ? '0 2px 8px rgba(37,99,235,0.2)' : 'none'
                    }}>
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Votre question en direct..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 1rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
            />
            <button type="submit" style={{ background: '#2563eb', border: 'none', color: 'white', borderRadius: 10, height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              ✈️
            </button>
          </form>
        </div>

      </div>
    );
  };

  // Main Chat Room Interface
  return (
    <div style={{ background: '#06091a', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Main Container */}
      <div style={{ flex: 1, paddingTop: '100px', paddingBottom: '40px', maxWidth: 1400, width: '95%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Dynamic Frosted Header Row */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(to right, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💬 Salon : {activeLanguage.name}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: 0 }}>
                Échangez en temps réel avec d'autres étudiants en {activeLanguage.name} et assistez aux sessions de cours en direct.
              </p>
            </div>
            
            {/* Elegant Room Switcher Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>Changer de salon :</span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  value={activeLanguage._id}
                  onChange={(e) => {
                    const matched = languages.find(lang => lang._id === e.target.value);
                    if (matched) {
                      setActiveLanguage(matched);
                      toast.info(`Passage au salon : ${matched.name}`);
                    }
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    padding: '0.6rem 2.2rem 0.6rem 1rem',
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    minWidth: '160px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  {languages.map((lang) => (
                    <option key={lang._id} value={lang._id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                      {getFlag(lang.code)} {lang.name}
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '0.75rem' }}>▼</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Dynamic WebRTC Video Chat Call Control Button */}
            {!isInVideoCall ? (
              <button
                onClick={joinVideoCall}
                disabled={isConnectingCall}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  padding: '0.6rem 1.2rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)';
                }}
              >
                {isConnectingCall ? '🔄 Connexion...' : '🎥 Rejoindre le salon vidéo'}
              </button>
            ) : (
              <button
                onClick={handleExitClick}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  padding: '0.6rem 1.2rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)';
                }}
              >
                ❌ Quitter le salon vidéo
              </button>
            )}
            {/* Share Invitation Link Button */}
            <button
              onClick={() => {
                const inviteUrl = `${window.location.origin}/lounge?roomId=${activeLanguage._id}`;
                navigator.clipboard.writeText(inviteUrl);
                toast.success('Lien d’invitation copié dans le presse-papiers !');
              }}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                color: 'white',
                padding: '0.6rem 1.2rem',
                borderRadius: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(59,130,246,0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.2)';
              }}
              title="Copier le lien d'invitation pour les invités"
            >
              🔗 Partager l'appel
            </button>

            <button 
              onClick={() => setActiveLanguage(null)} 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#f8fafc', padding: '0.6rem 1.2rem', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              🔄 Tous les Salons
            </button>
            <Link to="/library" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '0.6rem 1.2rem', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              📚 Retour Bibliothèque
            </Link>
          </div>
        </div>

        {/* Dynamic Video Session Notification Banner */}
        {activeVideoSession && !isPlayingSession && (
          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.2) 100%)', border: '1px solid rgba(59,130,246,0.3)', color: 'white', borderRadius: 20, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 20px rgba(59,130,246,0.15)', animation: 'fadeInUp 0.5s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem', animation: 'pulse 1s infinite' }}>🔴</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cours Vidéo en Direct Actif
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, fontSize: '1.1rem', color: '#f8fafc' }}>
                  "{activeVideoSession.courseTitle}" par {activeVideoSession.sender}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPlayingSession(true)}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                color: 'white',
                borderRadius: 12,
                padding: '0.65rem 1.5rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)'}
            >
              📺 Rejoindre la session vidéo
            </button>
          </div>
        )}

        {/* Dynamic Teacher Broadcast Alert Banner */}
        {broadcastAlert && (
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.35) 100%)', border: '1px solid rgba(239,68,68,0.4)', color: 'white', borderRadius: 20, padding: '1.25rem 1.5rem', position: 'relative', display: 'flex', alignItems: 'center', gap: '1.25rem', animation: 'pulse 2s infinite', boxShadow: '0 4px 20px rgba(239,68,68,0.25)' }}>
            <span style={{ fontSize: '2rem' }}>📢</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Annonce En Direct de {broadcastAlert.sender}
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, fontSize: '1.05rem', color: '#fef2f2' }}>{broadcastAlert.text}</p>
            </div>
            <button onClick={() => setBroadcastAlert(null)} style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 900, padding: 0 }}>×</button>
          </div>
        )}

        {/* Main Lounge Grid or Video Player Split Panel */}
        {activeVideoSession && isPlayingSession ? (
          renderVideoCoursePlayer()
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isInVideoCall ? (isChatVisible ? '320px 1fr 350px' : '320px 1fr') : '320px 1fr', 
            gap: '1.5rem', 
            flex: 1, 
            minHeight: 600,
            transition: 'grid-template-columns 0.3s ease'
          }}>
            
            {/* Active Members Sidebar Panel */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(16px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👥 Étudiants En Ligne</span>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 700 }}>{onlineUsers.length}</span>
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="no-scrollbar">
                {onlineUsers.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>Aucun autre utilisateur en ligne</p>
                ) : (
                  onlineUsers.map((u, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.avatar ? `url(${getAvatarUrl(u.avatar)}) center/cover` : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                          {!u.avatar && u.username.charAt(0)}
                        </div>
                        {/* Live pulsing online indicator dot */}
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', position: 'absolute', bottom: -1, right: -1, border: '2px solid #06091a' }} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{u.username}</p>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Actif</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Privileged Live Video Course Trigger */}
              {isPrivileged && !activeVideoSession && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setShowStartModal(true)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0.75rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)';
                    }}
                  >
                    🎥 Lancer un cours vidéo
                  </button>
                </div>
              )}

              {/* Admin High-Priority Broadcast Module */}
              {isPrivileged && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f87171', margin: '0 0 0.6rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>📢 Diffusion Prioritaire</h4>
                  <form onSubmit={handleSendBroadcast}>
                    <textarea
                      placeholder="Diffuser une annonce à l'ensemble du salon..."
                      value={broadcastInput}
                      onChange={e => setBroadcastInput(e.target.value)}
                      style={{ width: '100%', minHeight: 70, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.6rem', color: 'white', fontSize: '0.8rem', resize: 'none', outline: 'none', transition: 'border-color 0.2s', lineHeight: 1.4 }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                    <button type="submit" style={{ width: '100%', marginTop: '0.6rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 12, padding: '0.6rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(220,38,38,0.2)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                      onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
                    >
                      Diffuser aux Étudiants
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Premium Glassmorphic WebRTC Video Chat Grid */}
            {isInVideoCall && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backdropFilter: 'blur(20px)',
                animation: 'fadeInUp 0.4s ease-out',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden'
              }}>
                {/* Grid Header & Quick Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                      Salon Vidéo Établi ({remotePeers.length + 1})
                    </h4>
                  </div>

                  {/* Integrated controls */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={toggleMute}
                      style={{
                        background: isMicMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: isMicMuted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isMicMuted ? '#f87171' : '#f1f5f9',
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        fontSize: '1.1rem'
                      }}
                      title={isMicMuted ? "Activer le micro" : "Couper le micro"}
                    >
                      {isMicMuted ? '🔇' : '🎙️'}
                    </button>
                    
                    <button
                      onClick={toggleCamera}
                      style={{
                        background: isCamOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: isCamOff ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isCamOff ? '#f87171' : '#f1f5f9',
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        fontSize: '1.1rem'
                      }}
                      title={isCamOff ? "Activer la caméra" : "Couper la caméra"}
                    >
                      {isCamOff ? '📷' : '📹'}
                    </button>

                    <button
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      style={{
                        background: isScreenSharing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: isScreenSharing ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isScreenSharing ? '#60a5fa' : '#f1f5f9',
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        fontSize: '1.1rem'
                      }}
                      title={isScreenSharing ? "Arrêter le partage d'écran" : "Partager l'écran"}
                    >
                      {isScreenSharing ? '🛑' : '🖥️'}
                    </button>

                    <button
                      onClick={() => setIsChatVisible(!isChatVisible)}
                      style={{
                        background: isChatVisible ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: isChatVisible ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isChatVisible ? '#34d399' : '#f1f5f9',
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        fontSize: '1.1rem'
                      }}
                      title={isChatVisible ? "Masquer le chat" : "Afficher le chat"}
                    >
                      💬
                    </button>
                    
                    <button
                      onClick={handleExitClick}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        color: 'white',
                        padding: '0 1rem',
                        height: '38px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 10px rgba(239,68,68,0.2)'
                      }}
                    >
                      🛑 Quitter
                    </button>
                  </div>
                </div>

                {/* Video Grid Layout based on Screen Share */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                  
                  {activeScreenShareUser && (
                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
                      {/* Local Avatar small (if not sharing) */}
                      {activeScreenShareUser !== 'local' && (
                        <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 16, background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          {!isCamOff && localStream ? (
                            <VideoStream stream={localStream} isMuted={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: user.avatar ? `url(${getAvatarUrl(user.avatar)}) center/cover` : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                              {!user.avatar && (user.firstName || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 4, fontSize: '0.55rem', color: 'white', textAlign: 'center', padding: '2px' }}>Moi</div>
                        </div>
                      )}
                      
                      {/* Remote peers small (if not sharing) */}
                      {remotePeers.filter(p => p.socketId !== activeScreenShareUser).map(peer => {
                        const isPeerCamOff = !peer.stream || !peer.stream.getVideoTracks().length || !peer.stream.getVideoTracks()[0].enabled;
                        return (
                          <div key={peer.socketId} style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 16, background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            {!isPeerCamOff ? (
                              <VideoStream stream={peer.stream} isMuted={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: peer.avatar ? `url(${getAvatarUrl(peer.avatar)}) center/cover` : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                {!peer.avatar && peer.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 4, fontSize: '0.55rem', color: 'white', textAlign: 'center', padding: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peer.username}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Main Video Area */}
                  <div style={{
                    flex: 1,
                    display: activeScreenShareUser ? 'flex' : 'grid',
                    gridTemplateColumns: activeScreenShareUser ? 'none' : 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    overflowY: 'auto',
                    paddingRight: '0.5rem'
                  }} className="no-scrollbar">
                    
                    {/* Render Local Feed (if not screen sharing or if no one is screen sharing) */}
                    {(!activeScreenShareUser || activeScreenShareUser === 'local') && (
                      <div style={{
                        position: 'relative',
                        width: activeScreenShareUser ? '100%' : 'auto',
                        aspectRatio: activeScreenShareUser ? 'auto' : '4/3',
                        height: activeScreenShareUser ? '100%' : 'auto',
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '2px solid rgba(59, 130, 246, 0.3)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                      }}>
                        {(!isCamOff && localStream) ? (
                          <VideoStream
                            stream={localStream}
                            isMuted={true}
                            style={{ width: '100%', height: '100%', objectFit: activeScreenShareUser ? 'contain' : 'cover', background: 'black' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'radial-gradient(circle, #1e293b 0%, #020617 100%)' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: user.avatar ? `url(${getAvatarUrl(user.avatar)}) center/cover` : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                              {!user.avatar && (user.firstName || user.email).charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Votre caméra est éteinte</span>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '0.35rem 0.5rem', borderRadius: '8px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>Moi</span>
                          {isMicMuted && <span style={{ fontSize: '0.8rem' }}>🔇</span>}
                        </div>
                      </div>
                    )}

                    {/* Render Remote Peers */}
                    {remotePeers.filter(p => !activeScreenShareUser || activeScreenShareUser === p.socketId).map(peer => {
                      const isPeerCamOff = !peer.stream || !peer.stream.getVideoTracks().length || !peer.stream.getVideoTracks()[0].enabled;
                      return (
                        <div key={peer.socketId} style={{
                          position: 'relative',
                          width: activeScreenShareUser ? '100%' : 'auto',
                          aspectRatio: activeScreenShareUser ? 'auto' : '4/3',
                          height: activeScreenShareUser ? '100%' : 'auto',
                          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '2px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                        }}>
                          {!isPeerCamOff ? (
                            <VideoStream
                              stream={peer.stream}
                              isMuted={false}
                              style={{ width: '100%', height: '100%', objectFit: activeScreenShareUser ? 'contain' : 'cover', background: 'black' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'radial-gradient(circle, #1e293b 0%, #020617 100%)' }}>
                              <div style={{ width: 64, height: 64, borderRadius: '50%', background: peer.avatar ? `url(${getAvatarUrl(peer.avatar)}) center/cover` : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                                {!peer.avatar && peer.username.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Caméra éteinte</span>
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '0.35rem 0.5rem', borderRadius: '8px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{peer.username}</span>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              </div>
            )}

            {/* Interactive Chat Console */}
            {(!isInVideoCall || isChatVisible) && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(16px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)', height: isInVideoCall ? 'auto' : '100%' }}>
              


              {/* Scrollable messages thread */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="no-scrollbar">
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '3rem' }}>
                    <span style={{ fontSize: '3rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.05))' }}>💬</span>
                    <p style={{ fontWeight: 700, margin: 0, color: '#94a3b8' }}>Salon d'étude vide</p>
                    <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0 0', color: '#64748b' }}>Démarrez la conversation en envoyant un message ci-dessous.</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isSelf = m.sender.id === user._id;
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignSelf: isSelf ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        gap: '0.75rem',
                        flexDirection: isSelf ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}>
                        
                        {/* Message Sender Avatar */}
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: m.sender.avatar ? `url(${getAvatarUrl(m.sender.avatar)}) center/cover` : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'white',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          {!m.sender.avatar && m.sender.name.charAt(0)}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                          
                          {/* Name & Role Header info */}
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.25rem', marginLeft: isSelf ? 0 : '0.25rem', marginRight: isSelf ? '0.25rem' : 0 }}>
                            {m.sender.name}
                            {['admin', 'superadmin', 'teacher'].includes(m.sender.role) && (
                              <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: 4, marginLeft: '0.35rem', fontWeight: 800 }}>PRO</span>
                            )}
                          </span>

                          {/* Text Bubble */}
                          <div style={{
                            background: isSelf ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.04)',
                            border: isSelf ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: isSelf ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                            padding: '0.8rem 1.2rem',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            lineHeight: 1.45,
                            boxShadow: isSelf ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                            wordBreak: 'break-word'
                          }}>
                            {m.text}
                          </div>

                          {/* Nice display timestamp */}
                          <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem', marginRight: isSelf ? '0.5rem' : 0, marginLeft: !isSelf ? '0.5rem' : 0 }}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message input area */}
              <form onSubmit={handleSendMessage} style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Rédigez votre message ici..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0.85rem 1.25rem', color: 'white', fontWeight: 500, outline: 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                />
                <button type="submit" style={{ background: '#2563eb', border: 'none', color: 'white', borderRadius: 14, height: 46, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
                >
                  ✈️
                </button>
              </form>

            </div>
            )}

          </div>
        )}

        {/* Premium Exit Choices Modal for Call Host */}
        {showExitModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 28,
              padding: '2.5rem',
              width: '90%',
              maxWidth: 500,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 45px rgba(239, 68, 68, 0.1)',
              backdropFilter: 'blur(25px)',
              position: 'relative',
              textAlign: 'center',
              animation: 'fadeInUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem', filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.3))' }}>⚠️</span>
              
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0 0 0.75rem 0', background: 'linear-gradient(to right, #f87171, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Quitter le salon vidéo
              </h3>
              
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
                Vous êtes l'organisateur de cette réunion. Souhaitez-vous simplement quitter le salon (les autres pourront continuer) ou y mettre fin pour tout le monde ?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={leaveVideoCall}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: 14,
                    padding: '0.85rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  🚪 Quitter simplement (Continuer sans moi)
                </button>
                
                <button
                  onClick={terminateVideoCallForAll}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: 14,
                    padding: '0.85rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  🛑 Terminer pour tous (Éjecter tout le monde)
                </button>

                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stunning Teacher Start Live Course Modal */}
        {showStartModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 28,
              padding: '2.5rem',
              width: '90%',
              maxWidth: 550,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.15)',
              backdropFilter: 'blur(20px)',
              position: 'relative'
            }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0 0 0.5rem 0', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🎥 Lancer un cours en direct
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                Entrez le titre et le lien de la vidéo pédagogique à diffuser en temps réel pour l'ensemble des étudiants connectés à ce salon.
              </p>

              <form onSubmit={handleStartVideoSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Titre du cours
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apprendre les verbes irréguliers en allemand"
                    value={courseTitleInput}
                    onChange={e => setCourseTitleInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 14,
                      padding: '0.85rem 1.25rem',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#10b981'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Lien URL de la vidéo (MP4)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="Ex: https://example.com/video.mp4"
                    value={videoUrlInput}
                    onChange={e => setVideoUrlInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 14,
                      padding: '0.85rem 1.25rem',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#10b981'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                    Saisissez un lien direct vers un fichier vidéo MP4 ou un flux compatible.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'white',
                      borderRadius: 12,
                      padding: '0.75rem 1.5rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: 'white',
                      borderRadius: 12,
                      padding: '0.75rem 1.5rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)';
                    }}
                  >
                    Lancer le cours
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <Footer />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

