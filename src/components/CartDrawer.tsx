import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { CartItem, OrderReceipt } from '../types';
import { Jersey3DViewport } from './Jersey3DViewport';

interface CartDrawerProps {
  isOpen: boolean;
  initialStep?: 'cart' | 'checkout';
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onCompleteOrder: (receipt: OrderReceipt) => void;
  lastReceipt: OrderReceipt | null;
}

type DrawerStep = 'cart' | 'checkout' | 'confirmed';

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  initialStep = 'cart',
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
  lastReceipt,
}) => {
  const [step, setStep] = useState<DrawerStep>(initialStep);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('신용·체크카드');

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const shippingFee = subtotal >= 100000 || subtotal === 0 ? 0 : 3000;
  const totalAmount = subtotal + shippingFee;

  const handleClose = () => {
    if (step === 'confirmed') {
      setStep('cart');
    }
    onClose();
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      return;
    }

    const receipt: OrderReceipt = {
      orderNumber: `PG-${new Date().getFullYear()}-${Math.floor(
        10000 + Math.random() * 90000
      )}`,
      orderedAt: new Date().toLocaleString('ko-KR'),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      items: [...items],
      totalAmount,
    };

    onCompleteOrder(receipt);
    setStep('confirmed');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="장바구니 및 주문 결제"
    >
      {/* Click outside overlay */}
      <div className="flex-1" onClick={handleClose} />

      <aside className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' ? (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="p-1.5 -ml-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="장바구니로 돌아가기"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <ShoppingBag className="w-5 h-5 text-pitch-500" />
            )}
            <h2 className="font-bold text-slate-900 text-base">
              {step === 'cart' && `장바구니 (${items.reduce((acc, i) => acc + i.quantity, 0)})`}
              {step === 'checkout' && '배송 · 결제 정보'}
              {step === 'confirmed' && '주문 완료'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
            aria-label="장바구니 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mb-3 stroke-[1.5]" />
                  <p className="text-sm font-bold text-slate-700">
                    장바구니에 담긴 유니폼이 없습니다
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    카드에서 원하는 이름과 등번호를 입력해 바로 담아보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-slate-600 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>₩100,000 이상 구매 시 오피셜 특송 무료</span>
                    <span className="font-semibold text-pitch-600">
                      {shippingFee === 0 ? '무료배송 적용됨' : '배송비 ₩3,000'}
                    </span>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.cartId}
                      className="flex gap-3.5 pb-4 border-b border-slate-100 last:border-b-0"
                    >
                      {/* Mini Live Customized 3D Jersey Thumbnail */}
                      <div
                        className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-800 p-1"
                        style={{
                          background:
                            'radial-gradient(circle at 50% 42%, #1E293B 0%, #070C16 100%)',
                        }}
                      >
                        <Jersey3DViewport
                          bgColor={item.bgColor}
                          secondaryColor={item.secondaryColor}
                          stripeColor={item.stripeColor}
                          textColor={item.textColor}
                          numberStrokeColor={item.numberStrokeColor}
                          pattern={item.pattern}
                          crestCode={item.crestCode}
                          customName={item.customName === '노마킹' ? '' : item.customName}
                          customNumber={item.customName === '노마킹' ? '' : item.customNumber}
                          patchType={item.patchType}
                          view={item.customName === '노마킹' ? 'front' : 'back'}
                          interactive={false}
                          alt={item.title}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cartId)}
                            className="text-slate-400 hover:text-red-600 p-1 -mr-1 cursor-pointer"
                            aria-label="상품 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] font-semibold text-pitch-600 mt-0.5">
                          {item.customName === '노마킹'
                            ? `노마킹 (무지) · 사이즈 ${item.size}`
                            : `마킹: ${item.customName} (${item.customNumber}번) · 사이즈 ${item.size}`}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.gradeLabel ? `${item.gradeLabel} · ` : ''}
                          {item.patchLabel}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.cartId, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                              aria-label="수량 감소"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.cartId, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                              aria-label="수량 증가"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-black text-slate-900 tabular-nums">
                            ₩{(item.unitPrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>총 주문 상품 ({items.reduce((a, b) => a + b.quantity, 0)}벌)</span>
                  <span className="tabular-nums">₩{totalAmount.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  정품 오피셜 열프레스 마킹 검수 후 전용 슈트케이스에 안전 포장되어 출고됩니다.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  수령인 성함 *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="예: 손흥민"
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-pitch-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  연락처 *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 tabular-nums focus:outline-none focus:border-pitch-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  배송지 주소 *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="서울특별시 마포구 월드컵로 240, 101동 1001호"
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-pitch-500"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  결제 수단 선택
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['신용·체크카드', '간편결제', '무통장입금'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`h-9 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
                        paymentMethod === method
                          ? 'border-2 border-slate-900 bg-slate-50 text-slate-900 font-bold'
                          : 'border border-slate-200 bg-white text-slate-600 font-medium hover:border-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-start gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-pitch-600 shrink-0 mt-0.5" />
                <span>
                  개인 커스텀 마킹(이름·등번호) 작업이 완료된 상품은 정품 홀로그램 시리얼 보증서와 함께 발송됩니다.
                </span>
              </div>
            </form>
          )}

          {step === 'confirmed' && lastReceipt && (
            <div className="py-4 space-y-5">
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-pitch-500 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">
                  주문이 정상적으로 확정되었습니다
                </h3>
                <p className="text-xs text-slate-500 tabular-nums">
                  주문번호 <strong className="text-slate-900">{lastReceipt.orderNumber}</strong> — 오피셜 마킹 작업 준비 중
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">수령인</span>
                  <span className="font-semibold text-slate-900">
                    {lastReceipt.customerName} ({lastReceipt.customerPhone})
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">배송지</span>
                  <span className="font-medium text-slate-800 text-right">
                    {lastReceipt.shippingAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">결제방식</span>
                  <span className="font-semibold text-slate-900">
                    {lastReceipt.paymentMethod}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 space-y-1.5">
                  {lastReceipt.items.map((item) => (
                    <div
                      key={item.cartId}
                      className="flex justify-between text-[11px] text-slate-700"
                    >
                      <span>
                        {item.title} [{item.customName} {item.customNumber} · {item.size}] ×{' '}
                        {item.quantity}
                      </span>
                      <span className="font-bold tabular-nums">
                        ₩{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">최종 결제 금액</span>
                  <span className="text-base font-black text-pitch-600 tabular-nums">
                    ₩{lastReceipt.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          {step === 'cart' && (
            <>
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>상품 합계</span>
                  <span className="tabular-nums font-semibold text-slate-800">
                    ₩{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>배송비</span>
                  <span className="tabular-nums font-semibold text-slate-800">
                    {shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">총 결제 예정 금액</span>
                  <span className="text-xl font-black text-pitch-600 tabular-nums">
                    ₩{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setStep('checkout')}
                className="w-full h-11 bg-pitch-500 hover:bg-pitch-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                결제하기
              </button>
            </>
          )}

          {step === 'checkout' && (
            <button
              type="submit"
              form="checkout-form"
              className="w-full h-11 bg-pitch-500 hover:bg-pitch-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer tabular-nums"
            >
              ₩{totalAmount.toLocaleString()} 결제하기
            </button>
          )}

          {step === 'confirmed' && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              계속 쇼핑
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
