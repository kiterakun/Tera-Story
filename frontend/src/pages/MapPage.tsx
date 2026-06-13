import { useParams } from 'react-router-dom';
import { WorldMapView } from '../components/map/WorldMapView';
import { PlaythroughMapView } from '../components/map/PlaythroughMapView';

export default function MapPage() {
  const { worldId, playthroughId } = useParams<{ worldId?: string; playthroughId?: string }>();

  if (worldId) return <WorldMapView worldId={worldId} />;
  if (playthroughId) return <PlaythroughMapView playthroughId={playthroughId} />;
  return null;
}
