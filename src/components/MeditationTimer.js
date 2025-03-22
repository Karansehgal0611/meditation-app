// components/MeditationTimer.js
import React, { useState, useEffect } from 'react';

const MeditationTimer = ({ isMeditating, onStart, onEnd }) => {
  const [seconds, setSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    if (isMeditating) {
      const interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
      setTimerInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setSeconds(0);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isMeditating]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="meditation-timer">
      <h2>Meditation Timer</h2>
      <div className="timer-display">{formatTime(seconds)}</div>
      {!isMeditating ? (
        <button className="timer-button start" onClick={onStart}>
          Start Meditation
        </button>
      ) : (
        <button className="timer-button end" onClick={onEnd}>
          End Meditation
        </button>
      )}
      <div className="timer-status">
        {isMeditating ? 'Currently meditating...' : 'Ready to meditate?'}
      </div>
    </div>
  );
};

export default MeditationTimer;