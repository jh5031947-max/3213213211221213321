import React, { useState } from 'react';
import { Download, CheckCircle2, FileText, X } from 'lucide-react';
import { Jersey3DViewport } from './Jersey3DViewport';

const TEAM_COLORS = [
  { id: 'emerald', label: '피치 그린', bg: '#00C853', secondary: '#0F172A', stripe: '#FFFFFF', text: '#FFFFFF' },
  { id: 'navy', label: '미드나잇 네이비', bg: '#0F172A', secondary: '#1E293B', stripe: '#38BDF8', text: '#FFFFFF' },
  { id: 'crimson', label: '클래식 레드', bg: '#DC2626', secondary: '#7F1D1D', stripe: '#FFFFFF', text: '#FFFFFF' },
  { id: 'white', label: '어센틱 화이트', bg: '#FFFFFF', secondary: '#0F172A', stripe: '#00C853', text: '#0F172A' },
  { id: 'gold', label: '올드 골드', bg: '#F59E0B', secondary: '#18181B', stripe: '#18181B', text: '#18181B' },
];

export const TeamCalculator: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(15);
  const [includePants, setIncludePants] = useState<boolean>(true);
  const [includeEmblem, setIncludeEmblem] = useState<boolean>(true);
  const [includeMarking, setIncludeMarking] = useState<boolean>(true);
  const [selectedColorId, setSelectedColorId] = useState<string>('navy');
  const [teamSampleName, setTeamSampleName] = useState<string>('FC SEOUL');

  // Inquiry Modal State
  const [isInquiryOpen, setIsInquiryOpen] = useState<boolean>(false);
  const [clubName, setClubName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [desiredDate, setDesiredDate] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const selectedTheme =
    TEAM_COLORS.find((c) => c.id === selectedColorId) || TEAM_COLORS[0];

  // Pricing Math (matches attached HTML logic)
  let baseUnitPrice = 30000;
  if (includePants) baseUnitPrice += 12000;
  if (includeEmblem) baseUnitPrice += 3000;
  if (includeMarking) baseUnitPrice += 5000;

  let discountRate = 0.1;
  if (quantity >= 40) discountRate = 0.25;
  else if (quantity >= 20) discountRate = 0.2;
  else if (quantity >= 10) discountRate = 0.15;

  const discountedUnitPrice = Math.round(baseUnitPrice * (1 - discountRate));
  const totalAmount = discountedUnitPrice * quantity;
  const savedAmount = (baseUnitPrice - discountedUnitPrice) * quantity;

  const handleDownloadQuote = () => {
    const today = new Date().toISOString().slice(0, 10);
    const quoteLines = [
      '==================================================',
      '        PITCHGEAR 팀 유니폼 단체견적서',
      '==================================================',
      `발행일자: ${today}`,
      `예시 팀명: ${teamSampleName || '미지정'}`,
      `유니폼 컬러: ${selectedTheme.label}`,
      `주문 수량: ${quantity}벌`,
      '--------------------------------------------------',
      '[선택 옵션]',
      `- 기본 기능성 상의: ₩30,000`,
      `- 상·하의 세트 구성: ${includePants ? '포함 (+₩12,000)' : '미포함'}`,
      `- 팀 고유 엠블럼 자수 패치: ${includeEmblem ? '포함 (+₩3,000)' : '미포함'}`,
      `- 개인 네임 + 등번호 풀마킹: ${includeMarking ? '포함 (+₩5,000)' : '미포함'}`,
      '--------------------------------------------------',
      `할인 전 벌당 단가: ₩${baseUnitPrice.toLocaleString()}`,
      `단체 수량 할인율: ${Math.round(discountRate * 100)}% 할인`,
      `할인 적용 벌당 단가: ₩${discountedUnitPrice.toLocaleString()}`,
      `총 절감 금액: -₩${savedAmount.toLocaleString()}`,
      '--------------------------------------------------',
      `총 예상 결제 금액 (VAT 포함): ₩${totalAmount.toLocaleString()}`,
      '==================================================',
      '문의: PitchGear 단체팀 전담 데스크 (1588-0719)',
    ].join('\n');

    const blob = new Blob([quoteLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PitchGear_단체견적서_${quantity}벌_${today}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !contactName.trim() || !contactPhone.trim()) return;
    const randomCode = `TM-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedCode(randomCode);
  };

  const resetAndCloseInquiry = () => {
    setIsInquiryOpen(false);
    setSubmittedCode(null);
  };

  return (
    <section
      id="team-calculator"
      className="bg-white border-t border-slate-200 py-16 sm:py-20 px-4 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-pitch-600 mb-2">
            <span>단체 주문 전용 서비스</span>
            <span aria-hidden="true">·</span>
            <span>5벌부터 최대 25% 수량 할인</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-balance">
            동호회 및 팀 유니폼 실시간 단체견적 계산기
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            필요 수량과 옵션을 조절하면 단체 할인율이 반영된 벌당 단가와 총 견적이 즉시 산출됩니다. 견적서를 바로 저장하거나 전담 디자이너 시안 상담을 신청하세요.
          </p>
        </div>

        {/* Main 12-Col Layout without nested card-in-card boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Controls: 7 Cols */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between space-y-6">
            {/* 1. Quantity Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label
                  htmlFor="team-qty-slider"
                  className="text-xs font-bold text-slate-500"
                >
                  주문 수량
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-pitch-600 tabular-nums">
                    {quantity}벌
                  </span>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {Math.round(discountRate * 100)}% 할인
                  </span>
                </div>
              </div>

              <input
                id="team-qty-slider"
                type="range"
                min={5}
                max={60}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full accent-pitch-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2 tabular-nums">
                <span>5벌 (10%)</span>
                <span>10벌 (15%)</span>
                <span>20벌 (20%)</span>
                <span>40벌+ (25%)</span>
              </div>
            </div>

            {/* 2. Kit Color & Sample Name 3D Preview Bar */}
            <div className="pt-5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div
                className="sm:col-span-5 rounded-xl h-52 overflow-hidden border border-slate-800"
                style={{
                  background:
                    'radial-gradient(circle at 50% 42%, #1E293B 0%, #0F172A 60%, #070C16 100%)',
                }}
              >
                <Jersey3DViewport
                  bgColor={selectedTheme.bg}
                  secondaryColor={selectedTheme.secondary}
                  stripeColor={selectedTheme.stripe}
                  textColor={selectedTheme.text}
                  numberStrokeColor={
                    selectedTheme.text === '#FFFFFF' ? '#0F172A' : '#CBD5E1'
                  }
                  pattern="solid-trim"
                  crestCode="CLUB"
                  sponsorText={teamSampleName}
                  customName={includeMarking ? teamSampleName : ''}
                  customNumber={includeMarking ? '10' : ''}
                  patchType={includeEmblem ? 'league' : 'none'}
                  view={includeMarking ? 'back' : 'front'}
                  interactive={true}
                />
              </div>

              <div className="sm:col-span-7 space-y-3.5">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-2">
                    베이스 컬러
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {TEAM_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColorId(c.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
                          selectedColorId === c.id
                            ? 'border-2 border-slate-900 bg-white text-slate-900 font-bold'
                            : 'border border-slate-200 bg-white text-slate-600 font-medium hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-sm border border-slate-300 shrink-0"
                          style={{ backgroundColor: c.bg }}
                        />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="team-sample-input"
                    className="text-xs font-bold text-slate-500 block mb-1.5"
                  >
                    샘플 팀명
                  </label>
                  <input
                    id="team-sample-input"
                    type="text"
                    maxLength={12}
                    value={teamSampleName}
                    onChange={(e) => setTeamSampleName(e.target.value.toUpperCase())}
                    placeholder="FC SEOUL"
                    className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-pitch-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Option Checkboxes */}
            <div className="pt-5 border-t border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-500 block mb-2">
                구성 옵션
              </span>

              <label className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition">
                <span className="text-xs font-bold text-slate-800">
                  상·하의 세트{' '}
                  <span className="font-semibold text-slate-400 ml-1 tabular-nums">
                    +₩12,000
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={includePants}
                  onChange={(e) => setIncludePants(e.target.checked)}
                  className="w-4 h-4 accent-pitch-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition">
                <span className="text-xs font-bold text-slate-800">
                  팀 엠블럼 자수{' '}
                  <span className="font-semibold text-slate-400 ml-1 tabular-nums">
                    +₩3,000
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={includeEmblem}
                  onChange={(e) => setIncludeEmblem(e.target.checked)}
                  className="w-4 h-4 accent-pitch-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition">
                <span className="text-xs font-bold text-slate-800">
                  개인 이름·번호 마킹{' '}
                  <span className="font-semibold text-slate-400 ml-1 tabular-nums">
                    +₩5,000
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={includeMarking}
                  onChange={(e) => setIncludeMarking(e.target.checked)}
                  className="w-4 h-4 accent-pitch-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Right Quote Summary Card: 5 Cols */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  견적 요약
                </h3>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {quantity}벌 기준
                </span>
              </div>

              <dl className="space-y-3 mt-5 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <dt>벌당 기본 단가</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">
                    ₩{baseUnitPrice.toLocaleString()}
                  </dd>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <dt>단체 수량 할인</dt>
                  <dd className="font-bold text-pitch-600 tabular-nums">
                    {Math.round(discountRate * 100)}%
                  </dd>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <dt>할인 적용 단가</dt>
                  <dd className="font-black text-slate-900 text-sm tabular-nums">
                    ₩{discountedUnitPrice.toLocaleString()}
                  </dd>
                </div>

                <div className="flex justify-between items-center text-slate-500 pt-3 border-t border-slate-100">
                  <dt>총 절감 금액</dt>
                  <dd className="font-bold text-pitch-600 tabular-nums">
                    -₩{savedAmount.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-5 border-t border-slate-200 mt-6">
              <span className="text-[11px] font-medium text-slate-400 block">
                예상 총액 (VAT · 배송 포함)
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 mb-5 tabular-nums tracking-tight">
                ₩{totalAmount.toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadQuote}
                  className="h-11 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>견적서 저장</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClubName(teamSampleName !== 'FC SEOUL' ? teamSampleName : '');
                    setIsInquiryOpen(true);
                  }}
                  className="h-11 bg-pitch-500 hover:bg-pitch-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>상담 신청</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Order Consultation Modal */}
      {isInquiryOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-inquiry-title"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 id="team-inquiry-title" className="text-lg font-bold text-slate-900">
                팀 단체주문 시안 및 견적 상담 신청
              </h3>
              <button
                type="button"
                onClick={resetAndCloseInquiry}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submittedCode ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-pitch-500 mx-auto" />
                <h4 className="text-lg font-bold text-slate-900">
                  단체 시안 상담 접수가 완료되었습니다
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  접수번호 <strong className="text-slate-900 tabular-nums">{submittedCode}</strong> ·{' '}
                  {clubName} ({quantity}벌 / 총 ₩{totalAmount.toLocaleString()}) 내역이 전담 디자이너에게 전달되었습니다. 영업시간 기준 2시간 이내에 연락드립니다.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={resetAndCloseInquiry}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="mt-5 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3.5 flex items-center justify-between text-xs border border-slate-200/80">
                  <span className="text-slate-600 font-medium">
                    선택 견적: {selectedTheme.label} · {quantity}벌 ({Math.round(discountRate * 100)}% 할인)
                  </span>
                  <span className="font-black text-slate-900 tabular-nums">
                    ₩{totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      팀 / 동호회명 *
                    </label>
                    <input
                      type="text"
                      required
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="예: 여의도 FC"
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-pitch-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      담당자 성함 *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="홍길동 총무"
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-pitch-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      연락처 *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 tabular-nums focus:outline-none focus:border-pitch-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      희망 수령일 (선택)
                    </label>
                    <input
                      type="date"
                      value={desiredDate}
                      onChange={(e) => setDesiredDate(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 tabular-nums focus:outline-none focus:border-pitch-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    추가 요청사항 (엠블럼 유무, 골키퍼 킷 포함 여부 등)
                  </label>
                  <textarea
                    rows={3}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="골키퍼 유니폼 2벌 별도 컬러 요청, 기존 로고 파일 보유 등"
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-pitch-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAndCloseInquiry}
                    className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-pitch-500 hover:bg-pitch-600 text-white text-xs font-bold cursor-pointer"
                  >
                    무료 시안 및 상담 접수
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
