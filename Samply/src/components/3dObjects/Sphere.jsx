import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimplexNoise } from 'three-stdlib';

const simplex = new SimplexNoise();

const Sphere = ({ analyser = null, scale = 1, animationSpeed = 1, isHovering = false }) => {
  const meshRef = useRef(null);
  const basePositions = useRef(null);
  const time = useRef(0);
  const dataArray = useRef(null);
  const materialRef = useRef(null);
  
  const spinVelocity = useRef({
    x: 0.2 + Math.random() * 0.3, 
    y: 0.15 + Math.random() * 0.25,
    z: 0.1 + Math.random() * 0.2
  });
  const totalRotation = useRef({ x: 0, y: 0, z: 0 });

  useFrame((_, delta) => {
    time.current += delta * animationSpeed; 
    const mesh = meshRef.current;
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    
    if (!basePositions.current) {
      basePositions.current = position.array.slice();
    }
    
    if (analyser) {
      if (!dataArray.current) {
        dataArray.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArray.current);
    }
    
    const avgFrequency = dataArray.current
      ? dataArray.current.reduce((sum, val) => sum + val, 0) / dataArray.current.length
      : 0;
    
    let boost = 1;
    if (analyser && dataArray.current) {
      const normalized = avgFrequency / 128;
      if (normalized > 0.05) {
        boost += normalized * 10; 
      }
    }
    
    const noiseStrength = 0.02; 
    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = basePositions.current[ix];
      const y = basePositions.current[ix + 1];
      const z = basePositions.current[ix + 2];
      const noise = noiseStrength * simplex.noise4d(
        x * 1.5,
        y * 1.5,
        z * 1.5,
        time.current * 0.5 
      );
      const scale = 1 + noise * boost;
      position.setXYZ(i, x * scale, y * scale, z * scale);
    }
    
    position.needsUpdate = true;
    geometry.computeVertexNormals();

    if (mesh) {
      totalRotation.current.x += spinVelocity.current.x * delta * animationSpeed;
      totalRotation.current.y += spinVelocity.current.y * delta * animationSpeed;
      totalRotation.current.z += spinVelocity.current.z * delta * animationSpeed;
      
      const floatWobbleX = Math.sin(time.current * 0.3) * 0.1;
      const floatWobbleY = Math.cos(time.current * 0.25) * 0.08;
      const floatWobbleZ = Math.sin(time.current * 0.35) * 0.06;
      
      mesh.rotation.x = totalRotation.current.x + floatWobbleX;
      mesh.rotation.y = totalRotation.current.y + floatWobbleY;
      mesh.rotation.z = totalRotation.current.z + floatWobbleZ;
      
      mesh.position.y = Math.sin(time.current * 0.4) * 0.05;
      mesh.position.x = Math.cos(time.current * 0.3) * 0.03;
      
      spinVelocity.current.x *= 0.9999;
      spinVelocity.current.y *= 0.9999;
      spinVelocity.current.z *= 0.9999;
    }

    if (materialRef.current) {
      const targetColor = isHovering ? '#9cb2c6' : '#36454F'; 
      const currentColor = materialRef.current.color;
      const targetColorObj = new THREE.Color(targetColor);
      
      currentColor.lerp(targetColorObj, delta * 10); 
    }
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[1, 128, 128]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#36454F"
        roughness={0}
        metalness={1}
        clearcoat={1}
        clearcoatRoughness={0}
        reflectivity={1}
      />
    </mesh>
  );
};

export default Sphere;