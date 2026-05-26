import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField({ color = "#3b82f6" }) {
  const ref = useRef();
  
  // Create random positions for the particles
  const [positions] = useMemo(() => {
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return [pos];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.03;
    ref.current.rotation.x = t * 0.01;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function FloatingShapes({ color = "#3b82f6" }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t / 4) * 0.3;
    meshRef.current.rotation.y = Math.cos(t / 5) * 0.3;
    meshRef.current.position.y = Math.sin(t / 2) * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[3, 0, -5]}>
      <icosahedronGeometry args={[2, 1]} />
      <meshStandardMaterial 
        color={color} 
        wireframe 
        transparent 
        opacity={0.1} 
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

const GlobalBackground3D = ({ theme = 'dark', zIndex = -1, opacity }) => {
  const primaryColor = theme === 'dark' ? "#3b82f6" : "#2563eb";

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      zIndex,
      pointerEvents: 'none',
      background: 'transparent',
      opacity: opacity ?? (theme === 'dark' ? 0.4 : 0.2)
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ParticleField color={primaryColor} />
        <FloatingShapes color={primaryColor} />
      </Canvas>
    </div>
  );
};

export default GlobalBackground3D;
