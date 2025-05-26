import AnimatedBackground from "./background/AnimatedBackground";
import Metaball from "./3dObjects/Metaball";
import '../css/LoadingPage.css';

function LoadingPage(){
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
                <p>Turning words into music... just a moment while we create your custom sample.</p>
            </div>
        </>
    );
}

export default LoadingPage;