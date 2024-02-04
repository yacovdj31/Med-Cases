import React, { useEffect, useState } from 'react';
import '../App.css'

const Home = () => {
    const [birdPosition, setBirdPosition] = useState(200);
    const [gameStarted, setGameStarted] = useState(false);
    const [obstacleLeft, setObstacleLeft] = useState(500);
    const [obstacleHeight, setObstacleHeight] = useState(100);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const air = 2;
    const jump = 30;
    const obstacleWidth = 60;
    const gameSpeed = 30;
    const obstacleGap = 200;

    useEffect(() => {
        let gameTimerId;
        let obstacleTimerId;

        if (gameStarted && !gameOver) {
            gameTimerId = setInterval(() => {
                setBirdPosition((prevPosition) => prevPosition - air);
            }, 20);

            obstacleTimerId = setInterval(() => {
                setObstacleLeft((prevLeft) => prevLeft - 5);
            }, gameSpeed);
        } else {
            clearInterval(gameTimerId);
            clearInterval(obstacleTimerId);
        }

        return () => {
            clearInterval(gameTimerId);
            clearInterval(obstacleTimerId);
        };
    }, [gameStarted, gameOver]);

    useEffect(() => {
        if (birdPosition > 600 || birdPosition < 0) {
            setGameOver(true);
            setGameStarted(false);
        }

        if (
            obstacleLeft > 0 &&
            obstacleLeft < obstacleWidth &&
            (birdPosition < obstacleHeight || birdPosition > obstacleHeight + obstacleGap)
        ) {
            setGameOver(true);
            setGameStarted(false);
        }

        if (!gameOver && obstacleLeft < -obstacleWidth) {
            setObstacleLeft(500);
            setObstacleHeight(Math.floor(Math.random() * 200) + 50);
            setScore((prevScore) => prevScore + 1);
        }
    }, [birdPosition, obstacleLeft, gameOver]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.keyCode === 32 && !gameOver) {
                if (!gameStarted) {
                    setGameStarted(true);
                    setGameOver(false);
                    setScore(0);
                    setObstacleLeft(500);
                    setBirdPosition(200);
                }
                setBirdPosition((prevPosition) => Math.max(prevPosition + jump, 0));
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [gameStarted, gameOver]);

    return (
        <div className="game-container">
            <div className="bird" style={{ bottom: `${birdPosition}px` }}></div>
            <div className="obstacle-upper" style={{ left: `${obstacleLeft}px`, height: `${obstacleHeight}px` }}></div>
            <div className="obstacle-lower" style={{ left: `${obstacleLeft}px`, height: `${obstacleGap}px` }}></div>
            {gameOver && <h1 className="game-over-message">Game Over. Score: {score}</h1>}
        </div>
    );
};

export default Home;