'use client';

import React from 'react';

export function BackgroundDesign() {
  return (
    <>
      <div className="mesh-gradient" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>
      <div className="noise-overlay" aria-hidden="true" />
    </>
  );
}
