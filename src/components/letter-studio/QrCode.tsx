"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

interface QrCodeProps {
  url: string;
  color: string;
}

export function QrCode({ url, color }: QrCodeProps) {
  const elements = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const cell = 100 / n;
    const els: React.ReactNode[] = [];
    const inFinder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c) && !inFinder(r, c)) {
          els.push(
            <circle
              key={`${r}-${c}`}
              cx={(c + 0.5) * cell}
              cy={(r + 0.5) * cell}
              r={cell * 0.42}
              fill={color}
            />
          );
        }
      }
    }

    ([[0, 0], [0, n - 7], [n - 7, 0]] as const).forEach(([r, c], i) => {
      els.push(
        <rect
          key={`f${i}`}
          x={(c + 0.5) * cell}
          y={(r + 0.5) * cell}
          width={6 * cell}
          height={6 * cell}
          rx={2 * cell}
          fill="none"
          stroke={color}
          strokeWidth={cell}
        />
      );
      els.push(
        <rect
          key={`g${i}`}
          x={(c + 2) * cell}
          y={(r + 2) * cell}
          width={3 * cell}
          height={3 * cell}
          rx={1.1 * cell}
          fill={color}
        />
      );
    });

    return els;
  }, [url, color]);

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="QRコード"
    >
      {elements}
    </svg>
  );
}
