import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const Counter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second
    const increment = target / (duration / 16); // 16ms per frame

    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.ceil(current));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [target]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {count}
    </motion.span>
  );
};

export default Counter;