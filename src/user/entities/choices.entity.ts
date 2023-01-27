import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('choices')
export class ChoicesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chapter_id: number;

  @Column({ default: 'default', nullable: true })
  inventory_required: string;

  @Column()
  next_chapter_id: number;

  @Column({ nullable: true })
  description: string;
}

// CREATE TABLE public.choices (
// 	id serial4 NOT NULL,
// 	chapter_id int4 NOT NULL,
// 	inventory_required varchar(255) NOT NULL DEFAULT '{}'::character varying,
// 	next_chapter_id int4 NOT NULL,
// 	description varchar(255) NOT NULL,
// 	CONSTRAINT choices_pkey PRIMARY KEY (id),
// 	CONSTRAINT choices_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
// 	CONSTRAINT choices_next_chapter_id_fkey FOREIGN KEY (next_chapter_id) REFERENCES public.chapters(id)
// );
