import React, { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { JerseyProduct } from '../types';
import { Jersey3DViewport } from './Jersey3DViewport';
import { JerseyCameraPreset } from '../three/jerseySceneRig';

interface JerseyCardProps {
  product: JerseyProduct;
  onSelectProduct: (product: JerseyProduct) => void;
}

export const JerseyCard: React.FC<JerseyCardProps> = ({
  product,
  onSelectProduct,
}) => {
  const [previewView, setPreviewView] = useState<JerseyCameraPreset>('front');

  const handleToggleAngle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewView((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  return (
    <article
      onClick={() => onSelectProduct(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectProduct(product);
        }
      }}
      className="group bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_36px_-14px_rgba(15,23,42,0.14)] cursor-pointer focus-visible:outline-2 focus-visible:outline-pitch-500"
    >
      {/* Top 3D Studio Preview */}
      <div>
        <div
          className="relative rounded-xl h-80 overflow-hidden mb-4 border border-slate-800"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, #1E293B 0%, #0F172A 58%, #070C16 100%)',
          }}
        >
          <div className="w-full h-full p-2 transition-transform duration-300 group-hover:scale-[1.04]">
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
              customName={product.defaultName}
              customNumber={product.defaultNum}
              patchType="none"
              view={previewView}
              interactive={false}
              alt={`${product.title} 3D 미리보기`}
            />
          </div>

          {/* Subtle View Toggle (Front Emblem vs Back Marking) */}
          <button
            type="button"
            onClick={handleToggleAngle}
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title="앞면 / 뒷면 3D 미리보기 전환"
          >
            <RotateCcw className="w-3 h-3 text-pitch-500" />
            <span>{previewView === 'front' ? '뒷면' : '앞면'}</span>
          </button>

          {/* Subtle Hover Cue */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between pointer-events-none text-[11px] font-medium text-slate-300">
            <span>{product.defaultName} {product.defaultNum}</span>
            <span className="text-pitch-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              3D 커스텀
            </span>
          </div>
        </div>

        {/* Clean Unboxed Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
          <span className="text-pitch-600 font-semibold">{product.team}</span>
          <span aria-hidden="true">·</span>
          <span>{product.leagueLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{product.statusNote}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-pitch-600 transition-colors">
          {product.title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{product.editionNote}</p>
      </div>

      {/* Price & Enter Customizer Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-slate-900 tabular-nums">
            ₩{product.price.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            레플리카 ₩{(product.price - 30000).toLocaleString()}~
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-pitch-600 transition-colors whitespace-nowrap shrink-0">
          <span>설정</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
};
