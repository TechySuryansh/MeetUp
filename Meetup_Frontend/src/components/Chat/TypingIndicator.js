import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = ({ users }) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -10 },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        repeatDelay: 0.5,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 px-4 py-2"
    >
      <div className="flex space-x-1">
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 0.1,
          }}
        />
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 0.2,
          }}
        />
      </div>
      <span className="text-sm text-gray-400">
        {users.length === 1 ? `${users[0]} is typing...` : 'Multiple users typing...'}
      </span>
    </motion.div>
  );
};

export default TypingIndicator;
