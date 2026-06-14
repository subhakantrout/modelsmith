import { describe, it, expect, beforeEach } from 'vitest';
import { useViewStore } from '../viewStore';

describe('viewStore', () => {
  beforeEach(() => {
    useViewStore.setState({
      currentView: 'home',
      rightPanelOpen: false,
    });
  });

  it('initializes with default values', () => {
    const state = useViewStore.getState();
    expect(state.currentView).toBe('home');
    expect(state.rightPanelOpen).toBe(false);
  });

  it('updates currentView', () => {
    const { setView } = useViewStore.getState();
    setView('canvas');
    expect(useViewStore.getState().currentView).toBe('canvas');
  });

  it('updates rightPanelOpen', () => {
    const { setRightPanelOpen } = useViewStore.getState();
    setRightPanelOpen(true);
    expect(useViewStore.getState().rightPanelOpen).toBe(true);
  });
});
