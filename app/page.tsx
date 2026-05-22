"use client";

import { useState, useCallback, useRef } from "react";

const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_BYTES = 5 * 1024 * 1024;

function convertSvgToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.max(img.naturalWidth || 512, img.naturalHeight || 512, 512);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export default function Home() {
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED.includes(file.type)) {
        setError("Please upload a PNG, JPG, or SVG file.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File too large — maximum 5 MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        let dataUrl = e.target?.result as string;

        if (file.type === "image/svg+xml") {
          try {
            dataUrl = await convertSvgToPng(dataUrl);
          } catch {
            setError("Could not convert SVG — try exporting as PNG.");
            return;
          }
        }

        setOriginal(dataUrl);
        setResult(null);
        setLoading(true);

        try {
          const res = await fetch("/api/transform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });

          if (res.status === 429) {
            setLimitReached(true);
            return;
          }

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error ?? "Transformation failed.");
          }

          const data = await res.json();
          setResult(data.image);
        } catch (err) {
          if (!limitReached) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [limitReached]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const download = () => {
    if (!result) return;
    const mimeMatch = result.match(/^data:(image\/[\w+]+);base64,/);
    const ext = mimeMatch ? mimeMatch[1].split("/")[1].replace("jpeg", "jpg") : "jpg";
    const a = document.createElement("a");
    a.href = result;
    a.download = `discomorphism.${ext}`;
    a.click();
  };

  const reset = () => {
    setOriginal(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 bg-[#0a0a0a]">
      {/* ── Header ── */}
      <header className="text-center mb-10 max-w-2xl">
        <div className="text-6xl mb-4 select-none">🪩</div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight disco-title mb-3">
          Discomorphism
        </h1>
        <p className="text-[#888] text-base sm:text-lg leading-relaxed">
          Upload any logo or image and watch it transform into a{" "}
          <span className="text-[#c0a0ff]">glittering disco ball</span> version.
        </p>
      </header>

      {/* ── Limit reached ── */}
      {limitReached && (
        <div className="w-full max-w-lg mb-8 rounded-2xl border border-[#3a2a4a] bg-[#1a0a2a] p-6 text-center">
          <div className="text-3xl mb-3">🚫</div>
          <p className="text-white font-semibold mb-1">Free tier limit reached</p>
          <p className="text-[#888] text-sm mb-4">
            The free generation limit has been reached.
          </p>
          <a
            href="https://github.com/MaartenKesters/Discomorphism"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-2 rounded-full border border-[#c0a0ff] text-[#c0a0ff] text-sm hover:bg-[#c0a0ff] hover:text-black transition-colors"
          >
            Self-host on GitHub →
          </a>
        </div>
      )}

      {/* ── Main card ── */}
      {!limitReached && (
        <div className="w-full max-w-3xl">
          {/* Drop zone — shown when no result yet */}
          {!result && !loading && (
            <div
              className={`drop-zone rounded-3xl bg-[#141414] flex flex-col items-center justify-center gap-4 p-12 cursor-pointer select-none ${dragging ? "dragging" : ""}`}
              style={{ minHeight: 280 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            >
              <div className="text-5xl select-none">
                {dragging ? "🪩" : "📁"}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-1">
                  {dragging ? "Drop it!" : "Drop your image here"}
                </p>
                <p className="text-[#888] text-sm">
                  or click to browse — PNG, JPG, SVG · max 5 MB
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div
              className="rounded-3xl bg-[#141414] border border-[#2a2a2a] flex flex-col items-center justify-center gap-6 p-12"
              style={{ minHeight: 280 }}
            >
              <div className="disco-spin text-5xl">🪩</div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-2">
                  Discoifying your image...
                </p>
                <p className="text-[#888] text-sm mb-4">
                  Applying mirror facets and glitter — takes ~15s
                </p>
                <div className="flex gap-2 justify-center">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
              {original && (
                <img
                  src={original}
                  alt="Original"
                  className="h-20 w-20 object-cover rounded-xl opacity-40"
                />
              )}
            </div>
          )}

          {/* Results — side by side */}
          {result && !loading && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original */}
                <div className="rounded-2xl bg-[#141414] border border-[#2a2a2a] overflow-hidden">
                  <p className="text-xs text-[#888] px-4 pt-3 pb-2 font-medium uppercase tracking-wider">
                    Original
                  </p>
                  <img
                    src={original!}
                    alt="Original"
                    className="w-full object-contain max-h-72"
                  />
                </div>

                {/* Result */}
                <div className="rounded-2xl bg-[#141414] border border-[#3a2a5a] overflow-hidden result-glow">
                  <p className="text-xs text-[#c0a0ff] px-4 pt-3 pb-2 font-medium uppercase tracking-wider">
                    Disco version ✨
                  </p>
                  <img
                    src={result}
                    alt="Disco result"
                    className="w-full object-contain max-h-72"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={download}
                  className="px-6 py-2.5 rounded-full bg-[#c0a0ff] text-black font-semibold text-sm hover:bg-white transition-colors"
                >
                  Download 🪩
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-2.5 rounded-full border border-[#2a2a2a] text-[#888] text-sm hover:text-white hover:border-[#555] transition-colors"
                >
                  Try another
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mt-auto pt-16 text-center text-[#555] text-xs">
        <p>
          Discomorphism — riding the Spotify 20th anniversary wave 🪩 —{" "}
          <a
            href="https://github.com/MaartenKesters/Discomorphism"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#888] transition-colors underline underline-offset-2"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
