import { motion } from 'framer-motion';
import { staggerContainer, slideUp } from '../lib/animations/variants';

const StaggeredList = ({ items }: { items: string[] }) => {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {items.map((item, index) => (
        <motion.li key={index} variants={slideUp}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default StaggeredList;