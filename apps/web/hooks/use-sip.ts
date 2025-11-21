'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Inviter, UserAgent, Registerer, SessionState } from 'sip.js';

interface SIPConfig {
  sipServer: string;
  sipUser: string;
  sipPassword: string;
  sipDomain: string;
}

interface CallSession {
  phoneNumber: string;
  direction: 'outgoing' | 'incoming';
  status: 'connecting' | 'ringing' | 'connected' | 'ended';
  startTime: Date | null;
  duration: number;
}

export function useSIP(config?: SIPConfig) {
  const [userAgent, setUserAgent] = useState<UserAgent | null>(null);
  const [registered, setRegistered] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<any>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SIP UserAgent
  const initialize = useCallback(async () => {
    if (!config || !config.sipServer || !config.sipUser) {
      console.warn('SIP configuration not provided');
      return;
    }

    try {
      const uri = UserAgent.makeURI(`sip:${config.sipUser}@${config.sipDomain}`);
      if (!uri) {
        throw new Error('Failed to create URI');
      }

      const transportOptions = {
        server: config.sipServer,
      };

      const ua = new UserAgent({
        uri,
        transportOptions,
        authorizationUsername: config.sipUser,
        authorizationPassword: config.sipPassword,
        sessionDescriptionHandlerFactoryOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });

      await ua.start();
      setUserAgent(ua);

      // Setup registerer
      const registerer = new Registerer(ua);
      registererRef.current = registerer;

      registerer.stateChange.addListener((state) => {
        setRegistered(state === 'Registered');
      });

      await registerer.register();
    } catch (error) {
      console.error('Failed to initialize SIP:', error);
    }
  }, [config]);

  // Make a call
  const makeCall = useCallback(
    async (phoneNumber: string) => {
      if (!userAgent || !registered) {
        console.error('UserAgent not initialized or not registered');
        return;
      }

      try {
        const target = UserAgent.makeURI(`sip:${phoneNumber}@${config?.sipDomain}`);
        if (!target) {
          throw new Error('Failed to create target URI');
        }

        const inviter = new Inviter(userAgent, target);
        sessionRef.current = inviter;

        setCurrentCall({
          phoneNumber,
          direction: 'outgoing',
          status: 'connecting',
          startTime: null,
          duration: 0,
        });

        inviter.stateChange.addListener((state: SessionState) => {
          if (state === SessionState.Establishing) {
            setCurrentCall((prev) => prev && { ...prev, status: 'ringing' });
          } else if (state === SessionState.Established) {
            const startTime = new Date();
            setCurrentCall((prev) => prev && { ...prev, status: 'connected', startTime });
            
            // Start duration counter
            durationIntervalRef.current = setInterval(() => {
              setCurrentCall((prev) => {
                if (!prev || !prev.startTime) return prev;
                const duration = Math.floor((Date.now() - prev.startTime.getTime()) / 1000);
                return { ...prev, duration };
              });
            }, 1000);
          } else if (state === SessionState.Terminated) {
            setCurrentCall((prev) => prev && { ...prev, status: 'ended' });
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
            }
            setTimeout(() => setCurrentCall(null), 2000);
          }
        });

        await inviter.invite();
      } catch (error) {
        console.error('Failed to make call:', error);
        setCurrentCall(null);
      }
    },
    [userAgent, registered, config]
  );

  // Hangup call
  const hangup = useCallback(async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.bye();
      } catch (error) {
        console.error('Failed to hangup:', error);
      }
      sessionRef.current = null;
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setCurrentCall(null);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (sessionRef.current) {
      const pc = sessionRef.current.sessionDescriptionHandler?.peerConnection;
      if (pc) {
        const senders = pc.getSenders();
        senders.forEach((sender: RTCRtpSender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = isMuted;
          }
        });
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (sessionRef.current) {
        sessionRef.current.bye();
      }
      if (registererRef.current) {
        registererRef.current.unregister();
      }
      if (userAgent) {
        userAgent.stop();
      }
    };
  }, [userAgent]);

  return {
    initialize,
    makeCall,
    hangup,
    toggleMute,
    registered,
    currentCall,
    isMuted,
  };
}
