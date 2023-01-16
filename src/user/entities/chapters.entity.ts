import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chapters')
export class ChaptersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  character?: string;

  @Column({ default: 'default', nullable: true })
  content?: string;

  @Column({ default: 'default', nullable: true })
  inventory_required?: string;

  @Column()
  location: number;

  @Column()
  quest?: number;
}

// CREATE TABLE public.chapters (
// 	id serial4 NOT NULL,
// 	title varchar(255) NOT NULL,
// 	"content" text NOT NULL,
// 	inventory_required varchar(255) NOT NULL DEFAULT '{}'::character varying,
// 	CONSTRAINT chapters_pkey PRIMARY KEY (id)
// );
