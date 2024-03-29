import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('progress')
export class ProgressEntity {
  @PrimaryGeneratedColumn()
  progress_id: number;

  @Column()
  user_id: number;

  @Column()
  chapter_code: string;

  @Column()
  story: string;

}
