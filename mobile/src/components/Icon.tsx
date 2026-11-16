import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

type Family = 'solid' | 'regular' | 'brand';

const ICONS = {
  menu: ['bars', 'solid'],
  bell: ['bell', 'regular'],
  bellSolid: ['bell', 'solid'],
  search: ['magnifying-glass', 'solid'],
  chevronRight: ['chevron-right', 'solid'],
  chevronDown: ['chevron-down', 'solid'],
  chevronLeft: ['chevron-left', 'solid'],
  arrowLeft: ['arrow-left', 'solid'],
  arrowDown: ['arrow-down', 'solid'],
  arrowUpRight: ['arrow-up-right-from-square', 'solid'],
  plus: ['plus', 'solid'],
  close: ['xmark', 'solid'],
  check: ['check', 'solid'],
  google: ['google', 'brand'],
  home: ['house', 'solid'],
  user: ['user', 'solid'],
  userRegular: ['user', 'regular'],
  users: ['users', 'solid'],
  tag: ['tag', 'solid'],
  building: ['building-columns', 'solid'],
  shield: ['shield-halved', 'solid'],
  toolbox: ['toolbox', 'solid'],
  checkCircle: ['circle-check', 'solid'],
  circle: ['circle', 'regular'],
  message: ['message', 'solid'],
  messageRegular: ['message', 'regular'],
  comment: ['comment', 'regular'],
  award: ['award', 'solid'],
  thumbsUp: ['thumbs-up', 'solid'],
  thumbsUpRegular: ['thumbs-up', 'regular'],
  thumbsDown: ['thumbs-down', 'solid'],
  flag: ['flag', 'regular'],
  edit: ['pen-to-square', 'regular'],
  lock: ['lock', 'solid'],
  lockOpen: ['lock-open', 'solid'],
  logout: ['arrow-right-from-bracket', 'solid'],
  trash: ['trash', 'solid'],
  sun: ['sun', 'solid'],
  moon: ['moon', 'solid'],
  question: ['circle-question', 'solid'],
  addCircle: ['circle-plus', 'solid'],
  bold: ['bold', 'solid'],
  italic: ['italic', 'solid'],
  strikethrough: ['strikethrough', 'solid'],
  link: ['link', 'solid'],
  listUl: ['list-ul', 'solid'],
  listOl: ['list-ol', 'solid'],
  quote: ['quote-right', 'solid'],
  code: ['code', 'solid'],
  ellipsis: ['ellipsis', 'solid'],
  eye: ['eye', 'regular'],
  send: ['paper-plane', 'solid'],
  shieldUser: ['user-shield', 'solid'],
  warning: ['triangle-exclamation', 'solid'],
  refresh: ['rotate-right', 'solid'],
  external: ['arrow-up-right-from-square', 'solid'],
  clock: ['clock', 'regular'],
  mail: ['envelope', 'regular'],
  sparkle: ['wand-magic-sparkles', 'solid'],
  switch: ['right-left', 'solid'],
  signal: ['signal', 'solid'],
  sliders: ['sliders', 'solid'],
  location: ['location-dot', 'solid'],
  globe: ['globe', 'solid'],
  landmark: ['landmark', 'solid'],
  map: ['map', 'solid'],
  fileLines: ['file-lines', 'regular'],
  circleXmark: ['circle-xmark', 'regular'],
  ban: ['ban', 'solid'],
  clipboardCheck: ['clipboard-check', 'solid'],
  ellipsisVertical: ['ellipsis-vertical', 'solid'],
  pen: ['pen', 'solid'],
  share: ['arrow-up-from-bracket', 'solid'],
  arrowUpFromBracket: ['arrow-up-from-bracket', 'solid'],
  thumbsDownRegular: ['thumbs-down', 'regular'],
  wifiSlash: ['wifi', 'solid'],
  arrowRight: ['arrow-right', 'solid'],
  arrowUp: ['arrow-up', 'solid'],
  buildingColumns: ['building-columns', 'solid'],
  userShield: ['user-shield', 'solid'],
  wifi: ['wifi', 'solid'],
  battery: ['battery-full', 'solid'],
} as const satisfies Record<string, readonly [string, Family]>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  family?: Family;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 16, color = '#6B7280', family, style }: IconProps) {
  const [glyph, presetFamily] = ICONS[name];
  const resolvedFamily = family ?? presetFamily;

  return (
    <FontAwesome6
      name={glyph as never}
      size={size}
      color={color}
      solid={resolvedFamily === 'solid'}
      regular={resolvedFamily === 'regular'}
      brand={resolvedFamily === 'brand'}
      style={style}
    />
  );
}
