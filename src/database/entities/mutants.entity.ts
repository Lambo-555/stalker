import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mutants')
export class MutantsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 1000 })
  health: number;

  @Column({ default: 45 })
  damage: number;

  @Column({ default: 5 })
  actions: number;
}
