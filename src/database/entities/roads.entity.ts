import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roads')
export class RoadsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from?: string;

  @Column()
  to?: string;
}
