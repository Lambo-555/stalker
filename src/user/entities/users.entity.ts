import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  funds?: number;

  @Column({ nullable: true })
  telegram_id?: number;

  @Column({ nullable: true })
  inventory?: string;
}

// CREATE TABLE public.users (
// 	id serial4 NOT NULL,
// 	"name" varchar(255) NOT NULL,
// 	inventory varchar(255) NOT NULL DEFAULT '{}'::character varying,
// 	funds int4 NOT NULL DEFAULT 12500,
// 	CONSTRAINT users_pkey PRIMARY KEY (id)
// );