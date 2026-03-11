"use client";

import React, { Suspense, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface ProductModelViewerRef {
  zoomIn: () => void;
  zoomOut: () => void;
  toggleFullscreen: () => void;
}

interface ProductModelViewerProps {
  modelUrl: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

const ProductModelViewer = forwardRef<ProductModelViewerRef, ProductModelViewerProps>(
  ({ modelUrl }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<OrbitControlsImpl>(null);

    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (controlsRef.current) {
          controlsRef.current.target.y -= 0.1;
          const currentZoom = controlsRef.current.object.position;
          currentZoom.multiplyScalar(0.8);
          controlsRef.current.update();
        }
      },
      zoomOut: () => {
        if (controlsRef.current) {
          const currentZoom = controlsRef.current.object.position;
          currentZoom.multiplyScalar(1.2);
          controlsRef.current.update();
        }
      },
      toggleFullscreen: () => {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch((err) => {
            console.error(`Lỗi khi mở toàn màn hình: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      },
    }));

    return (
      <div ref={containerRef} className="w-full h-full bg-stone-50 dark:bg-stone-900 absolute inset-0">
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 45 }}>
          <Suspense
            fallback={
              <mesh>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#ccc" wireframe />
              </mesh>
            }
          >
            <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
              <Model url={modelUrl} />
            </Stage>
          </Suspense>
          <OrbitControls ref={controlsRef} makeDefault autoRotate autoRotateSpeed={2} />
        </Canvas>
      </div>
    );
  }
);

ProductModelViewer.displayName = "ProductModelViewer";

export default ProductModelViewer;
