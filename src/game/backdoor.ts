/** 开发/测试用后门，生产环境可通过 VITE_ENABLE_BACKDOOR=false 关闭 */
export const BACKDOOR_ENABLED = import.meta.env.VITE_ENABLE_BACKDOOR !== 'false';

export function isSkipNextFloorShortcut(e: KeyboardEvent): boolean {
  return BACKDOOR_ENABLED && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n';
}

export function isSkipNextFloorUrl(): boolean {
  if (!BACKDOOR_ENABLED) return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('next') === '1' || params.get('cheat') === 'next';
}
