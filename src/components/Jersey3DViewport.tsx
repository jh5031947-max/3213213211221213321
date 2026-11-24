import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KitPattern, PatchType } from '../types';
import {
  createJerseyStudioRig,
  JerseyCameraPreset,
  JerseyStudioRig,
} from '../three/jerseySceneRig';
import { bake3DJerseySnapshot } from '../three/jerseyBaker';
import { JerseyTextureSpec } from '../three/jerseyTextures';

interface Jersey3DViewportProps {
  bgColor: string;
  secondaryColor: string;
  stripeColor: string;
  textColor: string;
  numberStrokeColor: string;
  pattern: KitPattern;
  crestCode: string;
  sponsorText?: string;
  isNational?: boolean;
  customName: string;
  customNumber: string;
  patchType: PatchType;
  view: JerseyCameraPreset;
  interactive?: boolean;
  highRes?: boolean;
  alt?: string;
  className?: string;
}

export const Jersey3DViewport: React.FC<Jersey3DViewportProps> = ({
  bgColor,
  secondaryColor,
  stripeColor,
  textColor,
  numberStrokeColor,
  pattern,
  crestCode,
  sponsorText = '',
  isNational = false,
  customName,
  customNumber,
  patchType,
  view,
  interactive = true,
  highRes = false,
  alt,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<JerseyStudioRig | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string>('');
  const [webglFailed, setWebglFailed] = useState<boolean>(false);

  const spec: JerseyTextureSpec = useMemo(
    () => ({
      bgColor,
      secondaryColor,
      stripeColor,
      textColor,
      numberStrokeColor,
      pattern,
      crestCode,
      sponsorText,
      isNational,
      customName,
      customNumber,
      patchType,
    }),
    [
      bgColor,
      secondaryColor,
      stripeColor,
      textColor,
      numberStrokeColor,
      pattern,
      crestCode,
      sponsorText,
      isNational,
      customName,
      customNumber,
      patchType,
    ]
  );

  // Non-interactive cards & thumbnails use singleton offscreen 3D WebGL baking
  useEffect(() => {
    if (interactive) return;
    let cancelled = false;
    bake3DJerseySnapshot(spec, view).then((url) => {
      if (!cancelled && url) {
        setSnapshotUrl(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [interactive, spec, view]);

  // Interactive studios mount a persistent isolated WebGL canvas once
  useEffect(() => {
    if (!interactive) return;
    const container = mountRef.current;
    if (!container) return;

    let rig: JerseyStudioRig | null = null;
    try {
      rig = createJerseyStudioRig(container, {
        interactive: true,
        highRes,
        initialView: view,
        initialSpec: spec,
      });
      rigRef.current = rig;
      setWebglFailed(false);
    } catch {
      setWebglFailed(true);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          rig?.resize(width, height);
        }
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      rig?.dispose();
      rigRef.current = null;
    };
    // Mount once for interactive container; props update via dedicated effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, highRes]);

  useEffect(() => {
    if (!interactive || !rigRef.current) return;
    rigRef.current.updateSpec(spec);
  }, [interactive, spec]);

  useEffect(() => {
    if (!interactive || !rigRef.current) return;
    rigRef.current.setCameraPreset(view, false);
  }, [interactive, view]);

  if (!interactive) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        {snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt={alt || `${crestCode} 3D 유니폼`}
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-contain block select-none"
          />
        ) : (
          <div className="w-24 h-28 rounded-2xl bg-slate-800/40 animate-pulse" />
        )}
      </div>
    );
  }

  if (webglFailed) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${className}`}
      >
        <div
          className="w-20 h-24 rounded-xl border border-white/20 flex flex-col items-center justify-center shadow-lg mb-2"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          <span className="text-xs font-black">{crestCode}</span>
          <span className="text-2xl font-black tabular-nums">
            {customNumber || '0'}
          </span>
        </div>
        <span className="text-xs font-bold text-slate-300">
          {customName || crestCode}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}
    />
  );
};
