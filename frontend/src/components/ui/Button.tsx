import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { glassMorphism, aiInteraction } from '../../styles/design-system';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex
    items-center
    justify-center
    font-medium
    transition-all
    duration-300
    rounded-lg
    ${glassMorphism.backdrop}
    ${glassMorphism.border}
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-primary-500
      text-white
      hover:bg-primary-600
      active:bg-primary-700
      ${aiInteraction.glow}
    `,
    secondary: `
      bg-neutral-100
      text-neutral-900
      dark:bg-neutral-800
      dark:text-neutral-100
      hover:bg-neutral-200
      dark:hover:bg-neutral-700
      active:bg-neutral-300
      dark:active:bg-neutral-600
    `,
    ghost: `
      bg-transparent
      text-neutral-900
      dark:text-neutral-100
      hover:bg-neutral-100
      dark:hover:bg-neutral-800
      active:bg-neutral-200
      dark:active:bg-neutral-700
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const loadingClasses = loading ? aiInteraction.pulse : '';

  return (
    <motion.button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${loadingClasses}
        ${className}
      `}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"
        />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button; 