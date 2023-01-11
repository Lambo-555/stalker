import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roads')
export class RoadsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from?: number;

  @Column()
  to?: number;

  @Column()
  is_open?: boolean;

}
