/**
 * Web Audio API Ambient Engine — Phase 3
 *
 * Zero-dependency procedural synthesizer: a low-frequency sine drone matched
 * to the active chapter's emotional tone.
 *
 * Signal chain:
 *   OscillatorNode (sine) → GainNode → BiquadFilterNode (lowpass)
 *   → AnalyserNode (FFT-256) → AudioContext.destination
 *
 * Side effect:
 *   Reads low-band amplitude from AnalyserNode every rAF.
 *   Writes CSS variable --audio-pulse (0.97–1.03) to :root.
 *   `.daisy-svg { filter: brightness(var(--audio-pulse)) }` makes the
 *   entire daisy breathe in sync with the ambient audio waveform.
 *
 * Starts ONLY after first user pointerdown (AudioContext browser policy).
 * Crossfades drone frequency + filter Q on chapter change over 1200ms.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { Chapter } from './types';

interface ChapterAudioCfg {
  freq:       number;  // fundamental Hz — lower = calmer
  filterFreq: number;  // low-pass cutoff Hz
  filterQ:    number;  // resonance Q — higher = more singing
  gain:       number;  // master volume (very low — felt, not heard)
}

const CHAPTER_AUDIO: Record<string, ChapterAudioCfg> = {
  garden:   { freq: 174.6, filterFreq:  700, filterQ: 1.4, gain: 0.055 },
  forest:   { freq: 146.8, filterFreq:  520, filterQ: 2.0, gain: 0.065 },
  mountain: { freq: 110.0, filterFreq:  380, filterQ: 2.8, gain: 0.045 },
  storm:    { freq:  98.0, filterFreq: 1100, filterQ: 3.6, gain: 0.075 },
  void:     { freq:  82.4, filterFreq:  260, filterQ: 1.2, gain: 0.038 },
};
const FALLBACK = CHAPTER_AUDIO.garden;

export const useAudio = (chapter: Chapter, isPlaying: boolean): void => {
  const ctxRef      = useRef<AudioContext | null>(null);
  const oscRef      = useRef<OscillatorNode | null>(null);
  const gainRef     = useRef<GainNode | null>(null);
  const filterRef   = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef     = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef      = useRef<number>(0);
  const activeRef   = useRef(false);

  /* ── FFT → --audio-pulse loop ─────────────────────────────────────── */
  const runPulseLoop = useCallback(() => {
    const tick = () => {
      const an = analyserRef.current;
      const d  = dataRef.current;
      if (!an || !d) return;
      an.getByteFrequencyData(d);
      // Average bins 1–6 ≈ 20–150 Hz at 44.1 kHz, 256-point FFT
      const bins = Math.min(6, d.length);
      let sum = 0;
      for (let i = 1; i <= bins; i++) sum += d[i];
      const avg   = sum / (bins * 255);
      const pulse = (0.97 + avg * 0.06).toFixed(4); // 0.97–1.03
      document.documentElement.style.setProperty('--audio-pulse', pulse);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  /* ── Start ────────────────────────────────────────────────────────── */
  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    const audioCtx = new AudioContext();
    ctxRef.current = audioCtx;
    const cfg = CHAPTER_AUDIO[chapter.id] ?? FALLBACK;

    const osc = audioCtx.createOscillator();
    osc.type           = 'sine';
    osc.frequency.value = cfg.freq;
    oscRef.current = osc;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(cfg.gain, audioCtx.currentTime + 2.5);
    gainRef.current = gainNode;

    const bqFilter = audioCtx.createBiquadFilter();
    bqFilter.type            = 'lowpass';
    bqFilter.frequency.value = cfg.filterFreq;
    bqFilter.Q.value         = cfg.filterQ;
    filterRef.current = bqFilter;

    const fftNode = audioCtx.createAnalyser();
    fftNode.fftSize               = 256;
    fftNode.smoothingTimeConstant = 0.88;
    analyserRef.current = fftNode;
    dataRef.current     = new Uint8Array(fftNode.frequencyBinCount) as Uint8Array<ArrayBuffer>;

    osc.connect(gainNode);
    gainNode.connect(bqFilter);
    bqFilter.connect(fftNode);
    fftNode.connect(audioCtx.destination);
    osc.start();

    runPulseLoop();
  }, [chapter.id, runPulseLoop]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Stop ─────────────────────────────────────────────────────────── */
  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const ctx = ctxRef.current;
    const g   = gainRef.current;
    if (ctx && g) {
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(() => {
        try { oscRef.current?.stop(); } catch { /* already stopped */ }
        ctx.close().catch(() => {});
        ctxRef.current    = null;
        oscRef.current    = null;
        gainRef.current   = null;
        filterRef.current = null;
        activeRef.current = false;
      }, 900);
    }
    document.documentElement.style.setProperty('--audio-pulse', '1');
  }, []);

  /* ── First-interaction trigger ───────────────────────────────────── */
  useEffect(() => {
    if (!isPlaying) return;
    const onFirst = () => start();
    window.addEventListener('pointerdown', onFirst, { once: true });
    return () => window.removeEventListener('pointerdown', onFirst);
  }, [isPlaying, start]);

  /* ── Stop when not playing ───────────────────────────────────────── */
  useEffect(() => {
    if (!isPlaying) stop();
  }, [isPlaying, stop]);

  /* ── Crossfade on chapter change (1200ms) ────────────────────────── */
  useEffect(() => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    const flt = filterRef.current;
    const gn  = gainRef.current;
    if (!ctx || !osc || !flt) return;
    const cfg = CHAPTER_AUDIO[chapter.id] ?? FALLBACK;
    const now = ctx.currentTime;
    osc.frequency.linearRampToValueAtTime(cfg.freq,       now + 1.2);
    flt.frequency.linearRampToValueAtTime(cfg.filterFreq, now + 1.2);
    flt.Q.linearRampToValueAtTime(cfg.filterQ,            now + 1.2);
    gn?.gain.linearRampToValueAtTime(cfg.gain,            now + 1.2);
  }, [chapter.id]);
};
