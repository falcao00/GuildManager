import * as Phaser from 'phaser';

/** Campo de texto HTML dentro do jogo (precisa de `dom.createContainer` no config). */
export function createTextInput(scene: Phaser.Scene, x: number, y: number, width: number, placeholder: string, maxLength = 24) {
  const el = scene.add.dom(x, y, 'input', {
    width: `${width}px`,
    padding: '10px 12px',
    fontSize: '18px',
    fontFamily: 'sans-serif',
    color: '#f2e9dc',
    background: '#2a2036',
    border: '2px solid #e0b04a',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
  });
  const input = el.node as HTMLInputElement;
  input.type = 'text';
  input.placeholder = placeholder;
  input.maxLength = maxLength;
  input.autocomplete = 'off';
  return { input, element: el };
}
