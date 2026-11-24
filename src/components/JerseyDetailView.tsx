import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Move3d,
  Maximize2,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import {
  JerseyProduct,
  JerseySize,
  KitGrade,
  MarkingMode,
  PatchType,
} from '../types';
import { PATCH_OPTIONS, PRODUCTS_DATA } from '../data/products';
import { Jersey3DViewport } from './Jersey3DViewport';
import { JerseyCameraPreset } from '../three/jerseySceneRig';
import { JerseyCard } from './JerseyCard';

interface JerseyDetailViewProps {
  product: JerseyProduct;
  isModalOpen: boolean;
  onBackToCatalog: () => void;
  onSelectProduct: (product: JerseyProduct) => void;
  onOpenStudioModal: (state: {
    product: JerseyProduct;
    customName: string;
    customNumber: string;
    patchType: PatchType;
    size: JerseySize;
  }) => void;
  onAddToCart: (payload: {
    product: JerseyProduct;
    grade: KitGrade;
    gradeLabel: string;
    customName: string;
    customNumber: string;
    patchType: PatchType;
    size: JerseySize;
    quantity: number;
    finalPrice: number;
    openCheckoutDirectly?: boolean;
  }) => void;
  onOpenSizeGuide: () => void;
}

const SIZES: JerseySize[] = ['S', 'M', 'L', 'XL', '2XL'];
const REPLICA_DISCOUNT = 30000;

export const JerseyDetailView: React.FC<JerseyDetailViewProps> = ({
  product,
  isModalOpen,
  onBackToCatalog,
  onSelectProduct,
  onOpenStudioModal,
  onAddToCart,
  onOpenSizeGuide,
}) => {
  const [grade, setGrade] = useState<KitGrade>('authentic');
  const [size, setSize] = useState<JerseySize>('L');
  const [markingMode, setMarkingMode] = useState<MarkingMode>('player');
  const [customName, setCustomName] = useState<string>(product.defaultName);
  const [customNumber, setCustomNumber] = useState<string>(product.defaultNum);
  const [patchType, setPatchType] = useState<PatchType>('none');
  const [quantity, setQuantity] = useState<number>(1);
  const [view, setView] = useState<JerseyCameraPreset>('back');
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Reset options when switching to a different jersey
  useEffect(() => {
    setGrade('authentic');
    setSize('L');
    setMarkingMode('player');
    setCustomName(product.defaultName);
    setCustomNumber(product.defaultNum);
    setPatchType('none');
    setQuantity(1);
    setView('back');
    setJustAdded(false);
  }, [product]);

  const selectedPatchObj =
    PATCH_OPTIONS.find((opt) => opt.value === patchType) || PATCH_OPTIONS[0];

  const baseKitPrice =
    grade === 'authentic' ? product.price : Math.max(89000, product.price - REPLICA_DISCOUNT);
  const unitPrice = baseKitPrice + selectedPatchObj.extraCost;
  const totalPrice = unitPrice * quantity;

  const activeMarkingName = markingMode === 'none' ? '' : customName;
  const activeMarkingNumber = markingMode === 'none' ? '' : customNumber;

  const gradeLabel =
    grade === 'authentic' ? '어센틱 (선수지급용)' : '스타디움 (레플리카)';

  const handleModeChange = (mode: MarkingMode) => {
    setMarkingMode(mode);
    if (mode === 'none') {
      setView('front');
    } else if (mode === 'player') {
      const matched = product.presets.find(
        (p) => p.name === customName && p.number === customNumber
      );
      if (!matched && product.presets[0]) {
        setCustomName(product.presets[0].name);
        setCustomNumber(product.presets[0].number);
      }
      setView('back');
    } else {
      setView('back');
    }
  };

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarkingMode('custom');
    setView('back');
    setCustomName(e.target.value.toUpperCase());
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setMarkingMode('custom');
    setView('back');
    setCustomNumber(digits);
  };

  const submitCart = (openCheckoutDirectly: boolean) => {
    const finalName =
      markingMode === 'none' ? '노마킹' : customName.trim() || 'NO NAME';
    const finalNum =
      markingMode === 'none' ? '' : customNumber.trim() || '0';

    onAddToCart({
      product,
      grade,
      gradeLabel,
      customName: finalName,
      customNumber: finalNum,
      patchType,
      size,
      quantity,
      finalPrice: unitPrice,
      openCheckoutDirectly,
    });

    if (!openCheckoutDirectly) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1600);
    }
  };

  const relatedProducts = PRODUCTS_DATA.filter((p) => p.id !== product.id)
    .sort((a, b) => (a.league === product.league ? -1 : b.league === product.league ? 1 : 0))
    .slice(0, 3);

  return (
    <div className="flex-1 bg-[#F8FAFC] pb-24 lg:pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-pitch-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>목록으로</span>
          </button>

          <nav
            aria-label="현재 위치"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate"
          >
            <button
              type="button"
              onClick={onBackToCatalog}
              className="hover:text-slate-800 cursor-pointer"
            >
              컬렉션
            </button>
            <span aria-hidden="true">/</span>
            <span>{product.leagueLabel}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-700 font-semibold truncate">
              {product.team}
            </span>
          </nav>
        </div>
      </div>

      {/* Main 2-Column Product Detail & 3D Studio Layout */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-start">
          {/* LEFT COLUMN (7 Cols): Sticky 360° 3D Studio Stage + Craftsmanship Specs */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-5">
            <div
              className="rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 42%, #1E293B 0%, #0F172A 58%, #070C16 100%)',
              }}
            >
              {/* Stage Toolbar */}
              <div className="px-4 sm:px-5 pt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <Move3d className="w-4 h-4 text-pitch-500 shrink-0" />
                  <span>드래그 회전 · 스크롤 확대</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
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
                        className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          view === cam.id
                            ? 'bg-pitch-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cam.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenStudioModal({
                        product,
                        customName: activeMarkingName,
                        customNumber: activeMarkingNumber,
                        patchType,
                        size,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-pitch-500" />
                    <span>전체</span>
                  </button>
                </div>
              </div>

              {/* 3D Interactive Viewport */}
              <div className="h-[420px] sm:h-[510px] lg:h-[540px] w-full">
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
                  customName={activeMarkingName}
                  customNumber={activeMarkingNumber}
                  patchType={patchType}
                  view={view}
                  interactive={!isModalOpen}
                  highRes={true}
                />
              </div>

              {/* Bottom Live Config Summary Strip */}
              <div className="px-5 py-2.5 bg-slate-950/75 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-white tabular-nums">
                  {markingMode === 'none'
                    ? '노마킹'
                    : `${activeMarkingName || 'NO NAME'} ${activeMarkingNumber || '0'}`}
                </span>
                <span className="font-semibold text-pitch-500">
                  {patchType === 'none'
                    ? '기본 패치'
                    : `+ ${selectedPatchObj.shortBadge}`}
                </span>
              </div>
            </div>

            {/* Clean Hairline Specification Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 text-xs">
              <div className="py-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-pitch-600" />
                  원단 · 핏
                </span>
                <p className="text-slate-500 leading-relaxed">
                  {grade === 'authentic'
                    ? `${product.editionNote} · 초경량 자카드 메쉬`
                    : '편안한 스탠다드 핏 · 자수 엠블럼'}
                </p>
              </div>
              <div className="py-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-pitch-600" />
                  정품 열프레스
                </span>
                <p className="text-slate-500 leading-relaxed">
                  공식 오피셜 네임셋 150°C 정밀 압착.
                </p>
              </div>
              <div className="py-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Truck className="w-3.5 h-3.5 text-pitch-600" />
                  당일 출고
                </span>
                <p className="text-slate-500 leading-relaxed">
                  평일 15시 이전 주문 시 당일 마킹 발송.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 Cols): High-Readability, Airy Configuration Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            {/* Title & Live Price Header */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="text-pitch-600 font-bold">{product.team}</span>
                  <span aria-hidden="true">·</span>
                  <span>{product.leagueLabel}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">정품 인증</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {product.title}
              </h1>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  ₩{unitPrice.toLocaleString()}
                </span>
                {selectedPatchObj.extraCost > 0 && (
                  <span className="text-xs font-semibold text-pitch-600 tabular-nums">
                    +패치 ₩{selectedPatchObj.extraCost.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* 1. 등급 */}
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-2">
                등급
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGrade('authentic')}
                  className={`px-3.5 py-2.5 rounded-xl text-left transition cursor-pointer ${
                    grade === 'authentic'
                      ? 'border-2 border-slate-900 bg-slate-50 text-slate-900'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">어센틱</div>
                  <div className="text-xs mt-0.5 font-semibold text-pitch-600 tabular-nums">
                    ₩{product.price.toLocaleString()}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGrade('replica')}
                  className={`px-3.5 py-2.5 rounded-xl text-left transition cursor-pointer ${
                    grade === 'replica'
                      ? 'border-2 border-slate-900 bg-slate-50 text-slate-900'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">레플리카</div>
                  <div className="text-xs mt-0.5 font-semibold text-slate-500 tabular-nums">
                    ₩{Math.max(89000, product.price - REPLICA_DISCOUNT).toLocaleString()}
                  </div>
                </button>
              </div>
            </div>

            {/* 2. 사이즈 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">사이즈</span>
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                >
                  사이즈표
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`h-9 rounded-lg text-xs font-bold transition cursor-pointer ${
                      size === sz
                        ? 'border-2 border-slate-900 bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 등판 마킹 */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block">
                등판 마킹
              </span>

              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { id: 'player', label: '선수 선택' },
                    { id: 'custom', label: '직접 입력' },
                    { id: 'none', label: '노마킹' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModeChange(m.id)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      markingMode === m.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {markingMode === 'player' && (
                <div className="grid grid-cols-3 gap-1.5">
                  {product.presets.map((preset) => {
                    const isSelected =
                      customName === preset.name && customNumber === preset.number;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setView('back');
                          setCustomName(preset.name);
                          setCustomNumber(preset.number);
                        }}
                        className={`h-9 px-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap truncate ${
                          isSelected
                            ? 'border-2 border-pitch-500 bg-pitch-50 text-pitch-700'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {markingMode === 'custom' && (
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <label
                      htmlFor="detail-custom-name"
                      className="text-[11px] font-semibold text-slate-500 block mb-1"
                    >
                      이름
                    </label>
                    <input
                      id="detail-custom-name"
                      type="text"
                      value={customName}
                      onChange={handleNameInput}
                      maxLength={12}
                      placeholder="SON"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-pitch-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <label
                      htmlFor="detail-custom-number"
                      className="text-[11px] font-semibold text-slate-500 block mb-1"
                    >
                      번호
                    </label>
                    <input
                      id="detail-custom-number"
                      type="text"
                      inputMode="numeric"
                      value={customNumber}
                      onChange={handleNumberInput}
                      maxLength={2}
                      placeholder="7"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-black text-center text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:border-pitch-500"
                    />
                  </div>
                </div>
              )}

              {markingMode === 'none' && (
                <p className="text-xs text-slate-500 py-1.5">
                  마킹 없이 깔끔한 무지 상태로 발송됩니다.
                </p>
              )}
            </div>

            {/* 4. 슬리브 패치 (Compact 3-Col Row) */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-2">
                슬리브 패치
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'none' as const, title: '없음', price: '기본' },
                    { value: 'league' as const, title: '리그', price: '+₩8,000' },
                    { value: 'champs' as const, title: '챔스', price: '+₩10,000' },
                  ]
                ).map((opt) => {
                  const isActive = patchType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPatchType(opt.value);
                        if (opt.value !== 'none' && view === 'front') {
                          setView('side');
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-center transition cursor-pointer ${
                        isActive
                          ? 'border-2 border-slate-900 bg-slate-50 text-slate-900'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">
                        {opt.title}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 tabular-nums font-semibold ${
                          isActive && opt.value !== 'none'
                            ? 'text-pitch-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {opt.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. 수량 & 합계 + 구매 버튼 */}
            <div className="pt-4 border-t border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                    aria-label="수량 감소"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-black text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                    aria-label="수량 증가"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    총 결제 금액
                  </span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">
                    ₩{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => submitCart(false)}
                  className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap border ${
                    justAdded
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-pitch-500" />
                      <span>담기 완료</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>장바구니</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => submitCart(true)}
                  className="h-11 rounded-xl bg-pitch-500 hover:bg-pitch-600 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap shadow-xs"
                >
                  바로 구매
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related / Other Club Jerseys Strip */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 mt-14 pt-10 border-t border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            다른 구단 유니폼
          </h2>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="text-xs font-bold text-pitch-600 hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            전체 보기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.map((rel) => (
            <JerseyCard
              key={rel.id}
              product={rel}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Mobile Sticky Bottom Buy Bar (Compact <= 15% mobile height) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[11px] text-slate-500 block">
            {size} · {markingMode === 'none' ? '노마킹' : `${activeMarkingName} ${activeMarkingNumber}`}
          </span>
          <span className="text-base font-black text-slate-900 tabular-nums">
            ₩{totalPrice.toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          onClick={() => submitCart(true)}
          className="h-10 px-5 rounded-xl bg-pitch-500 hover:bg-pitch-600 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
        >
          구매하기
        </button>
      </div>
    </div>
  );
};
