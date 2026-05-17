// CHANGED: Added new MathBackground component with floating math symbols and corner doodle equations, including slow framer-motion drift animations and dynamic mobile slicing.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TbMathFunction, 
  TbMathIntegral, 
  TbMathSymbols, 
  TbSum, 
  TbDivide, 
  TbSquareRoot 
} from 'react-icons/tb';
import { 
  PiPlusMinus, 
  PiPercent, 
  PiPi, 
  PiInfinity 
} from 'react-icons/pi';
import { 
  MdOutlineCalculate 
} from 'react-icons/md';

const mathSymbols = [
  { Icon: TbMathFunction, top: '8%', left: '5%', size: 32, rotate: -15, opacity: 0.07 },
  { Icon: PiPi, top: '12%', left: '88%', size: 28, rotate: 20, opacity: 0.06 },
  { Icon: TbSum, top: '22%', left: '15%', size: 36, rotate: 0, opacity: 0.08 },
  { Icon: TbMathIntegral, top: '18%', left: '72%', size: 40, rotate: 10, opacity: 0.07 },
  { Icon: PiInfinity, top: '35%', left: '92%', size: 30, rotate: -5, opacity: 0.06 },
  { Icon: TbDivide, top: '40%', left: '3%', size: 26, rotate: 15, opacity: 0.08 },
  { Icon: PiPercent, top: '48%', left: '55%', size: 34, rotate: -20, opacity: 0.05 },
  { Icon: TbSquareRoot, top: '55%', left: '25%', size: 38, rotate: 5, opacity: 0.07 },
  { Icon: MdOutlineCalculate, top: '60%', left: '80%', size: 32, rotate: -10, opacity: 0.06 },
  { Icon: TbMathSymbols, top: '68%', left: '10%', size: 28, rotate: 25, opacity: 0.07 },
  { Icon: PiPlusMinus, top: '72%', left: '65%', size: 36, rotate: -15, opacity: 0.06 },
  { Icon: TbSum, top: '80%', left: '40%', size: 30, rotate: 10, opacity: 0.05 },
  { Icon: TbMathIntegral, top: '85%', left: '90%', size: 34, rotate: 0, opacity: 0.07 },
  { Icon: PiPi, top: '88%', left: '18%', size: 26, rotate: -8, opacity: 0.06 },
  { Icon: TbDivide, top: '92%', left: '75%', size: 28, rotate: 20, opacity: 0.05 },
  { Icon: TbMathFunction, top: '30%', left: '45%', size: 40, rotate: -25, opacity: 0.04 },
  { Icon: PiInfinity, top: '5%', left: '50%', size: 32, rotate: 12, opacity: 0.06 },
  { Icon: MdOutlineCalculate, top: '75%', left: '5%', size: 30, rotate: -5, opacity: 0.05 },
];

const MathBackground = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleSymbols = isMobile ? mathSymbols.slice(0, 8) : mathSymbols;

  return (
    <div 
      aria-hidden="true" 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Layer 2: Floating Math Symbols */}
      {visibleSymbols.map((item, index) => {
        const IconComponent = item.Icon;
        const isEven = index % 2 === 0;
        const animationY = isEven ? [-12, 0, -12] : [10, 0, 10];
        const duration = isEven ? 8 : 10;

        return (
          <motion.div
            key={index}
            animate={{ y: animationY }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              transform: `rotate(${item.rotate}deg)`,
              opacity: item.opacity,
              color: 'var(--primary)',
              lineHeight: 0,
            }}
          >
            <IconComponent size={item.size} />
          </motion.div>
        );
      })}

      {/* Layer 3: Corner Doodle Equations (Hidden on mobile) */}
      {!isMobile && (
        <>
          <div style={{
            position: 'absolute',
            top: '2%',
            left: '1%',
            opacity: 0.06,
            fontFamily: 'var(--font-display)',
            color: 'var(--primary)',
            fontSize: '1.1rem',
            pointerEvents: 'none',
          }}>
            a² + b² = c²
          </div>
          <div style={{
            position: 'absolute',
            top: '2%',
            right: '1%',
            opacity: 0.06,
            fontFamily: 'var(--font-display)',
            color: 'var(--primary)',
            fontSize: '1.1rem',
            pointerEvents: 'none',
          }}>
            ∫f(x)dx
          </div>
          <div style={{
            position: 'absolute',
            bottom: '2%',
            left: '1%',
            opacity: 0.06,
            fontFamily: 'var(--font-display)',
            color: 'var(--primary)',
            fontSize: '1.1rem',
            pointerEvents: 'none',
          }}>
            E = mc²
          </div>
          <div style={{
            position: 'absolute',
            bottom: '2%',
            right: '1%',
            opacity: 0.06,
            fontFamily: 'var(--font-display)',
            color: 'var(--primary)',
            fontSize: '1.1rem',
            pointerEvents: 'none',
          }}>
            y = mx + c
          </div>
        </>
      )}
    </div>
  );
};

export default MathBackground;
