import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Galaxy = () => {
  const mountRef = useRef(null);

  /**
   * Initializes the Three.js scene, camera, renderer, and particle system
   * Sets up star positions, velocities, and sizes
   * Adds resize event listener and starts animation loop
   */
  useEffect(() => {
    if (!mountRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Create the 3D scene and background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Set up camera with perspective view
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Create and configure the WebGL renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);

    // Remove any existing children in the mount node
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Generate stars and set positions and velocities
    const starCount = 5000;
    const starGeometry = new THREE.BufferGeometry();

    const sizes = new Float32Array(starCount);
    const positions = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;      
      positions[i + 1] = (Math.random() - 0.5) * 200;  
      positions[i + 2] = (Math.random() - 0.5) * 200;  

      velocities[i] = (Math.random() - 0.5) * 0.01;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.01;

      sizes[i/3] = Math.random() * 0.3 + 0.1;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
      sizeAttenuation: true,
    });

    const starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);

    /**
     * Handles window resize and updates camera and renderer dimensions
     */
    const handleResize = () => {
      if (!mountRef.current) return;

      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;

      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    /**
     * Animation loop that rotates and moves stars, then renders the scene
     */
    const animate = () => {
      requestAnimationFrame(animate);

      starSystem.rotation.y += 0.0002;
      starSystem.rotation.x += 0.00010;

      const positions = starGeometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

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

    /**
     * Cleanup function to remove event listeners and dispose of Three.js objects
     */
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
  
  return <div ref={mountRef} className="galaxy-container" />;
};

export default Galaxy;
