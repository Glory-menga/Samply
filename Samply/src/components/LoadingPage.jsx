import { motion } from 'framer-motion';
import AnimatedBackground from "./background/AnimatedBackground";
import Metaball from "./3dObjects/Metaball";
import '../css/LoadingPage.css';

function LoadingPage() {
  return (
    <>
      <AnimatedBackground />
      <motion.div 
        className="loading-page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
      >
        <motion.div 
          className="metaballs-loading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6,
            delay: 0.2,
            ease: "easeOut"
          }}
        >
          <div className="metaball-loading">
            <Metaball width="100%" height="100%" sphereScale={1.4} animationSpeed={2}/>
          </div>
          <div className="metaball-loading">
            <Metaball width="100%" height="100%" sphereScale={1.4} animationSpeed={2}/>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            delay: 0.4,
            ease: "easeOut"
          }}
        >
          Turning words into music... just a moment while we create your custom sample.
        </motion.p>
      </motion.div>
    </>
  );
}

export default LoadingPage;