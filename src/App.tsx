/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  X,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Move3d,
} from 'lucide-react';
import {
  CartItem,
  InfoModalTab,
  JerseyProduct,
  JerseySize,
  KitGrade,
  LeagueFilter,
  OrderReceipt,
  PatchType,
} from './types';
import { LEAGUE_FILTERS, PATCH_OPTIONS, PRODUCTS_DATA } from './data/products';
import { JerseyCard } from './components/JerseyCard';
import { JerseyDetailView } from './components/JerseyDetailView';
import { Jersey3DViewport } from './components/Jersey3DViewport';
import { Studio3DModal } from './components/Studio3DModal';
import { TeamCalculator } from './components/TeamCalculator';
import { CartDrawer } from './components/CartDrawer';
import { InfoModal } from './components/InfoModal';
import { JerseyCameraPreset } from './three/jerseySceneRig';

type SortOption = 'popular' | 'price-asc' | 'price-desc';
type PageRoute =
  | { view: 'catalog' }
  | { view: 'detail'; productId: string }
  | { view: 'team-order' };

const CART_STORAGE_KEY = 'pitchgear_cart_v1';

function parseHashRoute(): PageRoute {
  if (typeof window === 'undefined') return { view: 'catalog' };
  const h = window.location.hash;
  if (h.startsWith('#product/')) {
    const id = h.replace('#product/', '').trim();
    if (PRODUCTS_DATA.some((p) => p.id === id)) {
      return { view: 'detail', productId: id };
    }
  }
  if (h === '#team-order') {
    return { view: 'team-order' };
  }
  return { view: 'catalog' };
}

export default function App() {
  // Page Route State synced with URL Hash
  const [route, setRoute] = useState<PageRoute>(parseHashRoute);

  // Filter, Search & Sort State
  const [activeLeague, setActiveLeague] = useState<LeagueFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  // Hero Interactive 3D Showcase State
  const [heroPlayerIdx, setHeroPlayerIdx] = useState<number>(0);
  const [heroView, setHeroView] = useState<JerseyCameraPreset>('back');

  const heroShowcases = useMemo(() => {
    const ids = ['spurs', 'psg', 'bayern'];
    return ids
      .map((id) => PRODUCTS_DATA.find((p) => p.id === id))
      .filter((p): p is JerseyProduct => Boolean(p));
  }, []);
  const currentHeroKit = heroShowcases[heroPlayerIdx] || PRODUCTS_DATA[0];

  // Full-Screen 3D Studio Modal State
  const [studioModalState, setStudioModalState] = useState<{
    product: JerseyProduct;
    customName: string;
    customNumber: string;
    patchType: PatchType;
    size: JerseySize;
  } | null>(null);

  // Cart & Modals State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartInitialStep, setCartInitialStep] = useState<'cart' | 'checkout'>(
    'cart'
  );
  const [lastReceipt, setLastReceipt] = useState<OrderReceipt | null>(null);
  const [infoModalTab, setInfoModalTab] = useState<InfoModalTab | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Listen to browser back/forward hash changes
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (next: PageRoute) => {
    setRoute(next);
    if (next.view === 'detail') {
      window.location.hash = `product/${next.productId}`;
    } else if (next.view === 'team-order') {
      window.location.hash = 'team-order';
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activeProduct = useMemo(() => {
    if (route.view !== 'detail') return null;
    return PRODUCTS_DATA.find((p) => p.id === route.productId) || null;
  }, [route]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const list = PRODUCTS_DATA.filter((product) => {
      const matchesLeague =
        activeLeague === 'all' || product.league === activeLeague;
      if (!matchesLeague) return false;
      if (!q) return true;

      const inBasicFields =
        product.title.toLowerCase().includes(q) ||
        product.team.toLowerCase().includes(q) ||
        product.leagueLabel.toLowerCase().includes(q) ||
        product.defaultName.toLowerCase().includes(q);

      const inPresets = product.presets.some(
        (pr) =>
          pr.label.toLowerCase().includes(q) ||
          pr.name.toLowerCase().includes(q) ||
          pr.number === q
      );

      return inBasicFields || inPresets;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [activeLeague, searchQuery, sortBy]);

  const totalCartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleAddToCart = ({
    product,
    grade = 'authentic',
    gradeLabel = '어센틱 (선수지급용)',
    customName,
    customNumber,
    patchType,
    size,
    quantity = 1,
    finalPrice,
    openCheckoutDirectly = false,
  }: {
    product: JerseyProduct;
    grade?: KitGrade;
    gradeLabel?: string;
    customName: string;
    customNumber: string;
    patchType: PatchType;
    size: JerseySize;
    quantity?: number;
    finalPrice: number;
    openCheckoutDirectly?: boolean;
  }) => {
    const patchObj =
      PATCH_OPTIONS.find((p) => p.value === patchType) || PATCH_OPTIONS[0];
    const patchShortLabel =
      patchType === 'none'
        ? '패치 없음'
        : patchType === 'league'
        ? '오피셜 리그 패치'
        : '챔피언스리그 패치';

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          (item.grade || 'authentic') === grade &&
          item.customName === customName &&
          item.customNumber === customNumber &&
          item.patchType === patchType &&
          item.size === size
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      const newItem: CartItem = {
        cartId: `${product.id}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        productId: product.id,
        team: product.team,
        title: product.title,
        grade,
        gradeLabel,
        unitPrice: finalPrice || product.price + patchObj.extraCost,
        quantity,
        size,
        customName,
        customNumber,
        patchType,
        patchLabel: patchShortLabel,
        bgColor: product.bgColor,
        secondaryColor: product.secondaryColor,
        stripeColor: product.stripeColor,
        textColor: product.textColor,
        numberStrokeColor: product.numberStrokeColor,
        pattern: product.pattern,
        crestCode: product.crestCode,
        wornImage: product.wornImage,
      };
      return [...prev, newItem];
    });

    const markingText =
      customName === '노마킹'
        ? '노마킹(무지)'
        : `${customName} ${customNumber}`;
    showToast(`${product.team} [${markingText} · ${size}] 장바구니에 담았습니다.`);
    setCartInitialStep(openCheckoutDirectly ? 'checkout' : 'cart');
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const handleCompleteOrder = (receipt: OrderReceipt) => {
    setLastReceipt(receipt);
    setCart([]);
    showToast(`주문(${receipt.orderNumber})이 완료되었습니다.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      {/* ================= TOP BAR (Strict 3-Zone Contract) ================= */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 px-4 lg:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigateTo({ view: 'catalog' })}
          className="font-display font-black text-xl sm:text-2xl tracking-tighter text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          PITCH<span className="text-pitch-500">GEAR</span>
        </button>

        {/* Zone 2: 4 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => navigateTo({ view: 'catalog' })}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              route.view === 'catalog' ? 'text-slate-900 font-bold' : ''
            }`}
          >
            컬렉션
          </button>
          <button
            type="button"
            onClick={() => navigateTo({ view: 'team-order' })}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              route.view === 'team-order' ? 'text-slate-900 font-bold' : ''
            }`}
          >
            단체견적
          </button>
          <button
            type="button"
            onClick={() => setInfoModalTab('guide')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            가이드
          </button>
          <button
            type="button"
            onClick={() => setInfoModalTab('authenticity')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            정품보증
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setCartInitialStep('cart');
              setIsCartOpen(true);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-pitch-500" />
            <span>장바구니</span>
            <span className="text-pitch-500 font-black tabular-nums">
              {totalCartCount}
            </span>
          </button>
        </div>
      </header>

      {/* ================= ROUTE 1: STOREFRONT CATALOG HOME ================= */}
      {route.view === 'catalog' && (
        <>
          {/* Concise Hero Spotlight */}
          <section className="bg-gradient-to-b from-white via-pitch-50/40 to-[#F8FAFC] border-b border-slate-200 py-10 lg:py-14 px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Left Copy Column (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold text-pitch-600 tracking-wide">
                  <span>24/25 공식 시즌 어센틱 스토어</span>
                  <span aria-hidden="true">·</span>
                  <span>360° 3D 커스텀 스튜디오</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.16] tracking-tight text-balance">
                  원하는 구단을 선택하고{' '}
                  <span className="text-pitch-500">나만의 3D 유니폼을 완성하세요</span>
                </h1>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                  컬렉션에서 마음에 드는 유니폼을 클릭해 들어가 보세요. 입체 3D 테일러드 핏 위에서 킷 등급, 사이즈, 오피셜 마킹과 슬리브 패치까지 360° 회전하며 디테일하게 맞출 수 있습니다.
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href="#collection"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-pitch-500 hover:bg-pitch-600 text-white text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
                  >
                    <span>컬렉션 보기</span>
                    <ArrowDown className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => navigateTo({ view: 'team-order' })}
                    className="inline-flex items-center h-11 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    단체견적
                  </button>
                </div>

                {/* Adjacent Claim-to-Proof Strip */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-pitch-600" />
                    구단 공식 라이선스 100% 정품 (가품 시 300% 보상)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-pitch-600" />
                    평일 15시 이전 주문 오피셜 열프레스 당일출고
                  </span>
                </div>
              </div>

              {/* Right Live Interactive 360° 3D Jersey Studio Stage (5 Cols) */}
              <div className="lg:col-span-5">
                <div
                  className="rounded-2xl p-5 text-white border border-slate-800 shadow-xl flex flex-col justify-between h-full"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 42%, #1E293B 0%, #0F172A 58%, #070C16 100%)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 min-w-0">
                      <Move3d className="w-4 h-4 text-pitch-500 shrink-0" />
                      <span className="text-pitch-500 truncate">
                        {currentHeroKit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                      {(
                        [
                          { id: 'back', label: '뒷면' },
                          { id: 'front', label: '앞면' },
                          { id: 'side', label: '측면' },
                        ] as const
                      ).map((cam) => (
                        <button
                          key={cam.id}
                          type="button"
                          onClick={() => setHeroView(cam.id)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                            heroView === cam.id
                              ? 'bg-pitch-500 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {cam.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[340px] w-full my-2">
                    <Jersey3DViewport
                      bgColor={currentHeroKit.bgColor}
                      secondaryColor={currentHeroKit.secondaryColor}
                      stripeColor={currentHeroKit.stripeColor}
                      textColor={currentHeroKit.textColor}
                      numberStrokeColor={currentHeroKit.numberStrokeColor}
                      pattern={currentHeroKit.pattern}
                      crestCode={currentHeroKit.crestCode}
                      sponsorText={currentHeroKit.sponsorText}
                      isNational={currentHeroKit.league === 'NATIONAL'}
                      customName={currentHeroKit.defaultName}
                      customNumber={currentHeroKit.defaultNum}
                      patchType="champs"
                      view={heroView}
                      interactive={!studioModalState}
                      highRes={true}
                    />
                  </div>

                  <div className="pt-3.5 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {heroShowcases.map((kit, idx) => (
                        <button
                          key={kit.id}
                          type="button"
                          onClick={() => setHeroPlayerIdx(idx)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap tabular-nums ${
                            heroPlayerIdx === idx
                              ? 'bg-pitch-500 text-white'
                              : 'bg-slate-900/95 border border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {kit.defaultName} {kit.defaultNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigateTo({
                          view: 'detail',
                          productId: currentHeroKit.id,
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-bold text-pitch-500 hover:text-white transition cursor-pointer whitespace-nowrap"
                    >
                      <span>설정하기</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Clean Catalog Grid */}
          <main
            id="collection"
            className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-12 sm:py-16"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  24/25 시즌 유니폼 컬렉션
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  원하는 유니폼 카드를 선택해 들어가면 360° 3D 회전 미리보기와 마킹·사이즈·패치 세부 설정을 진행할 수 있습니다.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">
                총 <strong className="text-slate-900">{filteredProducts.length}</strong>개 구단 킷
              </div>
            </div>

            {/* Filter, Live Search & Sort Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {LEAGUE_FILTERS.map((lf) => {
                  const isActive = activeLeague === lf.id;
                  return (
                    <button
                      key={lf.id}
                      type="button"
                      onClick={() => setActiveLeague(lf.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lf.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="선수명, 팀명 검색 (예: 손흥민, 이강인, 레알)"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/20 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      aria-label="검색어 지우기"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="정렬 기준"
                  className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-pitch-500 cursor-pointer"
                >
                  <option value="popular">추천 인기순</option>
                  <option value="price-asc">낮은 가격순</option>
                  <option value="price-desc">높은 가격순</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-16 px-4 text-center">
                <p className="text-base font-bold text-slate-900">
                  일치하는 유니폼 상품을 찾지 못했습니다
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  다른 구단명이나 선수 이름(예: 손흥민, 이강인, 김민재, 벨링엄)으로 검색해 보세요.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLeague('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  초기화
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <JerseyCard
                    key={product.id}
                    product={product}
                    onSelectProduct={(selected) =>
                      navigateTo({ view: 'detail', productId: selected.id })
                    }
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* ================= ROUTE 2: DEDICATED JERSEY DETAIL & CUSTOMIZER PAGE ================= */}
      {route.view === 'detail' && activeProduct && (
        <JerseyDetailView
          product={activeProduct}
          isModalOpen={Boolean(studioModalState)}
          onBackToCatalog={() => navigateTo({ view: 'catalog' })}
          onSelectProduct={(selected) =>
            navigateTo({ view: 'detail', productId: selected.id })
          }
          onOpenStudioModal={(state) => setStudioModalState(state)}
          onAddToCart={handleAddToCart}
          onOpenSizeGuide={() => setInfoModalTab('guide')}
        />
      )}

      {/* ================= ROUTE 3: DEDICATED TEAM BULK ORDER PAGE ================= */}
      {route.view === 'team-order' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateTo({ view: 'catalog' })}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-pitch-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>목록으로</span>
              </button>
              <span className="text-xs font-medium text-slate-500">
                동호회 · 학교 · 사내 축구팀 단체 제작
              </span>
            </div>
          </div>

          <TeamCalculator />
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="font-display font-black text-lg tracking-tighter text-white block">
              PITCH<span className="text-pitch-500">GEAR</span>
            </span>
            <p className="text-slate-400">
              © 2026 PitchGear Official Custom Kit Store. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => setInfoModalTab('authenticity')}
              className="hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              정품보증안내
            </button>
            <button
              type="button"
              onClick={() => setInfoModalTab('guide')}
              className="hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              사이즈·마킹 가이드
            </button>
            <button
              type="button"
              onClick={() => navigateTo({ view: 'team-order' })}
              className="hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              단체주문 견적
            </button>
            <button
              type="button"
              onClick={() => setInfoModalTab('support')}
              className="hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              고객센터
            </button>
          </div>
        </div>
      </footer>

      {/* ================= FULL-SCREEN 360° 3D STUDIO MODAL ================= */}
      <Studio3DModal
        product={studioModalState?.product ?? null}
        initialName={studioModalState?.customName ?? ''}
        initialNumber={studioModalState?.customNumber ?? ''}
        initialPatch={studioModalState?.patchType ?? 'none'}
        initialSize={studioModalState?.size ?? 'L'}
        onClose={() => setStudioModalState(null)}
        onAddToCart={handleAddToCart}
      />

      {/* ================= SLIDE-OVER CART & CHECKOUT DRAWER ================= */}
      <CartDrawer
        isOpen={isCartOpen}
        initialStep={cartInitialStep}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCompleteOrder={handleCompleteOrder}
        lastReceipt={lastReceipt}
      />

      {/* ================= GUIDE / AUTHENTICITY / SUPPORT MODAL ================= */}
      <InfoModal
        activeTab={infoModalTab}
        onSelectTab={(tab) => setInfoModalTab(tab)}
        onClose={() => setInfoModalTab(null)}
      />

      {/* ================= NON-BLOCKING TOAST FEEDBACK ================= */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-semibold whitespace-nowrap"
        >
          <CheckCircle2 className="w-4 h-4 text-pitch-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
