import AnimatedBackground from "./background/AnimatedBackground";
import Metaball from "./3dObjects/Metaball";
import { motion } from "framer-motion";
import '../css/LoadingPage.css';

function LoadingDownload(){
    return (
        <>
            <AnimatedBackground />
            <div className="loading-page-container">
                <div className="metaballs-loading">
                    <div className="metaball-loading">
                        <Metaball width="100%" height="100%" sphereScale={1.4} animationSpeed={2}/>
                    </div>
                    <div className="metaball-loading">
                        <Metaball width="100%" height="100%" sphereScale={1.4} animationSpeed={2}/>
                    </div>
                </div>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    Hold tight! Your sample is almost ready to download.
                </motion.p>
            </div>
        </>
    );
}

export default LoadingDownload;