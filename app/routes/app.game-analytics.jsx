"use client";

import { useState } from "react";
import {
  Page,
  Card,
  DataTable,
  Filters,
  Badge,
  Text,
  BlockStack,
  InlineStack,
  EmptyState,
} from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import connectDB from "../../utils/db.server";
import { GameDataModel } from "../../models/GameData.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    await connectDB();
    const gameData = await GameDataModel.find({ shop })
      .populate("campaignId", "name")
      .sort({ playedAt: -1 })
      .limit(100);

    const stats = {
      totalGames: gameData.length,
      completedGames: gameData.filter((game) => game.completed).length,
      averageScore:
        gameData.length > 0
          ? Math.round(
              gameData.reduce((sum, game) => sum + game.score, 0) /
                gameData.length,
            )
          : 0,
      uniquePlayers: new Set(gameData.map((game) => game.playerEmail)).size,
    };

    return json({
      gameData: gameData.map((game) => ({
        ...game.toObject(),
        _id: game._id.toString(),
        campaignId: game.campaignId ? game.campaignId._id.toString() : null,
        campaignName: game.campaignId ? game.campaignId.name : "Unknown",
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching game analytics:", error);
    return json({
      gameData: [],
      stats: {},
      error: "Failed to fetch game analytics",
    });
  }
};

export default function GameAnalytics() {
  const { gameData, stats } = useLoaderData();
  const [queryValue, setQueryValue] = useState("");

  const filteredData = gameData.filter(
    (game) =>
      game.playerEmail.toLowerCase().includes(queryValue.toLowerCase()) ||
      game.campaignName.toLowerCase().includes(queryValue.toLowerCase()),
  );

  const getCompletionBadge = (completed) => (
    <Badge tone={completed ? "success" : "critical"}>
      {completed ? "Completed" : "Incomplete"}
    </Badge>
  );

  const getScoreBadge = (score) => {
    if (score >= 90) return <Badge tone="success">{score}%</Badge>;
    if (score >= 75) return <Badge tone="info">{score}%</Badge>;
    if (score >= 50) return <Badge tone="warning">{score}%</Badge>;
    return <Badge tone="critical">{score}%</Badge>;
  };

  const rows = filteredData.map((game) => [
    game.playerEmail,
    game.campaignName,
    getScoreBadge(game.score),
    `${game.timeUsed}s / ${game.totalTime}s`,
    `${game.puzzlePieces} pieces`,
    getCompletionBadge(game.completed),
    game.discountCode || "None",
    new Date(game.playedAt).toLocaleDateString(),
  ]);

  return (
    <Page title="Game Analytics">
      <BlockStack gap="400">
        {/* Stats Cards */}
        <InlineStack gap="400">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Total Games</Text>
              <Text variant="heading2xl">{stats.totalGames}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Completed Games</Text>
              <Text variant="heading2xl">{stats.completedGames}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Average Score</Text>
              <Text variant="heading2xl">{stats.averageScore}%</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Unique Players</Text>
              <Text variant="heading2xl">{stats.uniquePlayers}</Text>
            </BlockStack>
          </Card>
        </InlineStack>

        {/* Game Data Table */}
        <Card>
          <BlockStack gap="400">
            <Filters
              queryValue={queryValue}
              onQueryChange={setQueryValue}
              onQueryClear={() => setQueryValue("")}
              filters={[]}
            />

            {filteredData.length > 0 ? (
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                ]}
                headings={[
                  "Player Email",
                  "Campaign",
                  "Score",
                  "Time",
                  "Pieces",
                  "Status",
                  "Discount",
                  "Date",
                ]}
                rows={rows}
              />
            ) : (
              <EmptyState
                heading="No game data found"
                image="/placeholder.png?height=200&width=200"
              >
                <p>
                  Game analytics will appear here once players start playing
                  puzzles.
                </p>
              </EmptyState>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
