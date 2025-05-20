import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Galaxy = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Get the container dimensions from the actual DOM element
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    
    // Add renderer to the DOM - clear existing content first
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);
    
    // Create star particles
    const starCount = 15000;
    const starGeometry = new THREE.BufferGeometry();
    
    // Create varying star sizes
    const sizes = new Float32Array(starCount);
    
    // Create star positions
    const positions = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      // Random position between -100 and 100
      positions[i] = (Math.random() - 0.5) * 200;      // x
      positions[i + 1] = (Math.random() - 0.5) * 200;  // y
      positions[i + 2] = (Math.random() - 0.5) * 200;  // z
      
      // Random velocities for subtle movement
      velocities[i] = (Math.random() - 0.5) * 0.01;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.01;
      
      // Random sizes for stars
      sizes[i/3] = Math.random() * 0.3 + 0.1;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Star material
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
      sizeAttenuation: true,
    });
    
    // Create star system
    const starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation function
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the entire star system slightly
      starSystem.rotation.y += 0.0001;
      starSystem.rotation.x += 0.00005;
      
      // Move individual stars for a parallax effect
      const positions = starGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Add velocity to positions
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        // If a star goes too far, reset it to the opposite side
        if (positions[i] > 100) positions[i] = -100;
        if (positions[i] < -100) positions[i] = 100;
        
        if (positions[i + 1] > 100) positions[i + 1] = -100;
        if (positions[i + 1] < -100) positions[i + 1] = 100;
        
        if (positions[i + 2] > 100) positions[i + 2] = -100;
        if (positions[i + 2] < -100) positions[i + 2] = 100;
      }
      
      starGeometry.attributes.position.needsUpdate = true;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.remove(starSystem);
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  
  // No inline styles - use className for external styling
  return <div ref={mountRef} className="galaxy-container" />;
};

export default Galaxy;
