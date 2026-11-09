'use client';

import { useEffect, useRef } from 'react';

export default function InstagramFeed() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    const script = document.createElement('script');
    script.src = 'https://wdg.fouita.com/widgets/0x3f59f8.js';
    script.async = true;
    script.onerror = () => {
      console.error('Unable to load the Instagram feed widget.');
    };
    widget.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="fouita-widget-container">
      <div ref={widgetRef} data-key="Instagram Feed" className="ft" id="ftrc98dpg" />
    </div>
  );
}
