import mongoose from 'mongoose';
import { vi } from 'vitest';

const { generateWorldMapMock } = vi.hoisted(() => ({
  generateWorldMapMock: vi.fn(),
}));

vi.mock('../../agents/mapAgent', () => ({
  generateWorldMap: generateWorldMapMock,
  addLocation: vi.fn(),
}));

import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Continent } from '../../models/Continent';
import { Region } from '../../models/Region';
import { Location } from '../../models/Location';
import { Playthrough } from '../../models/Playthrough';

async function createUserAgent(username: string, email: string) {
  const agent = await registerAndGetAgent({ username, email });
  const user = await User.findOne({ email }).orFail();
  return { agent, user };
}

async function createMapFixture(userId: mongoose.Types.ObjectId) {
  const world = await World.create({
    name: 'Owner World',
    description: 'A private world',
    genre: 'fantasy',
    userId,
  });

  const continent = await Continent.create({
    worldId: world._id,
    name: 'Owner Continent',
    description: 'A private continent',
    terrainType: 'forest',
    climate: 'temperate',
    dominantCulture: 'guilds',
  });

  const region = await Region.create({
    continentId: continent._id,
    name: 'Owner Region',
    description: 'A private region',
    terrainType: 'woods',
  });

  const playthrough = await Playthrough.create({
    name: 'Owner Playthrough',
    worldId: world._id,
    userId,
  });

  const location = await Location.create({
    regionId: region._id,
    playthroughId: playthrough._id,
    name: 'Owner Location',
    description: 'A private location',
    type: 'town',
    status: 'known',
  });

  playthrough.currentLocationId = location._id as mongoose.Types.ObjectId;
  await playthrough.save();

  return { world, continent, region, playthrough, location };
}

describe('Map routes authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateWorldMapMock.mockResolvedValue({ continents: [] });
  });

  it('does not allow another user to list a world map', async () => {
    const owner = await createUserAgent('mapowner', 'map-owner@test.com');
    const other = await createUserAgent('mapother', 'map-other@test.com');
    const fixture = await createMapFixture(owner.user._id as mongoose.Types.ObjectId);

    const res = await other.agent.get(`/api/map/${fixture.world._id}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('does not allow another user to list playthrough map locations', async () => {
    const owner = await createUserAgent('mapowner2', 'map-owner2@test.com');
    const other = await createUserAgent('mapother2', 'map-other2@test.com');
    const fixture = await createMapFixture(owner.user._id as mongoose.Types.ObjectId);

    const res = await other.agent.get(`/api/map/playthrough/${fixture.playthrough._id}/locations`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('does not allow another user to read current playthrough location', async () => {
    const owner = await createUserAgent('mapowner3', 'map-owner3@test.com');
    const other = await createUserAgent('mapother3', 'map-other3@test.com');
    const fixture = await createMapFixture(owner.user._id as mongoose.Types.ObjectId);

    const res = await other.agent.get(`/api/map/playthrough/${fixture.playthrough._id}/current`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('does not allow another user to generate a world map', async () => {
    const owner = await createUserAgent('mapowner4', 'map-owner4@test.com');
    const other = await createUserAgent('mapother4', 'map-other4@test.com');
    const fixture = await createMapFixture(owner.user._id as mongoose.Types.ObjectId);

    const res = await other.agent
      .post(`/api/map/${fixture.world._id}/generate`)
      .send({ modelProvider: 'writer' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(generateWorldMapMock).not.toHaveBeenCalled();
  });

  it('allows the owner to read current playthrough location', async () => {
    const owner = await createUserAgent('mapowner5', 'map-owner5@test.com');
    const fixture = await createMapFixture(owner.user._id as mongoose.Types.ObjectId);

    const res = await owner.agent.get(`/api/map/playthrough/${fixture.playthrough._id}/current`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.currentLocation.name).toBe('Owner Location');
  });
});
