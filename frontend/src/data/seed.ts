// 国分町エリア定義(単一の情報源は shared/area.json。店舗・ユーザーはAPIから取得)
import area from '../../../shared/area.json';

export const KOKUBUNCHO_CENTER = { latitude: area.lat, longitude: area.lng };
export const AREA_RADIUS_M = area.radiusM;
