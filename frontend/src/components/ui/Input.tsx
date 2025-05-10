import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { glassMorphism, aiInteraction } from '../../styles/design-system';

interface InputProps extends HTMLMotionProps<"input"> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  loading = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = `
    w-full
    px-4
    py-2
    rounded-lg
    transition-all
    duration-300
    ${glassMorphism.backdrop}
    ${glassMorphism.border}
    focus:outline-none
    focus:ring-2
    focus:ring-primary-500
    dark:bg-neutral-800/50
    dark:text-neutral-100
  `;

  const errorClasses = error
    ? 'border-red-500 focus:ring-red-500'
    : isFocused
    ? 'border-primary-500'
    : 'border-neutral-200 dark:border-neutral-700';

  const loadingClasses = loading ? aiInteraction.pulse : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <motion.input
          className={`
            ${baseClasses}
            ${errorClasses}
            ${loadingClasses}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"
          />
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default Input; 