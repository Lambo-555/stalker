// function generateRandomEnemies() {
//   const names = ['Васян', 'Жора', 'Борян', 'Колян', 'Денчик', 'Витян'];
//   const surNames = [
//     'Бобр',
//     'Жесткий',
//     'Цепной',
//     'Шальной',
//     'Зеленый',
//     'Маслинник',
//   ];
//   const enemies: { x: number; y: number; name: string }[] = [];
//   // const playersCount = Math.floor(Math.random() * 5) + 1;
//   const enemiesTargetCount = 2;
//   while (enemies?.length !== enemiesTargetCount) {
//     const x = Math.floor(Math.random() * 200);
//     const y = Math.floor(Math.random() * 200);
//     const nameIndex = Math.floor(Math.random() * names?.length);
//     const name = names[nameIndex];
//     names.splice(nameIndex, 1);
//     const surNameIndex = Math.floor(Math.random() * names?.length);
//     const surName = surNames[surNameIndex];
//     surNames.splice(surNameIndex, 1);
//     const pogonalo = `${name} ${surName}`;
//     enemies.push({ x, y, name: pogonalo });
//   }
//   return enemies;
// }

// const enemiesList = generateRandomEnemies();
// console.log(enemiesList);

// function getEnemiesPositions(enemyList) {
//   let text = '';
//   let enemyPosText = '';
//   const player = { x: 50, y: 50, name: 'Player' };
//   for (let i = 0; i < enemyList.length; i++) {
//     const enemy = enemyList[i];
//     enemyPosText += `${enemy.name} находится ${
//       player.y > enemy.y ? 'позади' : 'спереди'
//     } `;
//     enemyPosText +=
//       player.x > enemy.x ? 'слева' : 'справа' + ', на расстоянии ' + 500;
//     text += enemyPosText + '\n';
//     enemyPosText = '';
//   }
//   console.log(text);
// }

// getEnemiesPositions(enemiesList);
