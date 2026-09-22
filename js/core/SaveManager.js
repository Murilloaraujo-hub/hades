const KEY = 'shattered-realms-save';
const CURRENT_VERSION = 1;

const defaultSave = () => ({
  saveVersion: CURRENT_VERSION,
  settings: {
    masterVolume: 0.8,
    musicVolume: 0.65,
    sfxVolume: 0.8,
    particles: true,
    screenShake: 1,
    damageNumbers: true,
    flashes: true,
    highContrast: false,
    textScale: 1,
  },
  progression: {
    soulShards: 0,
    unlockedWeapons: ['sword'],
    selectedWeapon: 'sword',
    permanent: { hp: 0, crit: 0, goldBonus: 0, dashCharges: 0, rarity: 0 },
    bossesDefeated: [],
  },
  dialogueFlags: {},
  statistics: { runs: 0, wins: 0, deaths: 0, enemiesDefeated: 0, bossesDefeated: 0, bestRooms: 0 },
  achievements: [],
});

export class SaveManager {
  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return this.migrate(parsed);
    } catch {
      return defaultSave();
    }
  }

  static migrate(save) {
    const base = defaultSave();
    const merged = {
      ...base,
      ...save,
      settings: { ...base.settings, ...(save.settings || {}) },
      progression: {
        ...base.progression,
        ...(save.progression || {}),
        permanent: { ...base.progression.permanent, ...(save.progression?.permanent || {}) },
      },
      dialogueFlags: { ...base.dialogueFlags, ...(save.dialogueFlags || {}) },
      statistics: { ...base.statistics, ...(save.statistics || {}) },
    };
    merged.saveVersion = CURRENT_VERSION;
    return merged;
  }

  static save(data) {
    localStorage.setItem(KEY, JSON.stringify({ ...data, saveVersion: CURRENT_VERSION }));
  }

  static reset() {
    localStorage.removeItem(KEY);
    return defaultSave();
  }
}
