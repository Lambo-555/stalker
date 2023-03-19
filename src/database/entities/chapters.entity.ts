import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chapters')
export class ChaptersEntity {
  @PrimaryGeneratedColumn()
  code: string;

  @Column({ nullable: true })
  character?: string;

  @Column({ default: 'default', nullable: true })
  content?: string;

  @Column()
  image?: string;

  @Column()
  location?: string;
}
