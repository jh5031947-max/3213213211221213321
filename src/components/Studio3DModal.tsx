import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Move3d,
} from 'lucide-react';
import { JerseyProduct, JerseySize, PatchType } from '../types';
import { PATCH_OPTIONS } from '../data/products';
import { Jersey3DViewport } from './Jersey3DViewport';
import { JerseyCameraPreset } from '../three/jerseySceneRig';

interface Studio3DModalProps {
  product: JerseyProduct | null;
  initialName: string;
  initialNumber: string;
  initialPatch: PatchType;
  initialSize: JerseySize;
  onClose: () => void;
  onAddToCart: (payload: {
    product: JerseyProduct;
    customName: string;
    customNumber: string;
    patchType: PatchType;
    size: JerseySize;
    finalPrice: number;
  }) => void;
}

const SIZES: JerseySize[] = ['S', 'M', 'L', 'XL', '2XL'];

export const Studio3DModal: React.FC<Studio3DModalProps> = ({
  product,
  initialName,
  initialNumber,
  initialPatch,
  initialSize,
  onClose,
  onAddToCart,
}) => {
  const [customName, setCustomName] = useState<string>(initialName);
  const [customNumber, setCustomNumber] = useState<string>(initialNumber);
  const [patchType, setPatchType] = useState<PatchType>(initialPatch);
  const [size, setSize] = useState<JerseySize>(initialSize);
  const [view, setView] = useState<JerseyCameraPreset>('back');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setCustomName(initialName);
    setCustomNumber(initialNumber);
    setPatchType(initialPatch);
    setSize(initialSize);
    setView('back');
    setDockCollapsed(false);
  }, [product, initialName, initialNumber, initialPatch, initialSize]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (
        (e.key === 'h' || e.key === 'H') &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const patchObj =
    PATCH_OPTIONS.find((p) => p.value === patchType) || PATCH_OPTIONS[0];
  const finalPrice = product.price + patchObj.extraCost;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070C17] flex flex-col justify-between overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} 360도 3D 스튜디오`}
    >
      {/* Subtle Studio Radial Spotlight Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(30, 58, 138, 0.28) 0%, rgba(15, 23, 42, 0.65) 48%, rgba(7, 12, 23, 1) 100%)',
        }}
      />

      {/* Minimal Top Bar Overlay (No backdrop-filter over WebGL) */}
      <div className="relative z-10 px-5 sm:px-8 py-4 flex items-center justify-between gap-4 pointer-events-none">
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl px-4 py-2.5 pointer-events-auto">
          <div className="text-[11px] font-semibold text-pitch-500">
            {product.team} · 360° 3D 어센틱 스튜디오
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            {product.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl">
            <Move3d className="w-4 h-4 text-pitch-500" />
            드래그 회전 · 스크롤 확대
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>닫기</span>
          </button>
        </div>
      </div>

      {/* 100% Unobstructed Central 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Jersey3DViewport
          bgColor={product.bgColor}
          secondaryColor={product.secondaryColor}
          stripeColor={product.stripeColor}
          textColor={product.textColor}
          numberStrokeColor={product.numberStrokeColor}
          pattern={product.pattern}
          crestCode={product.crestCode}
          sponsorText={product.sponsorText}
          isNational={product.league === 'NATIONAL'}
          customName={customName}
          customNumber={customNumber}
          patchType={patchType}
          view={view}
          interactive={true}
          highRes={true}
        />
      </div>

      {/* Unified Collapsible Bottom Control Dock */}
      <div className="relative z-10 w-full max-w-[920px] mx-auto px-4 pb-5 flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-t-xl bg-slate-900 border border-b-0 border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-pitch-500" />
              <span>열기 (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-pitch-500" />
              <span>접기 (H)</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'front', label: '앞면' },
                    { id: 'back', label: '뒷면' },
                    { id: 'side', label: '측면' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setView(cam.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      view === cam.id
                        ? 'bg-pitch-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {product.presets.map((pr) => (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => {
                      setView('back');
                      setCustomName(pr.name);
                      setCustomNumber(pr.number);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  마킹 이름
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={customName}
                  onChange={(e) => {
                    setView('back');
                    setCustomName(e.target.value.toUpperCase());
                  }}
                  className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-3 text-xs font-bold text-white uppercase focus:outline-none focus:border-pitch-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  등번호
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={customNumber}
                  onChange={(e) => {
                    setView('back');
                    setCustomNumber(
                      e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
                    );
                  }}
                  className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-2 text-xs font-black text-center text-white tabular-nums focus:outline-none focus:border-pitch-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  슬리브 패치
                </label>
                <select
                  value={patchType}
                  onChange={(e) => {
                    setPatchType(e.target.value as PatchType);
                    if (e.target.value !== 'none') setView('side');
                  }}
                  className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pitch-500 cursor-pointer"
                >
                  {PATCH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  사이즈
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as JerseySize)}
                  className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-2.5 text-xs font-bold text-white focus:outline-none focus:border-pitch-500 cursor-pointer"
                >
                  {SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart({
                      product,
                      customName: customName.trim() || '노마킹',
                      customNumber: customName.trim() ? customNumber.trim() || '0' : '',
                      patchType,
                      size,
                      finalPrice,
                    });
                    onClose();
                  }}
                  className="w-full h-10 rounded-xl bg-pitch-500 hover:bg-pitch-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap tabular-nums"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>담기 ₩{(finalPrice / 1000).toFixed(0)}k</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
