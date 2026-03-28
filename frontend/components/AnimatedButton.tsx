import { motion } from 'framer-motion';
import { pulse } from '../lib/animations/variants';

const AnimatedButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      variants={pulse}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;