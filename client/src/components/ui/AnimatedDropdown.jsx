import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const containerVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.06
    }
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } }
};

const optionVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.16, ease: 'easeOut' } }
};

const AnimatedDropdown = ({ options = [], value, onChange, placeholder = 'Select an option' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.id) === String(value)),
    [options, value]
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (optionId) => {
    if (onChange) onChange({ target: { value: optionId } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full text-sm">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`w-full rounded-lg border px-3 py-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          isDark
            ? 'border-slate-700 bg-slate-800 text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`truncate ${selectedOption ? '' : isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              {selectedOption?.label || placeholder}
            </p>
            {selectedOption?.description ? (
              <p className={`truncate text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedOption.description}
              </p>
            ) : null}
          </div>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            <ChevronDown size={16} className={isDark ? 'text-slate-300' : 'text-slate-500'} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className={`absolute z-30 mt-2 w-full overflow-hidden rounded-lg border shadow-lg ${
              isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
            }`}
          >
            {options.map((option) => {
              const isSelected = String(option.id) === String(value);

              return (
                <motion.button
                  type="button"
                  key={option.id}
                  variants={optionVariants}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-3 py-2 text-left transition-colors ${
                    isDark
                      ? 'hover:bg-slate-800 text-slate-100'
                      : 'hover:bg-slate-50 text-slate-900'
                  } ${isSelected ? (isDark ? 'bg-slate-800/80' : 'bg-slate-50') : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{option.label}</p>
                      {option.description ? (
                        <p className={`truncate text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {option.description}
                        </p>
                      ) : null}
                    </div>
                    {isSelected ? <Check size={16} className={isDark ? 'text-blue-300' : 'text-blue-600'} /> : null}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedDropdown;
