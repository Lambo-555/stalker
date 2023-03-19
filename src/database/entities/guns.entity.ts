import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('guns')
export class GunsEntity {
  @PrimaryGeneratedColumn()
  name: string;

  @Column()
  optimal_distance: number;

  @Column()
  base_damage: number;

  @Column()
  optimal_modifier: number;
}
