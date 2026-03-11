"use client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";

interface ModelViewerProps {
  url: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelViewer({ url }: ModelViewerProps) {
  return (
    <div className="w-full h-full relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Model url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
      </Canvas>

      {/* Loading overlay overlay handled naturally by Suspense, but for simplicity we rely on Canvas to show blank while loading */}
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none bg-white/80 px-2 py-1 rounded backdrop-blur">
        Kéo để xoay · Cuộn để thu phóng
      </div>
    </div>
  );
}
