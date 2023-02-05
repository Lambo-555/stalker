async function onSceneEnter() {
    var _a;
    let enemies = generateRandomEnemies();
    let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
        .map((item) => item.name)
        .join(', ')}.\n`;
    let battle = null;
    let damageToPlayer = 0;
    while (enemies.length !== 0) {
        battle = buttlePart(enemies, damageToPlayer);
        if (!(battle === null || battle === void 0 ? void 0 : battle.isAlive)) {
            log += battle.logs;
            return log;
        }
        if (((_a = battle === null || battle === void 0 ? void 0 : battle.enemyList) === null || _a === void 0 ? void 0 : _a.length) >= 1) {
            damageToPlayer = battle.damageToPlayer;
            enemies = battle === null || battle === void 0 ? void 0 : battle.enemyList;
        }
        log += battle.logs;
    }
    return log;
}
function generateRandomEnemies() {
    const names = [
        'Васян',
        'Жора',
        'Борян',
        'Колян',
        'Стасик',
        'Петрос',
        'Роберт',
        'Андрюха',
        'Асти',
        'Максон',
        'Максан',
        'Денчик',
        'Витян',
    ];
    const surNames = [
        'Бобр',
        'Жесткий',
        'Кривой',
        'Зануда',
        'Мозила',
        'Пес',
        'Гангстер',
        'Черный',
        'Дикий',
        'Цепной',
        'Шальной',
        'Зеленый',
        'Маслинник',
    ];
    const enemies = [];
    const enemiesTargetCount = Math.floor(Math.random() * 2) + 2;
    while ((enemies === null || enemies === void 0 ? void 0 : enemies.length) !== enemiesTargetCount) {
        const x = Math.floor(Math.random() * 200);
        const y = Math.floor(Math.random() * 200);
        const nameIndex = Math.floor(Math.random() * (names === null || names === void 0 ? void 0 : names.length));
        const name = names[nameIndex];
        names.splice(nameIndex, 1);
        const surNameIndex = Math.floor(Math.random() * (names === null || names === void 0 ? void 0 : names.length));
        const surName = surNames[surNameIndex];
        surNames.splice(surNameIndex, 1);
        const pogonalo = `${name} ${surName}`;
        enemies.push({ x, y, name: pogonalo });
    }
    return enemies;
}
function calculateDistance(posOne, posTwo) {
    const deltaX = posTwo.x - posOne.x;
    const deltaY = posTwo.y - posOne.y;
    return Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY)) + 1;
}
function calculateSpread(shotsPrev, distance) {
    if (distance > 2000)
        return 100;
    const spread = Math.floor(shotsPrev * distance ** 0.6);
    if (spread >= 100)
        return 100;
    return spread;
}
function calculateDamage(distance, damage) {
    const calcDamage = damage - (distance / 50) ** 2 + Math.random() * 5 - 5;
    if (calcDamage <= 0)
        return 0;
    return Math.floor(calcDamage);
}
function buttlePart(enemyList, damageToPlayer) {
    let isAlive = true;
    const phrasesShot = [
        'Ай, мля',
        'Маслину поймал',
        'Епта',
        'Меня подбили, пацаны',
        'Погано то как',
        'Зацепило, пацаны',
    ];
    const phrasesMiss = [
        'Мозила',
        'Косой',
        'Баклан, ты мимо',
        'Ай, фаратнуло',
        'В молоко',
    ];
    let logs = '';
    enemyList.forEach((enemyPos, index) => {
        const damageToPlayerRandom = Math.floor(25 + Math.random() * 25);
        damageToPlayer += damageToPlayerRandom;
        logs += `\nВам снесли ${damageToPlayerRandom}🫀, осталось ${Math.max(100 - damageToPlayer, 0)}🫀,
сейчас стрелял ${enemyPos.name}\n`;
        if (damageToPlayer >= 120) {
            logs += 'Вы убиты.\n';
            enemyList.splice(0, enemyList.length);
            isAlive = false;
        }
        else {
            const playerPos = { x: 0, y: 0 };
            const distance = calculateDistance(enemyPos, playerPos);
            const shoots = Math.floor(Math.random() * 3) + 1;
            const shootWord = shoots === 1 ? 'выстрелу' : shoots === 5 ? 'выстрелов' : 'выстрела';
            logs += `Вы стреляете очередью по ${shoots}🔥 ${shootWord} в ответ.\n`;
            logs += 'Расстояние: ' + distance;
            let totalDamage = 0;
            for (let shootIndex = 1; shootIndex <= shoots; shootIndex++) {
                if (totalDamage >= 100) {
                    logs += '\nВраг ' + enemyPos.name + ' убит.';
                    enemyList.splice(index, 1);
                    break;
                }
                logs += '\nВыстрел' + shootIndex + ': ';
                const spread = calculateSpread(shootIndex, distance);
                const damage = calculateDamage(distance, 120);
                const chanceToShoot = 100 - spread;
                const shootIsOk = 100 * Math.random() <= chanceToShoot;
                if (shootIsOk)
                    totalDamage += damage;
                logs += 'Разброс: ' + spread + '%.  ';
                logs += 'Урон: ' + damage + '🫀. ';
                const phrasesIndex = Math.floor(Math.random() * phrasesShot.length);
                const phraseShot = phrasesShot[phrasesIndex];
                const phrasesMissIndex = Math.floor(Math.random() * phrasesMiss.length);
                const phraseMiss = phrasesMiss[phrasesMissIndex];
                logs += shootIsOk
                    ? 'Пападание. ' + phraseShot
                    : 'Промах. ' + phraseMiss;
            }
            logs += '\nИтоговый урон: ' + totalDamage + '🫀\n\n';
            totalDamage = 0;
        }
    });
    return { logs, enemyList, damageToPlayer, isAlive };
}
console.log(onSceneEnter());
//# sourceMappingURL=Untitled-2.js.map