import React, { useState, useEffect, useRef } from "react";

const GoatGame = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [gameState, setGameState] = useState({
    gameRunning: false,
    gameOver: false,
    goat: { x: 50, y: 156, width: 88, height: 94, velocityY: 0 },
    cacti: [],
    score: 0,
    velocityX: -8,
  });

  const goatImg = useRef(new Image());
  const cactusImgs = useRef([new Image(), new Image(), new Image()]);

  useEffect(() => {
    goatImg.current.src = "/img/goat.png";
    cactusImgs.current[0].src = "/img/pipeUp.png";
    cactusImgs.current[1].src = "/img/cack.png";
    cactusImgs.current[2].src = "/img/cactus2.png";

    const handleJump = (e) => {
      if (
        (e.code === "Space" || e.code === "ArrowUp") &&
        gameState.goat.y === 156 &&
        !gameState.gameOver
      ) {
        setGameState((prevState) => ({
          ...prevState,
          goat: { ...prevState.goat, velocityY: -12 },
        }));
      }
    };

    window.addEventListener("keydown", handleJump);
    return () => window.removeEventListener("keydown", handleJump);
  }, [gameState.goat.y, gameState.gameOver]);

  useEffect(() => {
    if (!gameState.gameRunning) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const spawnCactus = () => {
      const now = Date.now();
      const lastCactus = gameState.cacti[gameState.cacti.length - 1];
      if (!lastCactus || now - lastCactus.spawnTime > 2000) {
        const type = Math.floor(Math.random() * 3);
        setGameState((prevState) => ({
          ...prevState,
          cacti: [
            ...prevState.cacti,
            {
              x: canvas.width,
              y: 200,
              width: [30, 70, 100][type],
              height: 70,
              img: cactusImgs.current[type],
              spawnTime: now,
            },
          ],
        }));
      }
    };

    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      let newY = gameState.goat.y + gameState.goat.velocityY;
      let newVelocityY = gameState.goat.velocityY + 0.4;
      if (newY > 156) {
        newY = 156;
        newVelocityY = 0;
      }

      const newCacti = gameState.cacti
        .map((cactus) => ({
          ...cactus,
          x: cactus.x + gameState.velocityX,
        }))
        .filter((cactus) => cactus.x + cactus.width > 0);

      const collisionDetected = newCacti.some(
        (cactus) =>
          gameState.goat.x < cactus.x + cactus.width &&
          gameState.goat.x + gameState.goat.width > cactus.x &&
          newY < cactus.y + cactus.height &&
          newY + gameState.goat.height > cactus.y
      );

      if (collisionDetected) {
        setGameState((prevState) => ({
          ...prevState,
          gameRunning: false,
          gameOver: true,
        }));
        alert("Game Over!");
        return;
      } else {
        setGameState((prevState) => ({
          ...prevState,
          goat: { ...prevState.goat, y: newY, velocityY: newVelocityY },
          cacti: newCacti,
        }));
      }

      context.drawImage(
        goatImg.current,
        gameState.goat.x,
        newY,
        gameState.goat.width,
        gameState.goat.height
      );

      newCacti.forEach((cactus) => {
        context.drawImage(
          cactus.img,
          cactus.x,
          cactus.y,
          cactus.width,
          cactus.height
        );
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    spawnCactus();
    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  const startGame = () => {
    setGameState((prevState) => ({
      ...prevState,
      gameRunning: true,
      gameOver: false,
      goat: { ...prevState.goat, y: 156, velocityY: 0 },
      cacti: [],
      score: 0,
    }));
  };

  return (
    <div className="Game">
      <h1>Goat Game</h1>
      <canvas
        style={{
          backgroundImage: `url(/img/background2.png)`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
        ref={canvasRef} width="750" height="250"></canvas>
      <button onClick={startGame}>Start Game</button>
    </div>
  );
};

export default GoatGame;
