export type LeagueFilter = 'all' | 'EPL' | 'LALIGA' | 'BUNDESLIGA' | 'NATIONAL' | 'PSG';

export type PatchType = 'none' | 'league' | 'champs';

export type JerseySize = 'S' | 'M' | 'L' | 'XL' | '2XL';

export type KitGrade = 'authentic' | 'replica';

export type MarkingMode = 'player' | 'custom' | 'none';

export type JerseyViewAngle = 'front' | 'back';

export type KitPattern =
  | 'solid-trim'
  | 'center-stripe'
  | 'vertical-stripes'
  | 'split-halves'
  | 'sleeves-contrast'
  | 'tiger-wave';

export interface PlayerPreset {
  label: string;
  name: string;
  number: string;
}

export interface JerseyProduct {
  id: string;
  team: string;
  league: Exclude<LeagueFilter, 'all'>;
  leagueLabel: string;
  title: string;
  editionNote: string;
  price: number;
  defaultName: string;
  defaultNum: string;
  textColor: string;
  numberStrokeColor: string;
  bgColor: string;
  secondaryColor: string;
  stripeColor: string;
  pattern: KitPattern;
  crestCode: string;
  sponsorText: string;
  statusNote: string;
  wornImage?: string;
  chestSide: 'left' | 'right' | 'center';
  presets: PlayerPreset[];
}

export interface CartItem {
  cartId: string;
  productId: string;
  team: string;
  title: string;
  grade?: KitGrade;
  gradeLabel?: string;
  unitPrice: number;
  quantity: number;
  size: JerseySize;
  customName: string;
  customNumber: string;
  patchType: PatchType;
  patchLabel: string;
  bgColor: string;
  secondaryColor: string;
  stripeColor: string;
  textColor: string;
  numberStrokeColor: string;
  pattern: KitPattern;
  crestCode: string;
  wornImage?: string;
}

export interface OrderReceipt {
  orderNumber: string;
  orderedAt: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  items: CartItem[];
  totalAmount: number;
}

export type InfoModalTab = 'authenticity' | 'guide' | 'support';
