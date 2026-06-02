"use client";

import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Float,
  PerspectiveCamera,
  MeshDistortMaterial,
  MeshTransmissionMaterial,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

function Crystal() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { mouse } = useThree();

  // Tạo hình dáng đá muối không đối xứng (asymmetrical)
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.2, 12);
    const positions = geo.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      // Tạo sự lồi lõm tự nhiên của tinh thể đá
      const noise = (Math.random() - 0.5) * 0.15;
      vertex.multiplyScalar(1 + noise);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Hiệu ứng tương tác chuột & xung nhịp ánh sáng
  useFrame((state) => {
    if (meshRef.current) {
      // Mouse Parallax
      const targetX = mouse.x * 0.3;
      const targetY = mouse.y * 0.3;
      meshRef.current.rotation.y += (targetX - meshRef.current.rotation.y) * 0.05;
      meshRef.current.rotation.x += (targetY - meshRef.current.rotation.x) * 0.05;
    }

    if (lightRef.current) {
      // Pulsing light intensity inside the crystal
      lightRef.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.4;
    }
  });

  return (
    <group>
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.5}>
        <mesh ref={meshRef} geometry={geometry} castShadow>
          {/* MeshPhysicalMaterial cao cấp tạo hiệu ứng xuyên sáng */}
          <meshPhysicalMaterial
            color="#ff9d5c"
            emissive="#ff5e00"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.1}
            transmission={0.7}
            thickness={2.5}
            ior={1.45}
            clearcoat={1}
            clearcoatRoughness={0.1}
            attenuationColor="#ff5e00"
            attenuationDistance={1}
          />
          
          {/* Ánh sáng neon nội tại */}
          <pointLight 
            ref={lightRef} 
            color="#ff4d00" 
            distance={4} 
            decay={2}
          />
        </mesh>
      </Float>

      {/* Ánh sáng điểm tạo độ sâu */}
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffbd8a" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4c1d95" />
    </group>
  );
}

export default function SaltLampCanvas() {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows dpr={[1, 2]} className="bg-transparent">
        <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={45} />
        
        <Suspense fallback={null}>
          <Crystal />
          <Environment preset="night" />
          <ContactShadows 
            position={[0, -1.8, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2.5} 
            far={4} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
