import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('anomalies')
export class Anomalies {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  effects?: string;

  @Column({ nullable: true })
  about?: string;
}
