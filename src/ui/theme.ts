export const COLORS = {
  bg: 0x1b1424,
  panel: 0x2a2036,
  panelLight: 0x3a2e4a,
  gold: 0xe0b04a,
  text: 0xf2e9dc,
  muted: 0x9d90ad,
  danger: 0xc9544a,
};

export const css = (c: number) => '#' + c.toString(16).padStart(6, '0');

export const FONT = {
  title: { fontFamily: 'Georgia, serif', fontSize: '44px', color: css(COLORS.gold) },
  heading: { fontFamily: 'Georgia, serif', fontSize: '26px', color: css(COLORS.gold) },
  body: { fontFamily: 'sans-serif', fontSize: '18px', color: css(COLORS.text) },
  small: { fontFamily: 'sans-serif', fontSize: '15px', color: css(COLORS.muted) },
};
