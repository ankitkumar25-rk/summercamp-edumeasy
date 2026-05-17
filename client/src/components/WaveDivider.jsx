// CHANGED: Created WaveDivider component to render inline SVG wave section separators.

import React from 'react';
import PropTypes from 'prop-types';

const WaveDivider = ({ flip = false }) => (
  <div 
    aria-hidden="true" 
    style={{ 
      lineHeight: 0, 
      transform: flip ? 'scaleY(-1)' : 'none',
      marginTop: '-2px',
      pointerEvents: 'none',
      userSelect: 'none'
    }}
  >
    <svg 
      viewBox="0 0 1440 60" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ display: 'block', width: '100%' }}
    >
      <path 
        d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" 
        fill="rgba(61,26,142,0.06)" 
      />
      <path 
        d="M0,40 C360,10 720,55 1080,25 C1260,10 1380,40 1440,35 L1440,60 L0,60 Z" 
        fill="rgba(245,166,35,0.08)" 
      />
    </svg>
  </div>
);

WaveDivider.propTypes = {
  flip: PropTypes.bool,
};

export default WaveDivider;
