import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('npcs')
export class NpcEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  group: string;

  @Column()
  skill: number;

  @Column()
  gun: string;
}
