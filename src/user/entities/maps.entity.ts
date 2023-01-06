import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('maps')
export class Maps {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  about?: string;
}
