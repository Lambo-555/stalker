import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('quests')
export class QuestsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name?: string;

  @Column()
  description?: string;
}
