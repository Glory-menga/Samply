import React, { useState, useRef } from 'react';
import '../css/Knob.css';

const Knob = ({ min = -12, max = 12, onChange }) => {
  const [angle, setAngle] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const knobRef = useRef(null);

  const angleToValue = (a) => {
    const percent = (a + 135) / 270;
    return Math.round(min + (max - min) * percent);
  };

  const valueToAngle = (val) => {
    const percent = (val - min) / (max - min);
    return percent * 270 - 135;
  };

  const currentValue = angleToValue(angle);

  const handleMouseMove = (e) => {
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    let deg = Math.atan2(y, x) * (180 / Math.PI);
    deg = Math.max(-135, Math.min(135, deg));
    setAngle(deg);
    onChange(angleToValue(deg));
  };

  const handleMouseDown = () => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () =>
      document.removeEventListener('mousemove', handleMouseMove)
    );
  };

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    val = Math.max(min, Math.min(max, val));
    setAngle(valueToAngle(val));
    onChange(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div className="knob-container" ref={knobRef} onMouseDown={handleMouseDown}>
      <div className="knob-rotator" style={{ transform: `rotate(${angle}deg)` }}>
        <div className="knob-marker" />
      </div>
      <div className="knob-label" onClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            type="number"
            min={min}
            max={max}
            defaultValue={currentValue}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            className="knob-input"
            autoFocus
          />
        ) : (
          <p>{currentValue} Semitones</p>
        )}
      </div>
    </div>
  );
};

export default Knob;
