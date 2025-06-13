import React, { useState, useRef, useEffect } from 'react';
import '../css/Knob.css';

/**
 * Interactive rotary knob UI component for adjusting values like pitch (in semitones).
 *
 * @param {number} min - Minimum knob value (default: -12)
 * @param {number} max - Maximum knob value (default: 12)
 * @param {function} onChange - Callback function called with updated value
 * @param {number} initialValue - Initial knob value (default: 0)
 */
const Knob = ({ min = -12, max = 12, onChange, initialValue = 0 }) => {
  // Calculate initial angle based on initialValue
  const [angle, setAngle] = useState(() => {
    const percent = (initialValue - min) / (max - min);
    return percent * 270 - 135;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef(null);

  /**
   * Converts knob angle to value within [min, max]
   * @param {number} a - Angle in degrees
   * @returns {number} Corresponding value
   */
  const angleToValue = (a) => {
    const percent = (a + 135) / 270;
    return Math.round(min + (max - min) * percent);
  };

  /**
   * Converts a value to an angle for knob rotation
   * @param {number} val - Target value
   * @returns {number} Angle in degrees
   */
  const valueToAngle = (val) => {
    const percent = (val - min) / (max - min);
    return percent * 270 - 135;
  };

  const currentValue = angleToValue(angle);

  /**
   * Handles knob rotation based on mouse movement
   * Updates angle and triggers value change
   */
  const handleMouseMove = (e) => {
    if (!knobRef.current || !isDragging) return;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    let deg = Math.atan2(y, x) * (180 / Math.PI);
    deg = Math.max(-135, Math.min(135, deg)); // Clamp to valid range

    setAngle(deg);
    const newValue = angleToValue(deg);
    if (onChange) onChange(newValue);
  };

  /** Enables dragging on mouse down */
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /** Disables dragging on mouse up */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach global mousemove/mouseup listeners while dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  /**
   * Handles direct numeric input in edit mode
   */
  const handleInputChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;

    val = Math.max(min, Math.min(max, val)); // Clamp to range
    const newAngle = valueToAngle(val);
    setAngle(newAngle);

    if (onChange) onChange(val);
  };

  /**
   * Handles Enter/Escape keypresses while editing input
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      const currentVal = angleToValue(angle);
      e.target.value = currentVal;
    }
  };

  /**
   * Handles mouse wheel scroll to adjust knob value
   */
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.max(min, Math.min(max, currentValue + delta));
    const newAngle = valueToAngle(newValue);
    setAngle(newAngle);

    if (onChange) onChange(newValue);
  };

  return (
    <div 
      className="knob-container"
      ref={knobRef}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        className="knob-rotator"
        style={{ 
          transform: `rotate(${angle}deg)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease'
        }}
      >
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
