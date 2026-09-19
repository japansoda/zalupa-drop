const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../src/data/all_cases.json');
const skinsPath = path.join(__dirname, '../src/data/all_skins.json');

const allCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));

// Filter all genuine agent skins from all_skins
const allAgents = allSkins.filter(s => {
  const w = (s.weapon || '').toLowerCase();
  const n = (s.name || '').toLowerCase();
  return (
    w === 'agent' || 
    w === 'оперативник' || 
    n.startsWith('agent |') || 
    n.startsWith('оперативник |') ||
    n.includes('| the professionals') ||
    n.includes('| nswc seal') ||
    n.includes('| swat') ||
    n.includes('| sabre') ||
    n.includes('| elite crew') ||
    n.includes('| guerrilla warfare') ||
    n.includes('| tacp cavalry') ||
    n.includes('| ksk') ||
    n.includes('| gendarmerie') ||
    n.includes('| fbi')
  );
});

// Deduplicate by clean agent name
const seenNames = new Set();
const uniqueAgents = [];

for (const a of allAgents) {
  let cleanName = a.name.replace(/^StatTrak™\s*/i, '').replace(/^Оперативник\s*\|\s*/i, '').replace(/^Agent\s*\|\s*/i, '').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i, '').trim();
  
  if (!seenNames.has(cleanName)) {
    seenNames.add(cleanName);
    uniqueAgents.push({
      ...a,
      id: `agent_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      weapon: 'Оперативник',
      skinName: cleanName,
      name: cleanName,
      wear: undefined,
      statTrak: false,
      priceDc: Math.max(350, Math.round(a.priceDc || 1500)),
    });
  }
}

// Sort agents by price
uniqueAgents.sort((a, b) => a.priceDc - b.priceDc);

console.log(`Found ${uniqueAgents.length} unique agents for the case.`);

// Find or update case_agents_cs2
let agentCase = allCases.find(c => c.id === 'case_agents_cs2');
if (agentCase) {
  agentCase.name = 'Кейс Оперативников';
  agentCase.subtitle = 'Все агенты CS2: Профессионалы, SWAT, SEAL, Партизаны';
  agentCase.skins = uniqueAgents;
  // Fair, balanced price for agent case
  agentCase.priceDc = 1200;
  console.log(`Updated case_agents_cs2 with ${uniqueAgents.length} agents at price ${agentCase.priceDc} DC.`);
} else {
  allCases.push({
    id: 'case_agents_cs2',
    name: 'Кейс Оперативников',
    subtitle: 'Все агенты CS2: Профессионалы, SWAT, SEAL, Партизаны',
    image: '/cases/case_tactical_force.svg',
    priceDc: 1200,
    category: 'custom',
    skins: uniqueAgents,
  });
  console.log('Created case_agents_cs2 with all agents.');
}

fs.writeFileSync(casesPath, JSON.stringify(allCases, null, 2), 'utf8');
console.log('Saved all_cases.json with complete agents case!');
