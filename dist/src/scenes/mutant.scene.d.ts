import { Scenes } from 'telegraf';
export declare class MutantScene {
    market(ctx: Scenes.SceneContext): Promise<void>;
    mystats(ctx: Scenes.SceneContext): Promise<void>;
    mission(ctx: Scenes.SceneContext): Promise<void>;
    job(ctx: Scenes.SceneContext, next: any): Promise<void>;
    onLeaveCommand(ctx: Scenes.SceneContext): Promise<void>;
    onSceneLeave(ctx: Scenes.SceneContext): Promise<void>;
}
