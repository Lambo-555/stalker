import { Context, Hears, Wizard, WizardStep } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

@Wizard('registration')
export class TestWizard {
  @WizardStep(1)
  step1(@Context() ctx: Scenes.WizardContext) {
    ctx.reply('Укажите адрес вашего кошелька');
    ctx.wizard.next();
    ctx.wizard.selectStep(2);
  }

  // @Hears(/hi.*/gim)
  // async hi(@Context() ctx: Scenes.WizardContext) {
  // ctx.reply('hello');
  // ctx.reply('moto');
  // }

  @WizardStep(2)
  async step2(@Context() ctx: Scenes.WizardContext) {
    ctx.reply('last scene');
    ctx.scene.leave();
  }

  @WizardStep(3)
  async step3(@Context() ctx: Scenes.WizardContext) {
    ctx.reply('last scene');
    ctx.scene.leave();
  }
}

// @Wizard('test')
// export class TestWizard {
//   @WizardStep(1)
//   step1(@Context() ctx: Scenes.WizardContext) {
//     ctx.reply('first scene')
//     ctx.wizard.next()
//   }

//   @WizardStep(2)
//   async step2(@Context() ctx: Scenes.WizardContext) {
//     ctx.reply('last scene')
//     ctx.scene.leave()
//   }
// }
