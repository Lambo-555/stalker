import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stories')
export class StoriesEntity {
  @PrimaryGeneratedColumn()
  name: string;

  @Column()
  cost?: number;
}
