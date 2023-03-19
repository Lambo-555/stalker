import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('choices')
export class ChoicesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  next_code: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  will?: number;

}