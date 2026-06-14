import type { Translations } from '../en';
import ui from './ui';
import auth from './auth';
import world from './world';
import playthrough from './playthrough';
import story from './story';
import character from './character';
import settings from './settings';
import gameplay from './gameplay';
import progression from './progression';
import social from './social';
import map from './map';
import daily from './daily';
import landing from './landing';

const vi: Translations = {
  ...ui,
  ...auth,
  ...world,
  ...playthrough,
  ...story,
  ...character,
  ...settings,
  ...gameplay,
  ...progression,
  ...social,
  ...map,
  ...daily,
  ...landing,
};

export default vi;
