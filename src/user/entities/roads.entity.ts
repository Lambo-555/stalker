import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roads')
export class Roads {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from?: number;

  @Column()
  to?: number;

  @Column()
  is_open?: boolean;

}
