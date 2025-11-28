class WebSound {
  static setCategory(_category: string): void {}

  constructor(
    _filename: string,
    _basePath?: string | ((error: string | null) => void),
    _onError?: (error: string | null) => void
  ) {}

  setCurrentTime(_time: number): void {}
  play(_onEnd?: (success: boolean) => void): void {
    if (_onEnd) {
      _onEnd(true);
    }
  }
  setNumberOfLoops(_loops: number): void {}
  setVolume(_volume: number): void {}
  pause(): void {}
  release(): void {}
  isPlaying(): boolean {
    return false;
  }
}

export default WebSound;


