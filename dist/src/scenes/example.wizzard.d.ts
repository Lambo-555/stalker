import { Scenes } from 'telegraf';
export declare class TestWizard {
    step1(ctx: Scenes.WizardContext): void;
    hi(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext): Promise<void>;
}
