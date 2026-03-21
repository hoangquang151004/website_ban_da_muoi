"use client";

import React, {
  Suspense,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
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

const ProductModelViewer = forwardRef<
  ProductModelViewerRef,
  ProductModelViewerProps
>(({ modelUrl }, ref) => {
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
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl isolate"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#fff8ea_0%,#f5efe6_38%,#ece4d7_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,#2d2924_0%,#1f1c18_42%,#141210_100%)]" />
      <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl dark:bg-orange-400/20" />
      <div className="absolute inset-0 opacity-35 dark:opacity-20 bg-[linear-gradient(to_right,rgba(120,113,108,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,108,0.12)_1px,transparent_1px)] bg-size-[28px_28px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.18)_100%)]" />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 45, position: [2.8, 1.4, 3.1] }}
        className="relative z-10"
      >
        <Suspense
          fallback={
            <mesh>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial color="#ccc" wireframe />
            </mesh>
          }
        >
          <ambientLight intensity={0.45} />
          <directionalLight position={[5, 6, 4]} intensity={1} />
          <Stage environment="sunset" intensity={0.75} adjustCamera={1.2}>
            <Model url={modelUrl} />
          </Stage>
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          makeDefault
          autoRotate
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
});

ProductModelViewer.displayName = "ProductModelViewer";

export default ProductModelViewer;
