"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  BlockStack,
  Button,
  Badge,
  InlineStack,
} from "@shopify/polaris";

export default function PuzzlePreview({
  imageUrl,
  pieces,
  timer = 30,
  onPuzzleComplete,
  showControls = true,
}) {
  const [puzzlePieces, setPuzzlePieces] = useState([]);
  const [solvedPieces, setSolvedPieces] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (imageUrl && pieces) {
      // Pre-load the image to ensure it's available
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        setImageError(false);
        generatePuzzlePieces();
      };
      img.onerror = () => {
        setImageLoaded(false);
        setImageError(true);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, pieces]);

  useEffect(() => {
    setTimeLeft(timer);
  }, [timer]);

  useEffect(() => {
    let timerInterval;
    if (gameStarted && timeLeft > 0 && !gameCompleted) {
      timerInterval = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setGameStarted(false);
    }
    return () => clearTimeout(timerInterval);
  }, [gameStarted, timeLeft, gameCompleted]);

  const generatePuzzlePieces = () => {
    const piecesArray = [];
    const rows = pieces === 4 ? 2 : 2;
    const cols = pieces === 4 ? 2 : 4;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        piecesArray.push({
          id: i * cols + j,
          row: i,
          col: j,
          placed: false,
          correctPosition: i * cols + j,
        });
      }
    }

    // Shuffle pieces
    const shuffled = [...piecesArray].sort(() => Math.random() - 0.5);
    setPuzzlePieces(shuffled);
    setSolvedPieces(new Array(pieces).fill(null));
  };

  const handlePieceClick = (piece) => {
    if (!gameStarted || gameCompleted || !showControls) return;

    const newSolvedPieces = [...solvedPieces];
    const emptyIndex = newSolvedPieces.findIndex((p) => p === null);

    if (emptyIndex !== -1) {
      newSolvedPieces[emptyIndex] = piece;
      setSolvedPieces(newSolvedPieces);

      const newPuzzlePieces = puzzlePieces.filter((p) => p.id !== piece.id);
      setPuzzlePieces(newPuzzlePieces);

      // Check if puzzle is complete
      if (newPuzzlePieces.length === 0) {
        setGameCompleted(true);
        setGameStarted(false);
        if (onPuzzleComplete) {
          onPuzzleComplete(true);
        }
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameCompleted(false);
    setTimeLeft(timer);
    generatePuzzlePieces();
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameCompleted(false);
    setTimeLeft(timer);
    generatePuzzlePieces();
  };

  const rows = pieces === 4 ? 2 : 2;
  const cols = pieces === 4 ? 2 : 4;

  if (imageError) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd">Puzzle Preview</Text>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Text variant="bodyMd" tone="critical">
              Error loading image. Please try again with a different image.
            </Text>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="300" align="space-between">
          <Text variant="headingMd">Puzzle Preview</Text>
          <Badge
            tone={
              gameStarted ? "attention" : gameCompleted ? "success" : "subdued"
            }
          >
            {gameCompleted
              ? "Completed!"
              : gameStarted
                ? `${timeLeft}s`
                : showControls
                  ? "Ready"
                  : "Preview"}
          </Badge>
        </InlineStack>

        {/* Original Image */}
        <div style={{ textAlign: "center" }}>
          <Text variant="bodyMd" tone="subdued">
            Original Image:
          </Text>
          <div style={{ margin: "10px 0" }}>
            <img
              src={imageUrl || "/placeholder.png?height=150&width=150"}
              alt="Original puzzle"
              style={{
                maxWidth: "150px",
                maxHeight: "150px",
                border: "2px solid #e1e3e5",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        {/* Puzzle Grid */}
        <div style={{ textAlign: "center" }}>
          <Text variant="bodyMd" tone="subdued">
            Puzzle Grid ({pieces} pieces):
          </Text>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: "2px",
              maxWidth: "150px",
              margin: "10px auto",
              border: "2px solid #e1e3e5",
              borderRadius: "8px",
              padding: "5px",
            }}
          >
            {solvedPieces.map((piece, index) => (
              <div
                key={index}
                style={{
                  width: "35px",
                  height: "35px",
                  border: "1px dashed #ccc",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: piece ? "#f6f6f7" : "#fff",
                  backgroundImage: piece ? `url(${imageUrl})` : "none",
                  backgroundSize: `${cols * 35}px ${rows * 35}px`,
                  backgroundPosition: piece
                    ? `-${(piece.correctPosition % cols) * 35}px -${Math.floor(piece.correctPosition / cols) * 35}px`
                    : "center",
                }}
              >
                {!piece && (
                  <Text variant="bodySm" tone="subdued">
                    {index + 1}
                  </Text>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Available Pieces */}
        {puzzlePieces.length > 0 && showControls && (
          <div style={{ textAlign: "center" }}>
            <Text variant="bodyMd" tone="subdued">
              Available Pieces:
            </Text>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "5px",
                justifyContent: "center",
                margin: "10px 0",
              }}
            >
              {puzzlePieces.map((piece) => (
                <div
                  key={piece.id}
                  onClick={() => handlePieceClick(piece)}
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "2px solid #007ace",
                    borderRadius: "4px",
                    cursor: gameStarted ? "pointer" : "default",
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: `${cols * 30}px ${rows * 30}px`,
                    backgroundPosition: `-${(piece.correctPosition % cols) * 30}px -${Math.floor(piece.correctPosition / cols) * 30}px`,
                    opacity: gameStarted ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Game Controls */}
        {showControls && (
          <InlineStack gap="200" align="center">
            {!gameStarted && !gameCompleted && (
              <Button variant="primary" onClick={startGame}>
                Start Puzzle
              </Button>
            )}
            {(gameStarted || gameCompleted) && (
              <Button onClick={resetGame}>Reset Puzzle</Button>
            )}
          </InlineStack>
        )}

        {gameCompleted && showControls && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Text variant="headingMd" tone="success">
              🎉 Puzzle Completed! 🎉
            </Text>
          </div>
        )}

        {!showControls && (
          <div style={{ textAlign: "center", padding: "10px" }}>
            <Text variant="bodySm" tone="subdued">
              This is how your puzzle will appear to customers
            </Text>
          </div>
        )}
      </BlockStack>
    </Card>
  );
}
