import React, { useEffect, useState } from 'react';

/**
 * Renders a dynamic animated background of blurred bubbles.
 * Bubbles move within a boundary, randomly change speed slightly,
 * and bounce off edges. Each bubble has randomized size, color, opacity, and motion.
 */
const BlurredBubbleBackground = () => {
  const [bubbles, setBubbles] = useState([]);

  /**
   * Initializes the bubble state with random positions, sizes, opacities, and velocities
   * This runs once on component mount.
   */
  useEffect(() => {
    const initBubbles = [];
    const bubbleCount = 40;

    for (let i = 0; i < bubbleCount; i++) {
      initBubbles.push({
        id: i,
        x: Math.random() * 100, 
        y: Math.random() * 100,
        size: Math.random() * 120 + 30, 
        opacity: Math.random() * 0.7 + 0.3, 
        speedX: (Math.random() - 0.5) * 0.5, 
        speedY: (Math.random() - 0.5) * 0.5, 
        color: Math.random() > 0.5 ? '#d0d0d0' : '000', 
      });
    }
    setBubbles(initBubbles);
  }, []);

  /**
   * Continuously updates the position and speed of each bubble in a timed loop.
   * - Bubbles bounce off boundaries
   * - Occasionally adjust speed slightly to simulate random drift
   * This effect runs as long as the component is mounted.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prevBubbles =>
        prevBubbles.map(bubble => {
          let newX = bubble.x + bubble.speedX;
          let newY = bubble.y + bubble.speedY;
          let newSpeedX = bubble.speedX;
          let newSpeedY = bubble.speedY;

          // Bounce off horizontal and vertical boundaries
          if (newX <= -10 || newX >= 110) {
            newSpeedX = -bubble.speedX;
            newX = bubble.x + newSpeedX;
          }
          if (newY <= -10 || newY >= 110) {
            newSpeedY = -bubble.speedY;
            newY = bubble.y + newSpeedY;
          }

          // Occasionally introduce small random velocity adjustments
          if (Math.random() < 0.02) {
            newSpeedX += (Math.random() - 0.5) * 0.1;
            newSpeedY += (Math.random() - 0.5) * 0.1;

            // Clamp speed to a reasonable range
            newSpeedX = Math.max(-0.8, Math.min(0.8, newSpeedX));
            newSpeedY = Math.max(-0.8, Math.min(0.8, newSpeedY));
          }

          return {
            ...bubble,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
          };
        })
      );
    }, 50); // update every 50ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bubble-background">
      <div className="background-overlay"></div>

      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            backgroundColor: bubble.color,
            opacity: bubble.opacity,
          }}
        />
      ))}

      <div className="blur-overlay"></div>
    </div>
  );
};

export default BlurredBubbleBackground;
