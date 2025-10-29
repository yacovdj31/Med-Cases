import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !isJumping) { // Jump with space bar
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 800); // Character jumps for 800ms
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJumping]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Spawn obstacles and increase score
      setObstacles((prevObstacles) => [
        ...prevObstacles,
        { id: Math.random(), position: 100 },
      ].filter(obstacle => obstacle.position > -10)); // Remove off-screen obstacles

      setScore((prevScore) => prevScore + 1);
    }, 2000); // Spawn an obstacle every 2000ms

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const moveObstacles = setInterval(() => {
      setObstacles((prevObstacles) => prevObstacles.map(obstacle => ({
        ...obstacle,
        position: obstacle.position - 5, // Move obstacle left
      })));

      // Check for collisions
      const collision = obstacles.some(obstacle => obstacle.position < 5 && obstacle.position > -5 && isJumping === false);
      if (collision) {
        alert(`Game Over! Your score was: ${score}`);
        window.location.reload(); // Restart game
      }
    }, 50); // Update obstacle position every 50ms

    return () => clearInterval(moveObstacles);
  }, [obstacles, isJumping, score]);

  return (
    <div className="game">
      <div className={`player ${isJumping ? 'jump' : ''}`}></div>
      {obstacles.map((obstacle) => (
        <div key={obstacle.id} className="obstacle" style={{ right: `${obstacle.position}%` }}></div>
      ))}
      <div className="score">Score: {score}</div>
    </div>
  );
}

export default App;
