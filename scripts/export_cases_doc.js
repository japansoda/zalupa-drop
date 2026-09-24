const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '..', 'src', 'data', 'all_cases.json');
const outputPath = path.join(__dirname, '..', 'CASES.md');

const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

const categoryTitles = {
  official: 'Официальные кейсы CS2 / CS:GO (Official)',
  knives: 'Ножевые кейсы (Knives)',
  weapons: 'Оружейные кейсы (Weapons)',
  highroller: 'Хайроллер кейсы (Highroller)',
  budget: 'Бюджетные кейсы (Budget)',
  custom: 'Авторские кейсы (Custom)',
  stickers: 'Капсулы и наклейки (Stickers & Capsules)'
};

const categoryOrder = ['official', 'knives', 'weapons', 'highroller', 'budget', 'custom', 'stickers'];

let md = '# База кейсов Zalupa Drop (Названия, описания и полное содержимое)\n\n';
md += '> Данный файл содержит полный список всех кейсов сайта, их ID, цены, описания и перечень скинов внутри каждого кейса.\n';
md += '> Вы можете отредактировать состав любого кейса, добавить или заменить скины, и отправить новую версию.\n\n';

md += '## 📑 Содержание по категориям:\n\n';
for (const cat of categoryOrder) {
  const count = cases.filter((c) => c.category === cat).length;
  md += `- [${categoryTitles[cat] || cat} (${count} кейсов)](#${cat})\n`;
}
md += '\n---\n\n';

for (const cat of categoryOrder) {
  const catCases = cases.filter((c) => c.category === cat);
  if (catCases.length === 0) continue;

  md += `## <a id="${cat}"></a>${categoryTitles[cat] || cat}\n\n`;

  for (const c of catCases) {
    const titleEn = c.nameEn && c.nameEn !== c.name ? ` (${c.nameEn})` : '';
    md += `### ${c.name}${titleEn}\n\n`;
    md += `- **ID кейса:** \`${c.id}\`\n`;
    md += `- **Категория:** \`${c.category}\`\n`;
    md += `- **Цена открытия:** **${(c.priceDc || 0).toLocaleString('ru-RU')} DC**\n`;
    if (c.subtitle || c.subtitleEn) {
      md += `- **Описание:** ${c.subtitle || c.subtitleEn || ''}\n`;
    }
    const skins = c.skins || [];
    md += `- **Количество предметов в кейсе:** ${skins.length} шт.\n\n`;

    if (skins.length > 0) {
      md += '| # | Оружие | Название скина | Редкость | Качество | StatTrak | Цена (DC) |\n';
      md += '|---|---|---|---|---|---|---|\n';
      skins.forEach((s, idx) => {
        const weapon = s.weapon || '-';
        const skinName = s.skinName || s.name || '-';
        const rarity = s.rarity || '-';
        const wear = s.wear || '-';
        const st = s.statTrak ? 'StatTrak™' : '-';
        const price = `${(s.priceDc || 0).toLocaleString('ru-RU')} DC`;
        md += `| ${idx + 1} | ${weapon} | ${skinName} | ${rarity} | ${wear} | ${st} | ${price} |\n`;
      });
      md += '\n';
    } else {
      md += '_В этом кейсе пока нет предметов._\n\n';
    }
    md += '---\n\n';
  }
}

fs.writeFileSync(outputPath, md, 'utf8');
console.log('CASES.md written successfully! File size:', (fs.statSync(outputPath).size / 1024).toFixed(1), 'KB');
