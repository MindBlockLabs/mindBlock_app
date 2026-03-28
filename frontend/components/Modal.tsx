import { motion } from 'framer-motion';
import { fadeIn, scaleIn } from '../lib/animations/variants';

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeIn}
      className="modal-backdrop"
      onClick={onClose}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={scaleIn}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Modal;