import { CaseItem, Skin, RARITY_MAP } from "../types";
import { SKINS_DATABASE } from "./skins";

function findSkins(ids: string[]): Skin[] {
  return ids
    .map((id) => SKINS_DATABASE.find((s) => s.id === id))
    .filter((s): s is Skin => Boolean(s));
}

export const CASES_DATABASE: CaseItem[] = [
  {
    id: "zalupa-budget-case",
    name: "Кейс для бомжей",
    priceDC: 50,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFQ0namMI2kTuY_ilomOhfnxAoTdn2xZ_Isp2L6TrYqhiwXm_kM-ZTv3IdOUegdvNA6G-1fryLq9hpC4v8vMznQ37CA84X-MzRG1hEpMcKUx0lQZ4b4m/360fx360f",
    description: "Любимый народный кейс. Шанс выбить Dragon Lore всего за 50 DC!",
    category: "cheap",
    badge: "🔥 ТОП ВЫБОР",
    skins: findSkins([
      "awp-dragon-lore",
      "ak47-vulcan",
      "ak47-elite-build",
      "glock-bunsen-burner",
      "p250-sand-dune",
      "negev-army-sheen",
      "nova-polar-mesh",
      "p90-sand-spray",
    ]),
  },
  {
    id: "revolution-case",
    name: "Кейс Революция",
    priceDC: 450,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFQ0namMI2wRvo_iw4bdxvj4ZL7TwmVU7cZwj-iVpNmh2ACxqUpkYm_zLNLDJwA4NQ7T_VK7k7_tgJO67cvAyyFrviN2-z-DyP3p9fJ4/360fx360f",
    description: "Темаку, Двустволка и перчатки Vice. Яркий неоновый стиль.",
    category: "popular",
    badge: "⚡ ХИТ",
    skins: findSkins([
      "gloves-sport-vice",
      "m4a4-temukau",
      "awp-duality",
      "m4a1s-nitro",
      "usps-lead-conduit",
      "glock-bunsen-burner",
    ]),
  },
  {
    id: "knives-gloves-case",
    name: "Кейс Ножей и Перчаток",
    priceDC: 4500,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFU1nfbOIWx8_9mwh7-Emvf4OrzZglRd4cJ5nqfFpIn2i1Xj_0RtMG_wLI6dJwVvY1nRqFe6l-zug57uuM-fmHQ17iNw7X7byxC-hUtIOLM-g-GACQLJ4o8-xU0/360fx360f",
    description: "Эксклюзивная подборка: Керамбит Градиент, Бабочка Допплер, M9 и Перчатки.",
    category: "knives",
    badge: "👑 ЭЛИТА",
    skins: findSkins([
      "knife-butterfly-doppler",
      "knife-karambit-fade",
      "knife-m9-crimson",
      "gloves-sport-vice",
      "knife-kukri-case",
      "ak47-gold-arabesque",
    ]),
  },
  {
    id: "dreams-nightmares-case",
    name: "Грезы и Кошмары",
    priceDC: 350,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFU3nfbOO2wVu9nhk4XemPjmNrrTk21S7ctkmOiYp9Smigbm_Us6YjilctSccQ42N1HY_VS4k7zvgp-77pqbyyc37nVy5HqInhTmh01Fbfsv26I43YnJ1Q/360fx360f",
    description: "Мистические скины с невероятной детализацией и ножами.",
    category: "popular",
    skins: findSkins([
      "knife-butterfly-doppler",
      "ak47-neon-rider",
      "usps-cortex",
      "m4a4-tooth-fairy",
      "deagle-oxide-blaze",
      "usps-lead-conduit",
    ]),
  },
  {
    id: "kilowatt-case",
    name: "Кейс Киловатт",
    priceDC: 550,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFY3nfbOO2wVu9nhk4XemPjmNrrTk21S7ctkmOiYp9Smigbm_Us6YjilctSccQ42N1HY_VS4k7zvgp-77pqbyyc37nVy5HqInhTmh01Fbfsv26I43YnJ1Q/360fx360f",
    description: "Первый кейс эпохи CS2! Кукри нож, AK-47 Наследие и AWP Хром.",
    category: "exclusive",
    badge: "⚡ CS2 NEW",
    skins: findSkins([
      "knife-kukri-case",
      "ak47-inheritance",
      "awp-chrome-cannon",
      "glock-water-elemental",
      "deagle-oxide-blaze",
    ]),
  },
  {
    id: "covert-or-bust-case",
    name: "Тайное или Ничего",
    priceDC: 2500,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFQ0namMI2kTuY_ilomOhfnxAoTdn2xZ_Isp2L6TrYqhiwXm_kM-ZTv3IdOUegdvNA6G-1fryLq9hpC4v8vMznQ37CA84X-MzRG1hEpMcKUx0lQZ4b4m/360fx360f",
    description: "Бескомпромиссный риск: либо топовые Covert скины, либо ничего!",
    category: "exclusive",
    badge: "💀 РИСК",
    skins: findSkins([
      "awp-dragon-lore",
      "m4a4-howl",
      "ak47-gold-arabesque",
      "deagle-blaze",
      "m4a1s-printstream",
      "awp-asiimov",
      "usps-kill-confirmed",
    ]),
  },
  {
    id: "awp-legends-case",
    name: "Легенды AWP",
    priceDC: 1500,
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFU1nfbOIWx8_9mwh7-Emvf4OrzZglRd4cJ5nqfFpIn2i1Xj_0RtMG_wLI6dJwVvY1nRqFe6l-zug57uuM-fmHQ17iNw7X7byxC-hUtIOLM-g-GACQLJ4o8-xU0/360fx360f",
    description: "Всё для истинных снайперов: от Двустволки до Азимова и Драгон Лора.",
    category: "popular",
    skins: findSkins([
      "awp-dragon-lore",
      "awp-asiimov",
      "awp-chrome-cannon",
      "awp-hyper-beast",
      "awp-duality",
    ]),
  },
];

export function getCaseById(id: string): CaseItem | undefined {
  return CASES_DATABASE.find((c) => c.id === id);
}

// Weighted drop algorithm based on CS2 rarity tiers
export function rollSkinFromCase(caseItem: CaseItem): Skin {
  const skins = caseItem.skins;
  if (!skins || skins.length === 0) {
    return SKINS_DATABASE[0];
  }

  // Weight calculation based on rarity
  const weights = skins.map((s) => RARITY_MAP[s.rarity]?.dropChance || 10);
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  const randomVal = Math.random() * totalWeight;
  let running = 0;

  for (let i = 0; i < skins.length; i++) {
    running += weights[i];
    if (randomVal <= running) {
      return skins[i];
    }
  }

  return skins[skins.length - 1];
}
