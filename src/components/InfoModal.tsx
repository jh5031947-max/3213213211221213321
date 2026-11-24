import React from 'react';
import { X } from 'lucide-react';
import { InfoModalTab } from '../types';

interface InfoModalProps {
  activeTab: InfoModalTab | null;
  onSelectTab: (tab: InfoModalTab) => void;
  onClose: () => void;
}

const SIZE_SPECS = [
  { size: 'S (90)', chest: '96', length: '70', shoulder: '42', height: '163 – 170' },
  { size: 'M (95)', chest: '102', length: '72', shoulder: '44', height: '170 – 176' },
  { size: 'L (100)', chest: '108', length: '74', shoulder: '46', height: '175 – 182' },
  { size: 'XL (105)', chest: '114', length: '76', shoulder: '48.5', height: '180 – 187' },
  { size: '2XL (110)', chest: '122', length: '78.5', shoulder: '51', height: '185 이상' },
];

export const InfoModal: React.FC<InfoModalProps> = ({
  activeTab,
  onSelectTab,
  onClose,
}) => {
  if (!activeTab) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="이용 및 정품 가이드"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header & Segmented Tabs */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onSelectTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              사이즈·마킹 가이드
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('authenticity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'authenticity'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100% 정품보증안내
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('support')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'support'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              고객센터·배송안내
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
            aria-label="창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto text-xs text-slate-600 leading-relaxed space-y-5">
          {activeTab === 'guide' && (
            <>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  유럽 공식 어센틱 / 스타디움 핏 실측 사이즈표 (단위: cm)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse tabular-nums">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3.5">사이즈</th>
                        <th className="py-2.5 px-3.5">가슴둘레</th>
                        <th className="py-2.5 px-3.5">총기장</th>
                        <th className="py-2.5 px-3.5">어깨너비</th>
                        <th className="py-2.5 px-3.5">권장 신장</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SIZE_SPECS.map((row) => (
                        <tr key={row.size} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {row.size}
                          </td>
                          <td className="py-2.5 px-3.5">{row.chest}</td>
                          <td className="py-2.5 px-3.5">{row.length}</td>
                          <td className="py-2.5 px-3.5">{row.shoulder}</td>
                          <td className="py-2.5 px-3.5">{row.height}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h4 className="text-sm font-bold text-slate-900">
                  오피셜 열프레스 마킹 및 세탁 관리 수칙
                </h4>
                <p>
                  01. 모든 네임셋 및 리그 패치는 구단 공식 납품사(Avery Dennison, Sporting ID, Dekographics) 정품 자재를 사용하여 전용 프레스기(150°C, 14초, 4bar 압력)로 정밀 부착됩니다.
                </p>
                <p>
                  02. 마킹 손상을 방지하기 위해 반드시 유니폼을 뒤집어 찬물에 중성세제로 단독 손세탁해 주시고, 섬유유연제 및 건조기 사용은 피해 주세요.
                </p>
              </div>
            </>
          )}

          {activeTab === 'authenticity' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  구단 및 브랜드 공식 라이선스 100% 정품 보증
                </h3>
                <p>
                  PitchGear에서 판매하는 모든 유니폼과 오피셜 네임셋·슬리브 패치는 나이키, 아디다스, 푸마 및 각 유럽 구단·대한축구협회 공식 유통망을 통해 정식 수입된 100% 정품입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 mb-1">
                    시리얼 품번 탭 전수 검수
                  </h4>
                  <p>
                    내부 케어라벨의 고유 품번(SKU) 및 홀로그램 시리얼을 출고 전 전수 촬영·검수하여 개런티 카드와 함께 동봉합니다.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 mb-1">
                    가품 판정 시 300% 책임 보상
                  </h4>
                  <p>
                    만약 수령하신 제품이 정품이 아닐 경우 구매 금액의 300%를 즉시 환불 및 보상하는 법적 보증 제도를 운영합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  오피셜 마킹 당일출고 및 고객센터 안내
                </h3>
                <p>
                  평일 오후 3시 이전 결제 완료 건은 전담 마킹 엔지니어의 당일 열프레스 작업 및 검수를 거쳐 우체국택배로 당일 출고됩니다.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 tabular-nums">
                <p className="font-bold text-slate-900">
                  고객센터 대표번호: 1588-0719
                </p>
                <p>운영시간: 평일 10:00 – 18:00 (점심시간 12:30 – 13:30 / 주말·공휴일 휴무)</p>
                <p>오프라인 마킹 스튜디오: 서울특별시 마포구 월드컵북로 42 피치기어 서울 스토어 2F</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
