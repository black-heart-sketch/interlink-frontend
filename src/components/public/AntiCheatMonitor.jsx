import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { useTranslation } from 'react-i18next';
import { Camera, AlertTriangle } from 'lucide-react';

export default function AntiCheatMonitor({ onViolation, active = true }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [error, setError] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const streamRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Load model
  useEffect(() => {
    let mounted = true;
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (mounted) setModel(loadedModel);
      } catch (err) {
        console.error('Failed to load TF model', err);
        if (mounted) setError(t('anti_cheat.load_failed'));
      }
    };
    loadModel();
    return () => { mounted = false; };
  }, []);

  // Setup camera
  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsMonitoring(true);
        }
      } catch (err) {
        console.error('Webcam access denied', err);
        setError(t('anti_cheat.camera_required'));
        // Trigger violation immediately if camera is denied
        onViolation(t('anti_cheat.camera_denied'));
      }
    };

    if (active && !streamRef.current) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [active, onViolation]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    setIsMonitoring(false);
  };

  // Run inference
  useEffect(() => {
    if (!active || !model || !isMonitoring || !videoRef.current) return;

    const analyzeFrame = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const predictions = await model.detect(videoRef.current);
          
          // Check for forbidden objects
          const forbidden = predictions.find(p => 
            ['cell phone', 'laptop', 'tv', 'remote', 'keyboard'].includes(p.class) && p.score > 0.55
          );

          if (forbidden) {
            onViolation(t('anti_cheat.forbidden_device', { device: forbidden.class }));
          }
        } catch (err) {
          console.warn('Inference error', err);
        }
      }
    };

    checkIntervalRef.current = setInterval(analyzeFrame, 1500); // Check every 1.5s

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [active, model, isMonitoring, onViolation]);

  if (!active) return null;

  return (
    <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-black z-50">
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-red-950/50">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
          <span className="text-[10px] text-red-200 leading-tight">{error}</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {t('anti_cheat.monitoring')}
          </div>
          {!model && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <span className="text-xs text-slate-400">{t('anti_cheat.loading_ai')}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
