import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Sphere from './Sphere';

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
        <Sphere 
          analyser={analyser} 
          scale={sphereScale} 
          animationSpeed={animationSpeed}
          isHovering={isHovering}
        />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default Metaball;