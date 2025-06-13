import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Sphere from './Sphere';

/**
 * Renders a 3D metaball visual using react-three-fiber and a custom Sphere component
 * @param {AnalyserNode} analyser - Web Audio API analyser used for real-time audio data
 * @param {string|number} width - Width of the canvas container (default '100%')
 * @param {string|number} height - Height of the canvas container (default '100%')
 * @param {number} sphereScale - Scale multiplier for the 3D sphere (default 1)
 * @param {number} animationSpeed - Speed of sphere animation (default 1)
 * @param {boolean} isHovering - Determines if hover-based visual changes should apply
 */
const Metaball = ({ 
  analyser, 
  width = '100%', 
  height = '100%', 
  sphereScale = 1, 
  animationSpeed = 1,
  isHovering = false
}) => {
  return (
    <div 
      style={{ 
        width, 
        height, 
        background: 'transparent',
        transition: 'all 0.3s ease'
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 60 }} 
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff"/>
        <directionalLight position={[-5, 5, 5]} intensity={1.5} color="#ffffff"/>
        <directionalLight position={[0, -5, -5]} intensity={1} />
        <Environment preset="studio" />

        {/* Render animated sphere affected by audio data and hover */}
        <Sphere 
          analyser={analyser} 
          scale={sphereScale} 
          animationSpeed={animationSpeed}
          isHovering={isHovering}
        />

        {/* Add mouse orbit control, disable zoom and pan */}
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default Metaball;
