import React from 'react';
import { motion } from 'framer-motion';
import { glassMorphism, aiInteraction } from '../../styles/design-system';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  interactive = false,
  loading = false,
}) => {
  const baseClasses = `
    ${glassMorphism.backdrop}
    ${glassMorphism.border}
    ${glassMorphism.shadow}
    rounded-xl
    p-6
    transition-all
    duration-300
  `;

  const interactiveClasses = interactive
    ? `
      cursor-pointer
      hover:scale-[1.02]
      active:scale-[0.98]
      ${aiInteraction.highlight}
    `
    : '';

  const loadingClasses = loading ? aiInteraction.pulse : '';

  const MotionComponent = interactive ? motion.div : 'div';

  return (
    <MotionComponent
      className={`${baseClasses} ${interactiveClasses} ${loadingClasses} ${className}`}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {children}
    </MotionComponent>
  );
};

export default Card; 