import React, { useEffect, useState } from 'react';

const BlurredBubbleBackground = () => {
  const [bubbles, setBubbles] = useState([]);

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
        color: Math.random() > 0.5 ? '#d0d0d0' : 'black',
      });
    }
    setBubbles(initBubbles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prevBubbles =>
        prevBubbles.map(bubble => {
          let newX = bubble.x + bubble.speedX;
          let newY = bubble.y + bubble.speedY;
          let newSpeedX = bubble.speedX;
          let newSpeedY = bubble.speedY;

          if (newX <= -10 || newX >= 110) {
            newSpeedX = -bubble.speedX;
            newX = bubble.x + newSpeedX;
          }
          if (newY <= -10 || newY >= 110) {
            newSpeedY = -bubble.speedY;
            newY = bubble.y + newSpeedY;
          }

          if (Math.random() < 0.02) {
            newSpeedX += (Math.random() - 0.5) * 0.1;
            newSpeedY += (Math.random() - 0.5) * 0.1;
            
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
    }, 50);

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