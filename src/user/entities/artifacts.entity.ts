import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('artifacts')
export class Artifacts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  price?: number;

  @Column({ nullable: true })
  effects?: string;

  @Column({ nullable: true })
  anomaly?: number;

  @Column({ nullable: true })
  about?: string;
}
