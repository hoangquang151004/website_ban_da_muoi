"use client";

import React from "react";
import { motion } from "framer-motion";
import SaltLampCanvas from "./SaltLampCanvas";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] },
  },
};

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center bg-black">
      {/* 2. High-Fidelity Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          {/* Thay thế URL bằng link video thực tế về Aurora hoặc Fluid Simulation */}
          <source 
            src="https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-fire-and-smoke-2469-large.mp4" 
            type="video/mp4" 
          />
        </video>
        
        {/* Overlay Mask: Center vibrant, edges darken */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/30 to-black/90" />
        
        {/* Glowing Particles (Bokeh) - Giả lập bằng CSS/Motion */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-orange-500/20 rounded-full blur-xl"
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: "110%",
                scale: Math.random() * 2 + 1 
              }}
              animate={{ 
                y: "-10%",
                opacity: [0, 0.4, 0],
              }}
              transition={{ 
                duration: Math.random() * 10 + 10, 
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* 4. Premium UI & Content (Left side) */}
        <motion.div 
          className="flex-1 text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-5xl lg:text-7xl font-serif font-light leading-tight mb-8"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ffbd8a] via-[#f48c25] to-[#ff5e00] drop-shadow-sm">
              Thức Tỉnh Không Gian
            </span>
            <br />
            <span className="text-white opacity-90 italic">
              Bằng Ánh Sáng Tự Nhiên
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg lg:text-xl text-neutral-300 mb-10 max-w-lg leading-relaxed font-light"
          >
            Khám phá tinh thể đá muối tinh khiết từ dãy Himalaya. 
            Mỗi khối đá là một tác phẩm nghệ thuật của mẹ thiên nhiên, 
            mang lại nguồn năng lượng tích cực và sự bình yên tuyệt đối.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-5">
            {/* Primary Button: Animated gradient border */}
            <button className="group relative p-[2px] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-magenta-500 via-amber-500 to-rose-500 animate-gradient-x" />
              <div className="relative px-8 py-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-2 group-hover:bg-black/20 transition-all">
                <span className="text-white font-medium tracking-wide">MUA NGAY</span>
                <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>

            {/* Secondary Button: Minimalist white outline */}
            <button className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-all active:scale-95">
              XEM CHI TIẾT
            </button>
          </motion.div>
        </motion.div>

        {/* 3. 3D Salt Lamp Object (Right side/Center on mobile) */}
        <div className="flex-1 w-full h-[500px] lg:h-[700px] relative">
          <SaltLampCanvas />
          
          {/* Subtle reflection on the "floor" */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[200px] h-[40px] bg-orange-600/10 blur-[50px] rounded-full" />
        </div>
      </div>
    </section>
  );
}
