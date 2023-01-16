import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('progress')
export class ProgressEntity {
  @PrimaryGeneratedColumn()
  progress_id: number;

  @Column()
  user_id: number;

  @Column()
  chapter_id: number;
}

// CREATE TABLE public.progress (
// 	user_id int4 NOT NULL,
// 	chapter_id int4 NOT NULL,
// 	CONSTRAINT progress_pkey PRIMARY KEY (user_id, chapter_id),
// 	CONSTRAINT progress_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
// 	CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
// );
