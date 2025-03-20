import { useEffect, useState } from "react";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  speed: number;
  angle: number;
  opacity: number;
}

interface ConfettiProps {
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export function Confetti({ count = 50, duration = 3000, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Tạo các particles khi component được mount
  useEffect(() => {
    // Tạo các particles
    const newParticles: ConfettiParticle[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * width,
        y: height,
        size: Math.random() * 10 + 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        speed: Math.random() * 1 + 2,
        angle: Math.random() * Math.PI - Math.PI / 2,
        opacity: 1
      });
    }

    setParticles(newParticles);

    // Thiết lập timer để ẩn confetti sau khi hiệu ứng kết thúc
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 100);
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [count, duration, onComplete]);

  // Cập nhật vị trí của particles
  useEffect(() => {
    if (!isVisible || particles.length === 0) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          y: particle.y - particle.speed * Math.cos(particle.angle) * 5,
          x: particle.x + particle.speed * Math.sin(particle.angle) * 3,
          rotation: particle.rotation + particle.speed * 2,
          opacity: 1 - progress
        }))
      );

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [particles, duration, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="fixed"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            position: "fixed",
            zIndex: 1000,
            transform: `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg)`,
            opacity: particle.opacity
          }}
        />
      ))}
    </div>
  );
}