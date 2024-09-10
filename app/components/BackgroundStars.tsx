// components/BackgroundStars.tsx
import React, { useMemo } from "react";

const BackgroundStars: React.FC = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 2}s`, // Between 2-5 seconds
      size: `${Math.random() * 2 + 1}px`, // Between 1-3px
    }));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        .star {
          position: absolute;
          background-color: white;
          border-radius: 50%;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            width: star.size,
            height: star.size,
            animationDuration: star.animationDuration,
            opacity: Math.random() * 0.7 + 0.3, // Random opacity between 0.3 and 1
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundStars;
