import { Platform } from 'react-native';

export type SoundEffectType = 'BIHU_DHOL' | 'TEMPLE_BELL' | 'FLUTE_PEPA' | 'TEA_GARDEN_RAIN';

// Helper to get or create Web Audio context across platforms
let audioCtx: any = null;

const getAudioContext = () => {
  if (typeof window !== 'undefined') {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }
  }
  return null;
};

/**
 * Play authentic synthesized acoustic patterns
 * @param soundType sound effect category
 * @param onEnded callback fired the exact millisecond playback completes
 */
export const playAcousticSound = async (
  soundType: SoundEffectType,
  onEnded?: () => void
): Promise<void> => {
  const ctx = getAudioContext();

  if (!ctx) {
    // Fallback timer if AudioContext is unavailable on non-web emulator
    const duration = soundType === 'BIHU_DHOL' ? 2200 : soundType === 'TEMPLE_BELL' ? 2500 : 2000;
    setTimeout(() => {
      if (onEnded) onEnded();
    }, duration);
    return;
  }

  const now = ctx.currentTime;

  switch (soundType) {
    case 'BIHU_DHOL': {
      // Authentic Assamese Bihu Dhol drum rhythm: Thump-Kha-Thump-Thump cadence
      const hits = [0.0, 0.25, 0.55, 0.8, 1.1, 1.35, 1.65];
      const totalDuration = 2.0;

      hits.forEach((tOffset, i) => {
        const hitTime = now + tOffset;
        const isBass = i % 2 === 0;

        // Bass membrane oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isBass ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(isBass ? 130 : 220, hitTime);
        osc.frequency.exponentialRampToValueAtTime(isBass ? 45 : 90, hitTime + 0.15);

        gain.gain.setValueAtTime(isBass ? 0.8 : 0.5, hitTime);
        gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(hitTime);
        osc.stop(hitTime + 0.2);

        // Click / strike transient
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = 'square';
        click.frequency.setValueAtTime(isBass ? 400 : 700, hitTime);
        click.frequency.exponentialRampToValueAtTime(100, hitTime + 0.03);

        clickGain.gain.setValueAtTime(0.3, hitTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.04);

        click.connect(clickGain);
        clickGain.connect(ctx.destination);

        click.start(hitTime);
        click.stop(hitTime + 0.05);
      });

      setTimeout(() => {
        if (onEnded) onEnded();
      }, totalDuration * 1000);
      break;
    }

    case 'TEMPLE_BELL': {
      // Kamakhya / Regional Temple Bell: Rich fundamental + shimmering bell overtones
      const fundamental = 587.33; // D5 tone
      const harmonics = [1, 2.04, 3.02, 4.2, 5.4];
      const totalDuration = 2.5;

      harmonics.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * ratio, now);

        const initialGain = 0.4 / (i + 1);
        gain.gain.setValueAtTime(initialGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (totalDuration - i * 0.3));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + totalDuration);
      });

      setTimeout(() => {
        if (onEnded) onEnded();
      }, totalDuration * 1000);
      break;
    }

    case 'FLUTE_PEPA': {
      // Traditional Buffalo Horn Pepa / Flute Melody: Expressive melodic notes with gentle vibrato
      const melody = [
        { freq: 440, time: 0.0, dur: 0.4 }, // A4
        { freq: 493.88, time: 0.4, dur: 0.35 }, // B4
        { freq: 587.33, time: 0.75, dur: 0.45 }, // D5
        { freq: 659.25, time: 1.2, dur: 0.7 } // E5 (sustained vibrato)
      ];
      const totalDuration = 2.0;

      melody.forEach((note) => {
        const noteStart = now + note.time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        // Lowpass filter for warm wooden flute resonance
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, noteStart);
        filter.Q.setValueAtTime(4.0, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.35, noteStart + 0.05);
        gain.gain.setValueAtTime(0.35, noteStart + note.dur - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);
      });

      setTimeout(() => {
        if (onEnded) onEnded();
      }, totalDuration * 1000);
      break;
    }

    case 'TEA_GARDEN_RAIN': {
      // Soothing Rain on Tea Bushes: White noise buffer filtered with pink lowpass
      const bufferSize = ctx.sampleRate * 2.2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      gain.gain.setValueAtTime(0.35, now + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.2);

      setTimeout(() => {
        if (onEnded) onEnded();
      }, 2200);
      break;
    }
  }
};
