declare function onSceneEnter(): Promise<string>;
declare function generateRandomEnemies(): {
    x: number;
    y: number;
    name: string;
}[];
declare function calculateDistance(posOne: {
    x: number;
    y: number;
}, posTwo: {
    x: number;
    y: number;
}): number;
declare function calculateSpread(shotsPrev: any, distance: any): number;
declare function calculateDamage(distance: number, damage: number): number;
declare function buttlePart(enemyList?: any, damageToPlayer?: any): {
    logs: string;
    enemyList: any;
    damageToPlayer: any;
    isAlive: boolean;
};
