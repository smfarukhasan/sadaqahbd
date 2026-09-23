'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './ImageCropperModal3x4.module.css';
import { Check, X, ZoomIn, ZoomOut, UploadCloud } from 'lucide-react';

interface ImageCropperModal3x4Props {
  imageFile: File;
  isBn?: boolean;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const OUTPUT_W = 360;
const OUTPUT_H = 480;

export default function ImageCropperModal3x4({
  imageFile,
  isBn = true,
  onConfirm,
  onCancel,
}: ImageCropperModal3x4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [confirmed, setConfirmed] = useState(false);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const CANVAS_W = 270;
  const CANVAS_H = 360;

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      const scaleX = CANVAS_W / img.naturalWidth;
      const scaleY = CANVAS_H / img.naturalHeight;
      setZoom(Math.max(scaleX, scaleY));
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    const drawW = img.naturalWidth * z;
    const drawH = img.naturalHeight * z;
    const halfW = (CANVAS_W - drawW) / 2;
    const halfH = (CANVAS_H - drawH) / 2;
    const cxMin = Math.min(-halfW, CANVAS_W - drawW - halfW);
    const cxMax = Math.max(-halfW, CANVAS_W - drawW - halfW);
    const cyMin = Math.min(-halfH, CANVAS_H - drawH - halfH);
    const cyMax = Math.max(-halfH, CANVAS_H - drawH - halfH);
    return {
      x: Math.min(Math.max(ox, cxMin), cxMax),
      y: Math.min(Math.max(oy, cyMin), cyMax),
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const drawW = img.naturalWidth * zoom;
    const drawH = img.naturalHeight * zoom;
    const x = (CANVAS_W - drawW) / 2 + offset.x;
    const y = (CANVAS_H - drawH) / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
  }, [zoom, offset]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, zoom));
  };
  const handlePointerUp = () => { dragging.current = false; };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((prev) => {
      const img = imgRef.current;
      if (!img) return prev;
      const minZ = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const next = Math.min(Math.max(prev + delta, minZ), minZ * 4);
      setOffset((prevOff) => clampOffset(prevOff.x, prevOff.y, next));
      return next;
    });
  };

  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    setZoom(next);
    setOffset((prev) => clampOffset(prev.x, prev.y, next));
  };

  const minZoom = imgRef.current
    ? Math.max(CANVAS_W / imgRef.current.naturalWidth, CANVAS_H / imgRef.current.naturalHeight)
    : 0.5;

  const handleConfirmCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = OUTPUT_W;
    offscreen.height = OUTPUT_H;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    const scaleUp = OUTPUT_W / CANVAS_W;
    const drawW = img.naturalWidth * zoom * scaleUp;
    const drawH = img.naturalHeight * zoom * scaleUp;
    const x = (OUTPUT_W - drawW) / 2 + offset.x * scaleUp;
    const y = (OUTPUT_H - drawH) / 2 + offset.y * scaleUp;
    ctx.drawImage(img, x, y, drawW, drawH);
    setCroppedDataUrl(offscreen.toDataURL('image/jpeg', 0.88));
    setConfirmed(true);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>
            {isBn ? 'ছবি ক্রপ করুন (৩:৪)' : 'Crop Photo (3:4)'}
          </span>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        {!confirmed ? (
          <div className={styles.body}>
            <p className={styles.hint}>
              {isBn ? 'ছবি টেনে সরান বা স্ক্রোল করে জুম করুন।' : 'Drag to reposition, scroll to zoom.'}
            </p>
            <div className={styles.canvasWrapper}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className={styles.canvas}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
              />
            </div>
            <div className={styles.zoomRow}>
              <ZoomOut size={16} className={styles.zoomIcon} />
              <input
                type="range"
                min={minZoom}
                max={minZoom * 4}
                step={0.01}
                value={zoom}
                onChange={handleZoomSlider}
                className={styles.zoomSlider}
              />
              <ZoomIn size={16} className={styles.zoomIcon} />
            </div>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleConfirmCrop}
              disabled={!imgLoaded}
            >
              <Check size={22} />
              <span>{isBn ? 'ক্রপ নিশ্চিত করুন ✔' : 'Confirm Crop ✔'}</span>
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            <p className={styles.hint}>
              {isBn ? 'ক্রপ করা ছবির প্রিভিউ:' : 'Cropped photo preview:'}
            </p>
            {croppedDataUrl && (
              <div className={styles.previewWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={croppedDataUrl} alt="Cropped preview" className={styles.previewImg} />
              </div>
            )}
            <div className={styles.actionRow}>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmed(false)}>
                <X size={16} />
                <span>{isBn ? 'পুনরায় ক্রপ করুন' : 'Re-crop'}</span>
              </button>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => croppedDataUrl && onConfirm(croppedDataUrl)}
              >
                <UploadCloud size={16} />
                <span>{isBn ? 'আপলোড করুন' : 'Upload'}</span>
              </button>
            </div>
            <button type="button" className={styles.cancelOutlineBtn} onClick={onCancel}>
              {isBn ? 'কেন্সেল' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
