#!/usr/bin/env python3
"""Create Spanish Kokoro ONNX narration synced to existing real-game promotional footage.

Zero dependency on paid voice APIs. Explicitly fails closed if synthesis,
timing, soundtrack, or export fail; never substitutes espeak's synthetic voice.
"""
import json
import os
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from misaki.espeak import EspeakG2P

OUTPUT = Path("artifacts/promo-kokoro")
OUTPUT.mkdir(parents=True, exist_ok=True)
VOICE = os.environ.get("AZUR_KOKORO_VOICE", "em_alex")
MODEL = os.environ.get("AZUR_KOKORO_MODEL", ".cache/kokoro/kokoro-v1.0.fp16.onnx")
VOICES = os.environ.get("AZUR_KOKORO_VOICES", ".cache/kokoro/voices-v1.0.bin")
DURATION = 28.0
SCENES = [
    # Start seconds, end seconds, real scenes from the 112-frame 28s trailer.
    (0.45, 4.80, "En Azur, los nombres desaparecen. Y con ellos, los recuerdos."),
    (5.20, 11.20, "Tu historia comienza con un vínculo que nadie podrá borrar."),
    (11.75, 16.00, "El Archivista conoce la verdad que el mundo ha olvidado."),
    (16.30, 19.90, "El Bosque de Ceniza esconde peligros."),
    (20.25, 25.35, "Cada técnica importa. Cada combate puede cambiar tu destino."),
    (25.55, 27.95, "Azur. Lo no escrito."),
]


def run(command, **kwargs):
    completed = subprocess.run(command, check=True, capture_output=True, text=True, **kwargs)
    return completed.stdout.strip()


def speed_up(samples, sample_rate, required_factor, index):
    if required_factor > 1.35:
        raise ValueError(f"Scene {index} cannot fit without unnatural acceleration: {required_factor:.2f}")
    in_path = OUTPUT / f"segment-{index}-before.wav"
    out_path = OUTPUT / f"segment-{index}-fitted.wav"
    sf.write(in_path, samples, sample_rate, subtype="PCM_16")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(in_path),
         "-af", f"atempo={required_factor:.5f}", "-ar", str(sample_rate), str(out_path)])
    processed, sample_rate_out = sf.read(out_path, dtype="float32")
    if sample_rate_out != sample_rate:
        raise RuntimeError("Unexpected voice sample rate after time stretch")
    return processed


def main():
    assert VOICE in {"em_alex", "em_santa", "ef_dora"}, "Spanish Kokoro voice required"
    assert Path(MODEL).stat().st_size > 80_000_000, "Missing or truncated Kokoro model"
    assert Path(VOICES).stat().st_size > 10_000_000, "Missing or truncated Kokoro voice bank"

    kokoro = Kokoro(MODEL, VOICES)
    g2p = EspeakG2P(language="es")
    sr = None
    narration = None
    segments = []
    for index, (start, stop, phrase) in enumerate(SCENES):
        phonemes, _tokens = g2p(phrase)
        if not phonemes or not phonemes.strip():
            raise RuntimeError(f"Empty Spanish phonemes in scene {index}")
        samples, rate = kokoro.create(phonemes, voice=VOICE, speed=1.07, is_phonemes=True)
        samples = np.asarray(samples, dtype="float32").reshape(-1)
        if not np.isfinite(samples).all() or np.max(np.abs(samples), initial=0) < .003:
            raise RuntimeError(f"Invalid/silent Kokoro audio in scene {index}")
        if sr is None:
            sr = rate
            narration = np.zeros(round(DURATION * sr), dtype="float32")
        if rate != sr:
            raise RuntimeError("Sample rate changed between voice segments")
        budget = (stop - start) - .06
        if len(samples) / sr > budget:
            factor = len(samples) / sr / budget * 1.015
            samples = speed_up(samples, sr, factor, index)
        target = round(start * sr)
        if target + len(samples) > round(stop * sr):
            raise RuntimeError(f"Scene {index} overlaps the next scene")
        fade = min(round(sr * .045), len(samples) // 8)
        if fade:
            samples[:fade] *= np.linspace(0, 1, fade, dtype="float32")
            samples[-fade:] *= np.linspace(1, 0, fade, dtype="float32")
        narration[target:target + len(samples)] += samples
        segments.append({"scene": index, "start": start, "end": stop, "spokenDuration": round(len(samples) / sr, 3), "text": phrase})
        print("KOKORO_SEGMENT", index, round(len(samples) / sr, 2), phrase, flush=True)

    if sr is None or np.max(np.abs(narration)) < 0.01:
        raise RuntimeError("Narration is silent")
    voice_file = OUTPUT / "azur-narracion-kokoro-solo.wav"
    sf.write(voice_file, narration, sr, subtype="PCM_24")

    score_paths = sorted(Path("artifacts/score-master").glob("*.wav"))
    if not score_paths:
        raise RuntimeError("The game's original music was not generated")
    music = next((p for p in score_paths if p.stem in {"forest", "explore", "village", "title"}), score_paths[0])
    mix_file = OUTPUT / "azur-kokoro-mix-28s.wav"
    filters = (
        "[0:a]volume=0.23[music];"
        "[1:a]highpass=f=90,lowpass=f=11000,"
        "acompressor=threshold=0.085:ratio=2.4:attack=12:release=185,"
        "volume=1.10[voice];"
        "[music][voice]sidechaincompress=threshold=0.030:ratio=6:"
        "attack=40:release=450[ducked];"
        "[ducked][voice]amix=inputs=2:duration=first:normalize=0,"
        "alimiter=limit=0.90[out]"
    )
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-stream_loop", "-1", "-i", str(music), "-i", str(voice_file),
         "-filter_complex", filters, "-map", "[out]", "-t", str(DURATION),
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(mix_file)])
    probe = json.loads(run(["ffprobe", "-v", "error", "-show_entries",
                            "format=duration,size", "-of", "json", str(mix_file)]))
    actual = float(probe["format"]["duration"])
    if abs(actual - DURATION) > .05:
        raise RuntimeError(f"Wrong mixed audio duration {actual}")
    report = {"status": "SUCCESS", "generator": "Kokoro ONNX 0.6.1",
              "voice": VOICE, "language": "es", "model": Path(MODEL).name,
              "mix": mix_file.name, "voiceOnly": voice_file.name,
              "music": music.name, "durationSeconds": actual, "segments": segments}
    (OUTPUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print("KOKORO_VOICE_SUCCESS", json.dumps(report, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
