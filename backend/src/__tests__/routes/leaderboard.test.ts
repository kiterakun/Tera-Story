import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { registerAndGetAgent } from "../helpers";
import { User } from "../../models/User";
import { Friendship } from "../../models/Friendship";

const leaderboardPath = "/api/leaderboard";

describe("Leaderboard routes", () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let friendId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await Friendship.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: "leader-user",
      email: "leader-user@test.com",
      password: "password123",
    });
    await registerAndGetAgent({
      username: "leader-friend",
      email: "leader-friend@test.com",
      password: "password123",
    });
    await registerAndGetAgent({
      username: "leader-public",
      email: "leader-public@test.com",
      password: "password123",
    });

    const user = await User.findOne({ email: "leader-user@test.com" }).orFail();
    const friend = await User.findOne({
      email: "leader-friend@test.com",
    }).orFail();
    const publicUser = await User.findOne({
      email: "leader-public@test.com",
    }).orFail();
    userId = String(user._id);
    friendId = String(friend._id);

    await User.findByIdAndUpdate(user._id, {
      level: 5,
      totalScenesCompleted: 12,
      "privacySettings.showOnLeaderboard": true,
    });
    await User.findByIdAndUpdate(friend._id, {
      level: 3,
      totalScenesCompleted: 8,
      "privacySettings.showOnLeaderboard": false,
    });
    await User.findByIdAndUpdate(publicUser._id, {
      level: 7,
      totalScenesCompleted: 20,
      "privacySettings.showOnLeaderboard": true,
    });
    await Friendship.create({
      userId,
      friendId,
      status: "accepted",
      acceptedAt: new Date(),
    });
  });

  it("returns global leaderboard by path type with level field", async () => {
    const res = await agent
      .get(`${leaderboardPath}/scenes?scope=global&period=alltime`)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.entries.length).toBeGreaterThan(0);
    expect(res.body.data.entries[0].level).toBeTypeOf("number");
    expect(
      res.body.data.entries.some(
        (entry: { userId: string }) => entry.userId === friendId,
      ),
    ).toBe(false);
  });

  it("supports compatibility query type and frontend period aliases", async () => {
    const res = await agent
      .get(`${leaderboardPath}?type=scenes&scope=friends&period=all_time`)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(
      res.body.data.entries.map((entry: { userId: string }) => entry.userId),
    ).toEqual(expect.arrayContaining([userId, friendId]));
  });

  it("rejects invalid leaderboard type", async () => {
    const res = await agent.get(`${leaderboardPath}/invalid`).expect(400);
    expect(res.body.status).toBe("error");
  });
});
